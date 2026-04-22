import type { RefObject } from "react";

export function waitForVideoElement(videoRef: RefObject<HTMLVideoElement>) {
  return new Promise<HTMLVideoElement>((resolve, reject) => {
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
  });
}
