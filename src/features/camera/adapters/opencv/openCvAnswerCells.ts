import type { AnswerCell, OpenCvNamespace, OpenCvMat } from "./openCvTypes";

export function buildAnswerCells() {
  const allCells: AnswerCell[] = [];
  const cellWidth = (900 - 80) / 6;
  const cellHeight = (1100 - 80) / 11;
  for (let row = 1; row < 11; row += 1) {
    for (let col = 1; col < 6; col += 1) {
      allCells.push({ q: row - 1, alt: col - 1, x: Math.floor(40 + col * cellWidth), y: Math.floor(40 + row * cellHeight), w: Math.floor(cellWidth), h: Math.floor(cellHeight) });
    }
  }
  return { cells: allCells, rows: 10, cols: 5, startX: 40, startY: 40, cellWidth, cellHeight };
}

export function readCellIntensities(cv: OpenCvNamespace, warpedGray: OpenCvMat, cells: AnswerCell[]) {
  return cells.map((cell) => {
    const roi = warpedGray.roi(new cv.Rect(cell.x, cell.y, cell.w, cell.h));
    const meanValue = cv.mean(roi)[0];
    roi.delete();
    return meanValue;
  });
}
