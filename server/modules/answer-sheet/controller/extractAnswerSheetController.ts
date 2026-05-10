import type { RequestHandler } from "express";

import { AnswerSheetAiFallbackError, AnswerSheetReadError } from "../domain/answerSheetError.js";
import {
  MAX_ALTERNATIVE_COUNT,
  MAX_QUESTION_COUNT,
  MIN_ALTERNATIVE_COUNT,
  MIN_QUESTION_COUNT,
} from "../domain/answerSheetConfig.js";
import { extractAnswerSheetFromImageBase64 } from "../../../services/extractAnswerSheet.js";

export const extractAnswerSheetController: RequestHandler = async (request, response) => {
  const imageBase64 = String(request.body?.imageBase64 ?? "").trim();
  const rawQuestionCount = request.body?.expectedQuestionCount;
  const rawAlternativeCount = request.body?.expectedAlternativeCount;

  if (!imageBase64) {
    response.status(400).json({ error: "Envie imageBase64 com a foto do gabarito." });
    return;
  }

  if (rawQuestionCount !== undefined) {
    const parsed = Number(rawQuestionCount);
    if (!Number.isInteger(parsed) || parsed < MIN_QUESTION_COUNT || parsed > MAX_QUESTION_COUNT) {
      response.status(400).json({
        error: `expectedQuestionCount deve ser um inteiro entre ${MIN_QUESTION_COUNT} e ${MAX_QUESTION_COUNT}.`,
      });
      return;
    }
  }

  if (rawAlternativeCount !== undefined) {
    const parsed = Number(rawAlternativeCount);
    if (!Number.isInteger(parsed) || parsed < MIN_ALTERNATIVE_COUNT || parsed > MAX_ALTERNATIVE_COUNT) {
      response.status(400).json({
        error: `expectedAlternativeCount deve ser um inteiro entre ${MIN_ALTERNATIVE_COUNT} e ${MAX_ALTERNATIVE_COUNT}.`,
      });
      return;
    }
  }

  try {
    response.json(
      await extractAnswerSheetFromImageBase64(imageBase64, {
        expectedQuestionCount: rawQuestionCount,
        expectedAlternativeCount: rawAlternativeCount,
      })
    );
  } catch (error) {
    if (error instanceof AnswerSheetAiFallbackError) {
      response.status(503).json({ error: error.message });
      return;
    }

    if (error instanceof AnswerSheetReadError) {
      response.status(422).json({ error: error.message });
      return;
    }

    response.status(500).json({
      error: error instanceof Error ? error.message : "Falha inesperada ao ler o gabarito.",
    });
  }
};
