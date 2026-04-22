import { ANSWER_SHEET_READER_CONFIG } from "./answerSheetConfig.js";
import type { BitmapLikeImage, Cell, TableRegion } from "./answerSheetTypes.js";

export function analyzeCells(grayscaleImage: BitmapLikeImage, table: TableRegion): Cell[] {
  const cells: Cell[] = [];
  for (let row = 0; row < table.rowCount; row += 1) {
    for (let col = 0; col < table.colCount; col += 1) {
      const x = table.x + col * table.cellWidth;
      const y = table.y + row * table.cellHeight;
      cells.push({ row, col, intensity: analyzeCellMeanIntensity(grayscaleImage, x, y, table.cellWidth, table.cellHeight) });
    }
  }
  return cells;
}

function analyzeCellMeanIntensity(
  grayscaleImage: BitmapLikeImage,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const startX = Math.max(0, Math.floor(x + width * ANSWER_SHEET_READER_CONFIG.cellSampleMargin));
  const startY = Math.max(0, Math.floor(y + height * ANSWER_SHEET_READER_CONFIG.cellSampleMargin));
  const endX = Math.min(grayscaleImage.bitmap.width, Math.ceil(x + width * (1 - ANSWER_SHEET_READER_CONFIG.cellSampleMargin)));
  const endY = Math.min(grayscaleImage.bitmap.height, Math.ceil(y + height * (1 - ANSWER_SHEET_READER_CONFIG.cellSampleMargin)));
  let pixelCount = 0;
  let pixelSum = 0;
  for (let pixelY = startY; pixelY < endY; pixelY += 1) {
    for (let pixelX = startX; pixelX < endX; pixelX += 1) {
      pixelSum += grayscaleImage.bitmap.data[(pixelY * grayscaleImage.bitmap.width + pixelX) * 4];
      pixelCount += 1;
    }
  }
  return pixelCount > 0 ? pixelSum / pixelCount : 255;
}
