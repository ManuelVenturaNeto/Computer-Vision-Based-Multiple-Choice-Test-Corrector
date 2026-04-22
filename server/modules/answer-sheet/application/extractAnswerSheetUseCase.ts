import { ANSWER_SHEET_READER_CONFIG } from "../domain/answerSheetConfig.js";
import { analyzeCells } from "../domain/answerSheetCells.js";
import { extractAnswers } from "../domain/answerSheetClassification.js";
import { buildNormalizedTable, cropAndScaleToNormalized } from "../domain/answerSheetNormalization.js";
import { buildUsefulTable, locateTableRegion } from "../domain/answerSheetProjection.js";
import { AnswerSheetReadError } from "../domain/answerSheetError.js";
import { calculateOtsuThreshold, buildBinaryImage, clampQuestionCount } from "../domain/answerSheetThresholds.js";
import type { AnswerSheetReadOptions } from "../domain/answerSheetTypes.js";
import type { AnswerSheetImagePort } from "../ports/answerSheetImagePort.js";

export async function extractAnswerSheetUseCase(
  imageBase64: string,
  options: AnswerSheetReadOptions,
  imagePort: AnswerSheetImagePort
) {
  const expectedQuestionCount = clampQuestionCount(options.expectedQuestionCount);
  const { colorImage, grayscaleImage } = await imagePort.readInput(
    imageBase64,
    ANSWER_SHEET_READER_CONFIG.contrast
  );
  const fullTable = locateTableRegion(buildBinaryImage(grayscaleImage));
  const usefulTable = buildUsefulTable(
    fullTable,
    expectedQuestionCount ?? ANSWER_SHEET_READER_CONFIG.defaultQuestionCount
  );
  const normalizedGray = cropAndScaleToNormalized(grayscaleImage, fullTable.x, fullTable.y, fullTable.width, fullTable.height);
  const normalizedColor = cropAndScaleToNormalized(colorImage, fullTable.x, fullTable.y, fullTable.width, fullTable.height);
  const normalizedTable = buildNormalizedTable(usefulTable.rowCount);
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
    maskImage: await imagePort.buildMaskImage(normalizedColor, respostas),
    provider: "jimp" as const,
  };
}

export { AnswerSheetReadError };
