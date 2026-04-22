import type { RequestHandler } from "express";

import { AnswerSheetReadError } from "../domain/answerSheetError.js";
import { extractAnswerSheetFromImageBase64 } from "../../../services/extractAnswerSheet.js";

export const extractAnswerSheetController: RequestHandler = async (request, response) => {
  const imageBase64 = String(request.body?.imageBase64 ?? "").trim();
  const expectedQuestionCount = request.body?.expectedQuestionCount;

  if (!imageBase64) {
    response.status(400).json({ error: "Envie imageBase64 com a foto do gabarito." });
    return;
  }

  try {
    response.json(await extractAnswerSheetFromImageBase64(imageBase64, { expectedQuestionCount }));
  } catch (error) {
    if (error instanceof AnswerSheetReadError) {
      response.status(422).json({ error: error.message });
      return;
    }

    response.status(500).json({
      error: error instanceof Error ? error.message : "Falha inesperada ao ler o gabarito.",
    });
  }
};
