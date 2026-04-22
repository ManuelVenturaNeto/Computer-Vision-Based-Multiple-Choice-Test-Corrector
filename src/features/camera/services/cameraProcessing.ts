import { processAnswerSheet } from "./opencvAnswerSheet";
import type { CameraProcessingPort } from "../ports/cameraProcessingPort";

type StudentExtractionResponse = {
  nome: string;
  matricula: string;
};

export interface AnswerSheetReadResponse {
  numQuestoes: number;
  respostas: string[];
  warnings: string[];
  provider: "jimp" | "opencv.js";
  maskImage: string;
  table: {
    x: number;
    y: number;
    width: number;
    height: number;
    cellWidth: number;
    cellHeight: number;
    rowCount: number;
    colCount: number;
  };
}

const env = import.meta.env as ImportMetaEnv & {
  EXPO_PUBLIC_API_BASE_URL?: string;
};

const DEFAULT_API_BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://127.0.0.1:8787";

const API_BASE_URL = (
  env.VITE_API_BASE_URL ??
  env.EXPO_PUBLIC_API_BASE_URL ??
  DEFAULT_API_BASE_URL
)
  .trim()
  .replace(/\/$/, "");

function buildApiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : `Falha ao chamar ${path}.`;
    throw new Error(message);
  }

  return body as T;
}

export async function extractAlunoFromImage(imageDataUrl: string) {
  return postJson<StudentExtractionResponse>("/api/extract-student", {
    imageBase64: imageDataUrl,
  });
}

export async function readAnswerSheetFromImage(
  imageDataUrl: string,
  _expectedQuestionCount?: number,
  onProgress?: (status: string, progress?: number) => void
) {
  return processAnswerSheet(imageDataUrl, onProgress);
}

export const browserCameraProcessingAdapter: CameraProcessingPort = {
  extractAlunoFromImage,
  readAnswerSheetFromImage,
};
