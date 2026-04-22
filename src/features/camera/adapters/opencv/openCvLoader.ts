import type { OpenCvNamespace } from "./openCvTypes";

const OPENCV_URL = "https://docs.opencv.org/4.x/opencv.js";
let cvLoadPromise: Promise<void> | null = null;

declare global {
  interface Window {
    cv?: unknown;
  }
}

export function getOpenCv() {
  if (!isOpenCvNamespace(window.cv)) {
    throw new Error("OpenCV.js nao está disponivel.");
  }
  return window.cv;
}

export function ensureOpenCv() {
  if (isOpenCvNamespace(window.cv)) return Promise.resolve();
  if (cvLoadPromise) return cvLoadPromise;
  cvLoadPromise = new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Timeout ao carregar OpenCV.js")), 30000);
    const poll = () => window.setInterval(() => { if (isOpenCvNamespace(window.cv)) { window.clearTimeout(timeout); resolve(); } }, 100);
    if (document.querySelector('script[src*="opencv.js"]')) { poll(); return; }
    const script = document.createElement("script");
    script.src = OPENCV_URL;
    script.async = true;
    script.onload = poll;
    script.onerror = () => { window.clearTimeout(timeout); cvLoadPromise = null; reject(new Error("Falha ao carregar OpenCV.js")); };
    document.head.appendChild(script);
  });
  cvLoadPromise.catch(() => { cvLoadPromise = null; });
  return cvLoadPromise;
}

function isOpenCvNamespace(value: unknown): value is OpenCvNamespace {
  return typeof value === "object" && value !== null && "imread" in value && typeof value.imread === "function" && "Mat" in value && typeof value.Mat === "function";
}
