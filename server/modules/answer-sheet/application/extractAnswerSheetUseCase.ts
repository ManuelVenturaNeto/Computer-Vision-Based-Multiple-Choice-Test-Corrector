import {
  ANSWER_SHEET_READER_CONFIG,
  DEFAULT_ALTERNATIVE_COUNT,
  getTotalColsForAlternativeCount,
  getTotalRowsForQuestionCount,
} from "../domain/answerSheetConfig.js";
import { analyzeCells } from "../domain/answerSheetCells.js";
import { extractAnswers } from "../domain/answerSheetClassification.js";
import { buildNormalizedTable, cropAndScaleToNormalized } from "../domain/answerSheetNormalization.js";
import { buildUsefulTable, locateTableRegion } from "../domain/answerSheetProjection.js";
import { AnswerSheetReadError, AnswerSheetUnreadableError } from "../domain/answerSheetError.js";
import { calculateOtsuThreshold, buildBinaryImage, clampQuestionCount, clampAlternativeCount } from "../domain/answerSheetThresholds.js";
import type { AnswerSheetReadOptions } from "../domain/answerSheetTypes.js";
import type { AnswerSheetImagePort } from "../ports/answerSheetImagePort.js";
import type { AnswerSheetAiReaderPort } from "../ports/answerSheetAiReaderPort.js";

export async function extractAnswerSheetUseCase(
  imageBase64: string,
  options: AnswerSheetReadOptions,
  imagePort: AnswerSheetImagePort,
  aiReaderPort: AnswerSheetAiReaderPort | null
) {
  const questionCount =
    clampQuestionCount(options.expectedQuestionCount) ??
    ANSWER_SHEET_READER_CONFIG.defaultQuestionCount;
  const alternativeCount =
    clampAlternativeCount(options.expectedAlternativeCount) ?? DEFAULT_ALTERNATIVE_COUNT;

  try {
    const totalRows = getTotalRowsForQuestionCount(questionCount);
    const totalCols = getTotalColsForAlternativeCount(alternativeCount);
    const { colorImage, grayscaleImage } = await imagePort.readInput(
      imageBase64,
      ANSWER_SHEET_READER_CONFIG.contrast
    );
    const fullTable = locateTableRegion(buildBinaryImage(grayscaleImage), totalRows, totalCols);
    const usefulTable = buildUsefulTable(fullTable, questionCount, alternativeCount);
    const normalizedGray = cropAndScaleToNormalized(grayscaleImage, fullTable.x, fullTable.y, fullTable.width, fullTable.height);
    const normalizedColor = cropAndScaleToNormalized(colorImage, fullTable.x, fullTable.y, fullTable.width, fullTable.height);
    const normalizedTable = buildNormalizedTable(usefulTable.rowCount, totalCols);
    const cells = analyzeCells(normalizedGray, normalizedTable);
    const { respostas, warnings } = extractAnswers(
      cells,
      usefulTable.rowCount,
      calculateOtsuThreshold(cells.map((cell) => cell.intensity))
    );

    return {
      numQuestoes: usefulTable.rowCount,
      respostas,
      warnings,
      table: usefulTable,
      maskImage: await imagePort.buildMaskImage(normalizedColor, respostas, alternativeCount),
      provider: "jimp" as const,
    };
  } catch (error) {
    if (error instanceof AnswerSheetUnreadableError && aiReaderPort !== null) {
      console.warn(
        "[answer-sheet] pipeline classico falhou, acionando fallback de IA:",
        error.message
      );
      const aiResult = await aiReaderPort.readAnswers(imageBase64, questionCount, alternativeCount);
      return {
        numQuestoes: questionCount,
        respostas: aiResult.respostas,
        warnings: aiResult.warnings,
        table: {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          cellWidth: 0,
          cellHeight: 0,
          rowCount: questionCount,
          colCount: alternativeCount,
        },
        maskImage: "",
        provider: "openai" as const,
      };
    }
    throw error;
  }
}

export { AnswerSheetReadError };
