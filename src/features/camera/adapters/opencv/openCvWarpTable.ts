import type { OpenCvNamespace, OpenCvWarpResult } from "./openCvTypes";

export function warpAnswerSheet(cv: OpenCvNamespace, originalCanvas: HTMLCanvasElement): OpenCvWarpResult {
  const src = cv.imread(originalCanvas);
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const thresh = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  const approx = new cv.Mat();
  let srcPoints = new cv.Mat();
  let dstPoints = new cv.Mat();
  let transform = new cv.Mat();
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.threshold(blurred, thresh, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    const contour = getLargestContour(cv, contours);
    const peri = cv.arcLength(contour, true);
    cv.approxPolyDP(contour, approx, 0.02 * peri, true);
    if (approx.rows !== 4) throw new Error(`Cantos detectados: ${approx.rows} (esperado 4).`);
    const points = sortPerspectivePoints(approx.data32S);
    srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, points);
    dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, 900, 0, 900, 1100, 0, 1100]);
    transform = cv.getPerspectiveTransform(srcPoints, dstPoints);
    const warped = new cv.Mat();
    const warpedGray = new cv.Mat();
    cv.warpPerspective(src, warped, transform, new cv.Size(900, 1100));
    cv.cvtColor(warped, warpedGray, cv.COLOR_RGBA2GRAY);
    return { warped, warpedGray };
  } finally {
    src.delete(); gray.delete(); blurred.delete(); thresh.delete(); contours.delete(); hierarchy.delete(); approx.delete(); srcPoints.delete(); dstPoints.delete(); transform.delete();
  }
}

function getLargestContour(
  cv: OpenCvNamespace,
  contours: InstanceType<OpenCvNamespace["MatVector"]>
) {
  let maxArea = 0;
  let maxIndex = -1;
  for (let index = 0; index < contours.size(); index += 1) {
    const area = cv.contourArea(contours.get(index));
    if (area > maxArea) { maxArea = area; maxIndex = index; }
  }
  if (maxIndex === -1) throw new Error("Folha nao encontrada.");
  return contours.get(maxIndex);
}

function sortPerspectivePoints(data32S: Int32Array) {
  const points = Array.from({ length: 4 }, (_, index) => ({ x: data32S[index * 2], y: data32S[index * 2 + 1] })).sort((left, right) => left.x + left.y - (right.x + right.y));
  const [topLeft, , , bottomRight] = points;
  const topRight = points.find((point) => point.x > topLeft.x && point.y < bottomRight.y) ?? points[1];
  const bottomLeft = points.find((point) => point.x < bottomRight.x && point.y > topLeft.y) ?? points[2];
  return [topLeft.x, topLeft.y, topRight.x, topRight.y, bottomRight.x, bottomRight.y, bottomLeft.x, bottomLeft.y];
}
