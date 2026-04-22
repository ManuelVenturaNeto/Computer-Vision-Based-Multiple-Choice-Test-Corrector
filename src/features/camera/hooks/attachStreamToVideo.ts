export async function attachStreamToVideo(video: HTMLVideoElement, stream: MediaStream) {
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.srcObject = stream;

  await new Promise<void>((resolve, reject) => {
    const finish = async () => {
      try {
        await video.play();
      } catch {}
      if (video.videoWidth > 0 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        cleanup();
        resolve();
      }
    };
    const timeout = window.setTimeout(() => { cleanup(); reject(new Error("A camera nao enviou frames para o video.")); }, 8000);
    const cleanup = () => {
      window.clearTimeout(timeout);
      ["loadedmetadata", "loadeddata", "canplay", "playing"].forEach((eventName) => video.removeEventListener(eventName, finish));
    };

    ["loadedmetadata", "loadeddata", "canplay", "playing"].forEach((eventName) => video.addEventListener(eventName, finish));
    void finish();
  });
}
