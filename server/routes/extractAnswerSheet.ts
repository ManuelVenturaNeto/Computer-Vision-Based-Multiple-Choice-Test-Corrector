import { Router } from "express";

import {
  AnswerSheetReadError,
  extractAnswerSheetFromImageBase64,
} from "../services/extractAnswerSheet.js";

export const extractAnswerSheetRouter = Router();

extractAnswerSheetRouter.post(
  "/extract-answer-sheet",
  async (request, response) => {
    const imageBase64 = String(request.body?.imageBase64 ?? "").trim();
    const expectedQuestionCount = request.body?.expectedQuestionCount;

    if (!imageBase64) {
      response.status(400).json({
        error: "Envie imageBase64 com a foto do gabarito.",
      });
      return;
    }

    try {
      const result = await extractAnswerSheetFromImageBase64(imageBase64, {
        expectedQuestionCount:
          typeof expectedQuestionCount === "number"
            ? expectedQuestionCount
            : undefined,
      });
      response.json(result);
    } catch (error) {
      if (error instanceof AnswerSheetReadError) {
        response.status(422).json({ error: error.message });
        return;
      }

      response.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Falha inesperada ao ler o gabarito.",
      });
    }
  }
);
