import type { RefObject } from "react";

export function captureVideoFrame(
  videoRef: RefObject<HTMLVideoElement>,
  canvasRef: RefObject<HTMLCanvasElement | null>
) {
  if (!videoRef.current || !canvasRef.current) {
    return null;
  }

  canvasRef.current.width = videoRef.current.videoWidth || 640;
  canvasRef.current.height = videoRef.current.videoHeight || 480;
  const context = canvasRef.current.getContext("2d");
  if (!context) {
    return null;
  }

  context.drawImage(videoRef.current, 0, 0);
  return canvasRef.current.toDataURL("image/jpeg", 0.92);
}
