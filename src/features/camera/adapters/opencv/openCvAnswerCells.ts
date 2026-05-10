import {
  DEFAULT_QUESTION_COUNT,
  EXAM_DEFAULT_ALTERNATIVE_RANGE,
  ALTERNATIVE_COUNT_BY_RANGE,
  MAX_QUESTION_COUNT,
  MIN_QUESTION_COUNT,
} from "../../constants";
import type { AnswerCell, OpenCvNamespace, OpenCvMat } from "./openCvTypes";

const NORMALIZED_WIDTH = 900;
const NORMALIZED_HEIGHT = 1100;
const TABLE_MARGIN = 40;
const HEADER_ROWS = 1;
const HEADER_COLS = 1;

const DEFAULT_ALTERNATIVE_COUNT: number = ALTERNATIVE_COUNT_BY_RANGE[EXAM_DEFAULT_ALTERNATIVE_RANGE];

export function buildAnswerCells(questionCount = DEFAULT_QUESTION_COUNT, alternativeCount: number = DEFAULT_ALTERNATIVE_COUNT) {
  const allCells: AnswerCell[] = [];
  const roundedQuestionCount = Number.isFinite(questionCount)
    ? Math.round(questionCount)
    : DEFAULT_QUESTION_COUNT;
  const normalizedQuestionCount = Math.min(
    MAX_QUESTION_COUNT,
    Math.max(MIN_QUESTION_COUNT, roundedQuestionCount)
  );
  const totalRows = normalizedQuestionCount + HEADER_ROWS;
  const totalCols = alternativeCount + HEADER_COLS;
  const cellWidth = (NORMALIZED_WIDTH - TABLE_MARGIN * 2) / totalCols;
  const cellHeight = (NORMALIZED_HEIGHT - TABLE_MARGIN * 2) / totalRows;

  for (let row = HEADER_ROWS; row < totalRows; row += 1) {
    for (let col = HEADER_COLS; col < totalCols; col += 1) {
      allCells.push({ q: row - 1, alt: col - 1, x: Math.floor(TABLE_MARGIN + col * cellWidth), y: Math.floor(TABLE_MARGIN + row * cellHeight), w: Math.floor(cellWidth), h: Math.floor(cellHeight) });
    }
  }

  return {
    cells: allCells,
    rows: normalizedQuestionCount,
    cols: alternativeCount,
    totalRows,
    totalCols,
    startX: TABLE_MARGIN,
    startY: TABLE_MARGIN,
    cellWidth,
    cellHeight,
  };
}

export function readCellIntensities(cv: OpenCvNamespace, warpedGray: OpenCvMat, cells: AnswerCell[]) {
  return cells.map((cell) => {
    const roi = warpedGray.roi(new cv.Rect(cell.x, cell.y, cell.w, cell.h));
    const meanValue = cv.mean(roi)[0];
    roi.delete();
    return meanValue;
  });
}
