export const ANSWER_OPTIONS = ["A", "B", "C", "D", "E"] as const;
export const NORMALIZED_WIDTH = 900;
export const NORMALIZED_HEIGHT = 1100;

export const ANSWER_SHEET_READER_CONFIG = {
  totalRows: 11,
  totalCols: 6,
  ignoreTopRows: 1,
  ignoreLeftCols: 1,
  defaultQuestionCount: 10,
  cellSampleMargin: 0.1,
  minMarkedDifference: 20,
  duplicateTolerance: 8,
  blankRowIntensity: 240,
  fullyDarkRowIntensity: 150,
  contrast: 0.5,
  projectionPeakMergeDistance: 12,
  rowPeakThresholdRatio: 0.45,
  colPeakThresholdRatio: 0.45,
} as const;

export const USEFUL_ROW_COUNT =
  ANSWER_SHEET_READER_CONFIG.totalRows - ANSWER_SHEET_READER_CONFIG.ignoreTopRows;
export const USEFUL_COL_COUNT =
  ANSWER_SHEET_READER_CONFIG.totalCols - ANSWER_SHEET_READER_CONFIG.ignoreLeftCols;
