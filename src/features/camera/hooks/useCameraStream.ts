import { useCallback, useRef, type RefObject } from "react";

import { attachStreamToVideo } from "./attachStreamToVideo";
import { captureVideoFrame } from "./captureVideoFrame";
import { getCameraErrorMessage } from "./cameraStreamErrorMessage";
import { waitForVideoElement } from "./waitForVideoElement";

export function useCameraStream() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
      throw new Error(getCameraErrorMessage(new Error("getUserMedia indisponivel")));
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } } });
      streamRef.current = stream;
      await attachStreamToVideo(await waitForVideoElement(videoRef), stream);
    } catch (primaryError) {
      stopCamera();
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        await attachStreamToVideo(await waitForVideoElement(videoRef), fallbackStream);
      } catch (fallbackError) {
        stopCamera();
        throw new Error(getCameraErrorMessage(fallbackError ?? primaryError));
      }
    }
  }, [stopCamera]);

  const captureFrame = useCallback((canvasRef: RefObject<HTMLCanvasElement | null>) => captureVideoFrame(videoRef, canvasRef), []);

  return { videoRef, startCamera, stopCamera, captureFrame };
}
