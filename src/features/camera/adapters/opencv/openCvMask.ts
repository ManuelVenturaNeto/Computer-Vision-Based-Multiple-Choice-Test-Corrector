import type { AnswerCell, OpenCvNamespace, OpenCvMat } from "./openCvTypes";

export function buildMaskImage(
  cv: OpenCvNamespace,
  warped: OpenCvMat,
  cells: AnswerCell[],
  detectedAlts: number[],
  grid: { rows: number; cols: number; startX: number; startY: number; cellWidth: number; cellHeight: number }
) {
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = 400;
  maskCanvas.height = 500;
  const warpedResult = warped.clone();
  const purple = new cv.Scalar(255, 0, 255);
  for (let row = 0; row <= 11; row += 1) cv.line(warpedResult, new cv.Point(grid.startX, grid.startY + row * grid.cellHeight), new cv.Point(grid.startX + 6 * grid.cellWidth, grid.startY + row * grid.cellHeight), purple, 2);
  for (let col = 0; col <= 6; col += 1) cv.line(warpedResult, new cv.Point(grid.startX + col * grid.cellWidth, grid.startY), new cv.Point(grid.startX + col * grid.cellWidth, grid.startY + 11 * grid.cellHeight), purple, 2);
  detectedAlts.forEach((alt, question) => drawAnswerMarker(cv, warpedResult, cells, question, alt));
  const resized = new cv.Mat();
  cv.resize(warpedResult, resized, new cv.Size(maskCanvas.width, maskCanvas.height), 0, 0, cv.INTER_AREA);
  cv.imshow(maskCanvas, resized);
  const maskImage = maskCanvas.toDataURL("image/png");
  warpedResult.delete();
  resized.delete();
  return maskImage;
}

function drawAnswerMarker(cv: OpenCvNamespace, warpedResult: OpenCvMat, cells: AnswerCell[], question: number, alt: number) {
  if (alt < 0) return;
  const cell = cells.find((candidate) => candidate.q === question && candidate.alt === alt);
  if (!cell) return;
  cv.circle(warpedResult, new cv.Point(cell.x + cell.w / 2, cell.y + cell.h / 2), Math.min(cell.w, cell.h) * 0.35, new cv.Scalar(0, 0, 255), -1);
}
