export const ALL_ANSWER_OPTIONS = ["A", "B", "C", "D", "E", "F"] as const;
export type AnswerOption = typeof ALL_ANSWER_OPTIONS[number];
export const MIN_ALTERNATIVE_COUNT = 4;
export const MAX_ALTERNATIVE_COUNT = 6;
export const DEFAULT_ALTERNATIVE_COUNT = 5;
export const ANSWER_OPTIONS = ALL_ANSWER_OPTIONS.slice(0, DEFAULT_ALTERNATIVE_COUNT);

export const NORMALIZED_WIDTH = 900;
export const NORMALIZED_HEIGHT = 1100;
export const DEFAULT_QUESTION_COUNT = 10;
export const MIN_QUESTION_COUNT = 1;
export const MAX_QUESTION_COUNT = 100;
export const HEADER_COLS = 1;

export const ANSWER_SHEET_READER_CONFIG = {
  totalRows: DEFAULT_QUESTION_COUNT + 1,
  ignoreTopRows: 1,
  ignoreLeftCols: HEADER_COLS,
  defaultQuestionCount: DEFAULT_QUESTION_COUNT,
  minQuestionCount: MIN_QUESTION_COUNT,
  maxQuestionCount: MAX_QUESTION_COUNT,
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

export function getTotalRowsForQuestionCount(questionCount: number) {
  return questionCount + ANSWER_SHEET_READER_CONFIG.ignoreTopRows;
}

export function getTotalColsForAlternativeCount(alternativeCount: number) {
  return alternativeCount + HEADER_COLS;
}
