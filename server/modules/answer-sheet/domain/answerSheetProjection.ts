import {
  ANSWER_SHEET_READER_CONFIG,
  USEFUL_COL_COUNT,
} from "./answerSheetConfig.js";
import type { BitmapLikeImage, FullTableRegion, TableRegion } from "./answerSheetTypes.js";

export function locateTableRegion(binaryImage: BitmapLikeImage) {
  const { rowSums, colSums } = buildProjectionSums(binaryImage);
  const horizontalPeaks = findPeakRegions(
    rowSums,
    binaryImage.bitmap.width * ANSWER_SHEET_READER_CONFIG.rowPeakThresholdRatio
  );
  const verticalPeaks = findPeakRegions(
    colSums,
    binaryImage.bitmap.height * ANSWER_SHEET_READER_CONFIG.colPeakThresholdRatio
  );

  if (
    horizontalPeaks.length < ANSWER_SHEET_READER_CONFIG.totalRows + 1 ||
    verticalPeaks.length < ANSWER_SHEET_READER_CONFIG.totalCols + 1
  ) {
    return buildFallbackFullTable(binaryImage);
  }

  const left = verticalPeaks[0];
  const top = horizontalPeaks[0];
  const width = Math.max(1, verticalPeaks[ANSWER_SHEET_READER_CONFIG.totalCols] - left);
  const height = Math.max(1, horizontalPeaks[ANSWER_SHEET_READER_CONFIG.totalRows] - top);

  return { x: left, y: top, width, height, cellWidth: width / 6, cellHeight: height / 11 };
}

export function buildUsefulTable(fullTable: FullTableRegion, rowCount: number): TableRegion {
  return {
    x: fullTable.x + fullTable.cellWidth * ANSWER_SHEET_READER_CONFIG.ignoreLeftCols,
    y: fullTable.y + fullTable.cellHeight * ANSWER_SHEET_READER_CONFIG.ignoreTopRows,
    width: fullTable.cellWidth * USEFUL_COL_COUNT,
    height: fullTable.cellHeight * rowCount,
    cellWidth: fullTable.cellWidth,
    cellHeight: fullTable.cellHeight,
    rowCount,
    colCount: USEFUL_COL_COUNT,
  };
}

function buildProjectionSums(binaryImage: BitmapLikeImage) {
  const rowSums = Array.from({ length: binaryImage.bitmap.height }, (_, y) => sumRow(binaryImage, y));
  const colSums = Array.from({ length: binaryImage.bitmap.width }, (_, x) => sumCol(binaryImage, x));
  return { rowSums, colSums };
}

function findPeakRegions(sums: number[], minValue: number) {
  const peaks: number[] = [];
  let inPeak = false;
  let startIndex = 0;
  for (let index = 0; index < sums.length; index += 1) {
    if (sums[index] > minValue && !inPeak) { inPeak = true; startIndex = index; continue; }
    if (sums[index] <= minValue && inPeak) { inPeak = false; peaks.push(Math.floor((startIndex + index - 1) / 2)); }
  }
  if (inPeak) peaks.push(Math.floor((startIndex + sums.length - 1) / 2));
  return peaks.filter((peak, index) => index === 0 || peak - peaks[index - 1] > ANSWER_SHEET_READER_CONFIG.projectionPeakMergeDistance);
}

function buildFallbackFullTable(binaryImage: BitmapLikeImage): FullTableRegion {
  const { width, height } = binaryImage.bitmap;
  return { x: 0, y: 0, width, height, cellWidth: width / 6, cellHeight: height / 11 };
}

function sumRow(binaryImage: BitmapLikeImage, row: number) {
  let total = 0;
  for (let x = 0; x < binaryImage.bitmap.width; x += 1) total += pixelIsDark(binaryImage, row, x);
  return total;
}

function sumCol(binaryImage: BitmapLikeImage, col: number) {
  let total = 0;
  for (let y = 0; y < binaryImage.bitmap.height; y += 1) total += pixelIsDark(binaryImage, y, col);
  return total;
}

function pixelIsDark(binaryImage: BitmapLikeImage, y: number, x: number) {
  return binaryImage.bitmap.data[(y * binaryImage.bitmap.width + x) * 4] === 0 ? 1 : 0;
}
