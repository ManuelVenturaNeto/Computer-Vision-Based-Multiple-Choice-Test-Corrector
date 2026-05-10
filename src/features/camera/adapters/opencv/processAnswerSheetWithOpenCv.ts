import { buildAnswerCells, readCellIntensities } from "./openCvAnswerCells";
import { detectAnswers } from "./openCvDetection";
import { drawImageToCanvas } from "./openCvImage";
import { ensureOpenCv, getOpenCv } from "./openCvLoader";
import { buildMaskImage } from "./openCvMask";
import type { AnswerSheetResult } from "./openCvTypes";
import { warpAnswerSheet } from "./openCvWarpTable";
import { DEFAULT_QUESTION_COUNT, EXAM_DEFAULT_ALTERNATIVE_RANGE, ALTERNATIVE_COUNT_BY_RANGE } from "../../constants";

const DEFAULT_ALTERNATIVE_COUNT: number = ALTERNATIVE_COUNT_BY_RANGE[EXAM_DEFAULT_ALTERNATIVE_RANGE];

export async function processAnswerSheetWithOpenCv(
  imageDataUrl: string,
  expectedQuestionCount = DEFAULT_QUESTION_COUNT,
  expectedAlternativeCount = DEFAULT_ALTERNATIVE_COUNT,
  onProgress?: (status: string) => void
): Promise<AnswerSheetResult> {
  onProgress?.("Carregando OpenCV...");
  await ensureOpenCv();
  const cv = getOpenCv();
  onProgress?.("Processando imagem...");

  const originalCanvas = await drawImageToCanvas(imageDataUrl);
  const { warped, warpedGray } = warpAnswerSheet(cv, originalCanvas);
  try {
    const grid = buildAnswerCells(expectedQuestionCount, expectedAlternativeCount);
    const intensidades = readCellIntensities(cv, warpedGray, grid.cells);
    const { respostas, detectedAlts } = detectAnswers(intensidades, grid.rows, grid.cols);
    const maskImage = buildMaskImage(cv, warped, grid.cells, detectedAlts, grid);

    return {
      numQuestoes: grid.rows,
      respostas,
      warnings: [],
      provider: "opencv.js",
      maskImage,
      table: { x: grid.startX + grid.cellWidth, y: grid.startY + grid.cellHeight, width: grid.cols * grid.cellWidth, height: grid.rows * grid.cellHeight, cellWidth: grid.cellWidth, cellHeight: grid.cellHeight, rowCount: grid.rows, colCount: grid.cols },
    };
  } finally {
    warped.delete();
    warpedGray.delete();
  }
}
