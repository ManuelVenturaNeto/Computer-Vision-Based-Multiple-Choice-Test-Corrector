export interface AnswerSheetResult {
  numQuestoes: number;
  respostas: string[];
  warnings: string[];
  provider: "opencv.js";
  maskImage: string;
  table: {
    x: number;
    y: number;
    width: number;
    height: number;
    cellWidth: number;
    cellHeight: number;
    rowCount: number;
    colCount: number;
  };
}

export interface OpenCvMat {
  rows: number;
  data32S: Int32Array;
  clone(): OpenCvMat;
  roi(rect: OpenCvRect): OpenCvMat;
  delete(): void;
}

export interface OpenCvMatVector {
  size(): number;
  get(index: number): OpenCvMat;
  delete(): void;
}

export interface OpenCvSize {}
export interface OpenCvRect {}
export interface OpenCvPoint {}
export interface OpenCvScalar {}
export interface OpenCvNamespace {
  Mat: new () => OpenCvMat;
  MatVector: new () => OpenCvMatVector;
  Size: new (width: number, height: number) => OpenCvSize;
  Rect: new (x: number, y: number, width: number, height: number) => OpenCvRect;
  Point: new (x: number, y: number) => OpenCvPoint;
  Scalar: new (v0: number, v1: number, v2: number, v3?: number) => OpenCvScalar;
  COLOR_RGBA2GRAY: number;
  THRESH_BINARY_INV: number;
  THRESH_OTSU: number;
  RETR_EXTERNAL: number;
  CHAIN_APPROX_SIMPLE: number;
  CV_32FC2: number;
  INTER_AREA: number;
  imread(canvas: HTMLCanvasElement): OpenCvMat;
  cvtColor(src: OpenCvMat, dst: OpenCvMat, code: number): void;
  GaussianBlur(src: OpenCvMat, dst: OpenCvMat, size: OpenCvSize, sigma: number): void;
  threshold(src: OpenCvMat, dst: OpenCvMat, threshold: number, max: number, type: number): void;
  findContours(src: OpenCvMat, contours: OpenCvMatVector, hierarchy: OpenCvMat, mode: number, method: number): void;
  contourArea(contour: OpenCvMat): number;
  arcLength(curve: OpenCvMat, closed: boolean): number;
  approxPolyDP(curve: OpenCvMat, approximated: OpenCvMat, epsilon: number, closed: boolean): void;
  matFromArray(rows: number, cols: number, type: number, values: number[]): OpenCvMat;
  getPerspectiveTransform(sourcePoints: OpenCvMat, destinationPoints: OpenCvMat): OpenCvMat;
  warpPerspective(src: OpenCvMat, dst: OpenCvMat, transform: OpenCvMat, size: OpenCvSize): void;
  mean(source: OpenCvMat): number[];
  line(image: OpenCvMat, p1: OpenCvPoint, p2: OpenCvPoint, color: OpenCvScalar, thickness: number): void;
  circle(image: OpenCvMat, center: OpenCvPoint, radius: number, color: OpenCvScalar, thickness: number): void;
  resize(src: OpenCvMat, dst: OpenCvMat, size: OpenCvSize, fx: number, fy: number, interpolation: number): void;
  imshow(canvas: HTMLCanvasElement, image: OpenCvMat): void;
}

export interface AnswerCell {
  q: number;
  alt: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface OpenCvWarpResult {
  warped: OpenCvMat;
  warpedGray: OpenCvMat;
}
