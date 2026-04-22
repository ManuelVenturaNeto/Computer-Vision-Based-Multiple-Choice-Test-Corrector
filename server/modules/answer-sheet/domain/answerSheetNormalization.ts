import {
  ANSWER_SHEET_READER_CONFIG,
  NORMALIZED_HEIGHT,
  NORMALIZED_WIDTH,
  USEFUL_COL_COUNT,
} from "./answerSheetConfig.js";
import type { BitmapLikeImage, TableRegion } from "./answerSheetTypes.js";

export function cropAndScaleToNormalized(
  sourceImage: BitmapLikeImage,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const data = new Uint8Array(NORMALIZED_WIDTH * NORMALIZED_HEIGHT * 4);
  for (let targetY = 0; targetY < NORMALIZED_HEIGHT; targetY += 1) {
    for (let targetX = 0; targetX < NORMALIZED_WIDTH; targetX += 1) {
      const sourceX = clamp(Math.floor(x + (targetX * width) / NORMALIZED_WIDTH), sourceImage.bitmap.width - 1);
      const sourceY = clamp(Math.floor(y + (targetY * height) / NORMALIZED_HEIGHT), sourceImage.bitmap.height - 1);
      const sourceIndex = (sourceY * sourceImage.bitmap.width + sourceX) * 4;
      const targetIndex = (targetY * NORMALIZED_WIDTH + targetX) * 4;
      data[targetIndex] = sourceImage.bitmap.data[sourceIndex];
      data[targetIndex + 1] = sourceImage.bitmap.data[sourceIndex + 1];
      data[targetIndex + 2] = sourceImage.bitmap.data[sourceIndex + 2];
      data[targetIndex + 3] = 255;
    }
  }
  return { bitmap: { width: NORMALIZED_WIDTH, height: NORMALIZED_HEIGHT, data } };
}

export function buildNormalizedTable(rowCount: number): TableRegion {
  const cellWidth = NORMALIZED_WIDTH / ANSWER_SHEET_READER_CONFIG.totalCols;
  const cellHeight = NORMALIZED_HEIGHT / ANSWER_SHEET_READER_CONFIG.totalRows;
  return {
    x: cellWidth * ANSWER_SHEET_READER_CONFIG.ignoreLeftCols,
    y: cellHeight * ANSWER_SHEET_READER_CONFIG.ignoreTopRows,
    width: cellWidth * USEFUL_COL_COUNT,
    height: cellHeight * rowCount,
    cellWidth,
    cellHeight,
    rowCount,
    colCount: USEFUL_COL_COUNT,
  };
}

function clamp(value: number, max: number) {
  return Math.max(0, Math.min(max, value));
}
