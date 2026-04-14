import { useCallback, useRef, type RefObject } from "react";

function getCameraErrorMessage(error: unknown) {
  if (
    typeof window !== "undefined" &&
    !window.isSecureContext &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return "A camera do navegador no celular exige HTTPS. Abra este app por um link seguro (https) para liberar a camera.";
  }

  if (
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== "function"
  ) {
    return "Este navegador nao oferece suporte completo a camera. Tente Chrome ou Safari atualizados.";
  }

  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "O acesso a camera foi bloqueado. Libere a permissao da camera no navegador e tente novamente.";
    }

    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "Nenhuma camera foi encontrada neste dispositivo.";
    }

    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "A camera parece estar em uso por outro app. Feche outros aplicativos e tente novamente.";
    }
  }

  return "Nao foi possivel iniciar a camera neste celular. Voce ainda pode tirar ou selecionar uma foto.";
}

export function useCameraStream() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const waitForVideoElement = useCallback(
    () =>
      new Promise<HTMLVideoElement>((resolve, reject) => {
        let attempts = 0;

        const check = () => {
          if (videoRef.current) {
            resolve(videoRef.current);
            return;
          }

          attempts += 1;
          if (attempts > 60) {
            reject(new Error("Elemento de video nao ficou disponivel a tempo."));
            return;
          }

          window.requestAnimationFrame(check);
        };

        check();
      }),
    []
  );

  const attachStreamToVideo = useCallback(
    async (stream: MediaStream) => {
      const video = await waitForVideoElement();

      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      video.srcObject = stream;

      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          cleanup();
          reject(new Error("A camera nao enviou frames para o video."));
        }, 8000);

        const finish = async () => {
          try {
            await video.play();
          } catch {
            // Alguns navegadores moveis rejeitam o primeiro play, mas ainda
            // assim passam a entregar frames logo depois.
          }

          if (
            video.videoWidth > 0 &&
            video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
          ) {
            cleanup();
            resolve();
          }
        };

        const cleanup = () => {
          window.clearTimeout(timeout);
          video.removeEventListener("loadedmetadata", finish);
          video.removeEventListener("loadeddata", finish);
          video.removeEventListener("canplay", finish);
          video.removeEventListener("playing", finish);
        };

        video.addEventListener("loadedmetadata", finish);
        video.addEventListener("loadeddata", finish);
        video.addEventListener("canplay", finish);
        video.addEventListener("playing", finish);

        void finish();
      });
    },
    [waitForVideoElement]
  );

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();

    if (
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function"
    ) {
      throw new Error(getCameraErrorMessage(new Error("getUserMedia indisponivel")));
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      await attachStreamToVideo(stream);
    } catch (primaryError) {
      stopCamera();

      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        streamRef.current = fallbackStream;
        await attachStreamToVideo(fallbackStream);
      } catch (fallbackError) {
        stopCamera();
        throw new Error(getCameraErrorMessage(fallbackError ?? primaryError));
      }
    }
  }, [attachStreamToVideo, stopCamera]);

  const captureFrame = useCallback(
    (canvasRef: RefObject<HTMLCanvasElement | null>): string | null => {
      if (!videoRef.current || !canvasRef.current) return null;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const context = canvas.getContext("2d");
      if (!context) return null;

      context.drawImage(video, 0, 0);
      return canvas.toDataURL("image/jpeg", 0.92);
    },
    []
  );

  return { videoRef, startCamera, stopCamera, captureFrame };
}
