import { buildAnswerCells, readCellIntensities } from "./openCvAnswerCells";
import { detectAnswers } from "./openCvDetection";
import { drawImageToCanvas } from "./openCvImage";
import { ensureOpenCv, getOpenCv } from "./openCvLoader";
import { buildMaskImage } from "./openCvMask";
import type { AnswerSheetResult } from "./openCvTypes";
import { warpAnswerSheet } from "./openCvWarpTable";

export async function processAnswerSheetWithOpenCv(
  imageDataUrl: string,
  onProgress?: (status: string) => void
): Promise<AnswerSheetResult> {
  onProgress?.("Carregando OpenCV...");
  await ensureOpenCv();
  const cv = getOpenCv();
  onProgress?.("Processando imagem...");

  const originalCanvas = await drawImageToCanvas(imageDataUrl);
  const { warped, warpedGray } = warpAnswerSheet(cv, originalCanvas);
  try {
    const grid = buildAnswerCells();
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
