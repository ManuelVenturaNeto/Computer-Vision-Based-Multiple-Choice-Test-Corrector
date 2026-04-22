import { Jimp } from "jimp";

import { AnswerSheetReadError } from "../../domain/answerSheetError.js";

export async function loadJimpImage(imageBase64: string) {
  const normalized = imageBase64.trim();
  const base64 = normalized.startsWith("data:") ? normalized.split(",")[1] ?? "" : normalized;

  if (!base64) {
    throw new AnswerSheetReadError("Imagem invalida para leitura do gabarito.");
  }

  return Jimp.read(Buffer.from(base64, "base64"));
}
