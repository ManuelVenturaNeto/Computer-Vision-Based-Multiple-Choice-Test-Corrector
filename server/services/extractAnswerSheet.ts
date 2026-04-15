import { Jimp } from "jimp";

const ANSWER_OPTIONS = ["A", "B", "C", "D", "E"] as const;

// Target size for normalized analysis and mask image (same as the reference HTML tool)
const NORMALIZED_WIDTH = 900;
const NORMALIZED_HEIGHT = 1100;

interface BitmapLikeImage {
  bitmap: {
    width: number;
    height: number;
    data: Uint8Array;
  };
}

interface CloneableBitmapImage extends BitmapLikeImage {
  clone(): CloneableBitmapImage;
}

interface FullTableRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
}

export const ANSWER_SHEET_READER_CONFIG = {
  contrast: 0.5,
  minTableWidth: 300,
  minTableHeight: 200,
  horizontalLineDensityRatio: 0.12,
  verticalLineDensityRatio: 0.12,
  peakMergeDistance: 10,
  defaultQuestionCount: 10,
  maxQuestionCount: 10,
  totalRows: 11,
  totalCols: 6,
  ignoreTopRows: 1,
  ignoreLeftCols: 1,
  cellSampleMargin: 0.05,
  minMarkedDifference: 20,
  duplicateTolerance: 8,
  blankRowIntensity: 200,
  fullyDarkRowIntensity: 150,
} as const;

const USEFUL_ROW_COUNT =
  ANSWER_SHEET_READER_CONFIG.totalRows - ANSWER_SHEET_READER_CONFIG.ignoreTopRows;
const USEFUL_COL_COUNT =
  ANSWER_SHEET_READER_CONFIG.totalCols - ANSWER_SHEET_READER_CONFIG.ignoreLeftCols;

export interface Cell {
  row: number;
  col: number;
  intensity: number;
}

export interface TableRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
  rowCount: number;
  colCount: number;
}

export interface AnswerSheetExtraction {
  numQuestoes: number;
  respostas: string[];
  warnings: string[];
  table: TableRegion;
  maskImage: string;
  provider: "jimp";
}

export interface AnswerSheetReadOptions {
  expectedQuestionCount?: number;
}

export class AnswerSheetReadError extends Error {}

function clampQuestionCount(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  const normalized = Math.round(parsed);
  return normalized === USEFUL_ROW_COUNT ? normalized : undefined;
}

function imageBase64ToBuffer(imageBase64: string) {
  const normalized = imageBase64.trim();
  const base64 = normalized.startsWith("data:")
    ? normalized.split(",")[1] ?? ""
    : normalized;

  if (!base64) {
    throw new AnswerSheetReadError("Imagem invalida para leitura do gabarito.");
  }

  return Buffer.from(base64, "base64");
}

function calculateOtsuThresholdFromHistogram(histogram: number[], total: number) {
  let weightedSum = 0;
  for (let index = 0; index < histogram.length; index += 1) {
    weightedSum += index * histogram[index];
  }

  let sumBackground = 0;
  let weightBackground = 0;
  let bestVariance = -1;
  let threshold = 0;

  for (let index = 0; index < histogram.length; index += 1) {
    weightBackground += histogram[index];
    if (weightBackground === 0) {
      continue;
    }

    const weightForeground = total - weightBackground;
    if (weightForeground === 0) {
      break;
    }

    sumBackground += index * histogram[index];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground =
      (weightedSum - sumBackground) / weightForeground;
    const betweenClassVariance =
      weightBackground *
      weightForeground *
      (meanBackground - meanForeground) *
      (meanBackground - meanForeground);

    if (betweenClassVariance > bestVariance) {
      bestVariance = betweenClassVariance;
      threshold = index;
    }
  }

  return threshold;
}

function calculateOtsuThreshold(values: number[]) {
  const histogram = new Array(256).fill(0);

  values.forEach((value) => {
    const bucket = Math.max(0, Math.min(255, Math.floor(value)));
    histogram[bucket] += 1;
  });

  return calculateOtsuThresholdFromHistogram(histogram, values.length);
}

function buildBinaryImage(grayscaleImage: CloneableBitmapImage) {
  const binaryImage = grayscaleImage.clone();
  const { width, height, data } = grayscaleImage.bitmap;
  const histogram = new Array(256).fill(0);

  for (let index = 0; index < data.length; index += 4) {
    histogram[data[index]] += 1;
  }

  const otsuThreshold = calculateOtsuThresholdFromHistogram(
    histogram,
    width * height
  );

  for (let index = 0; index < data.length; index += 4) {
    const pixelValue = data[index];
    const output = pixelValue <= otsuThreshold ? 0 : 255;

    binaryImage.bitmap.data[index] = output;
    binaryImage.bitmap.data[index + 1] = output;
    binaryImage.bitmap.data[index + 2] = output;
    binaryImage.bitmap.data[index + 3] = 255;
  }

  return { binaryImage, otsuThreshold };
}

function findPeakRegions(
  sums: number[],
  minValue: number,
  mergeDistance: number
): number[] {
  const peaks: number[] = [];
  let inPeak = false;
  let startIdx = 0;

  for (let index = 0; index < sums.length; index += 1) {
    if (sums[index] > minValue && !inPeak) {
      inPeak = true;
      startIdx = index;
      continue;
    }

    if (sums[index] <= minValue && inPeak) {
      inPeak = false;
      peaks.push(Math.floor((startIdx + index - 1) / 2));
    }
  }

  if (inPeak) {
    peaks.push(Math.floor((startIdx + sums.length - 1) / 2));
  }

  const mergedPeaks: number[] = [];
  for (const peak of peaks) {
    const previous = mergedPeaks[mergedPeaks.length - 1];
    if (previous === undefined || peak - previous > mergeDistance) {
      mergedPeaks.push(peak);
    }
  }

  return mergedPeaks;
}

function buildProjectionSums(binaryImage: BitmapLikeImage) {
  const width = binaryImage.bitmap.width;
  const height = binaryImage.bitmap.height;
  const rowSums: number[] = [];
  const colSums: number[] = [];

  for (let y = 0; y < height; y += 1) {
    let sum = 0;
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      if (binaryImage.bitmap.data[idx] === 0) {
        sum += 1;
      }
    }
    rowSums.push(sum);
  }

  for (let x = 0; x < width; x += 1) {
    let sum = 0;
    for (let y = 0; y < height; y += 1) {
      const idx = (y * width + x) * 4;
      if (binaryImage.bitmap.data[idx] === 0) {
        sum += 1;
      }
    }
    colSums.push(sum);
  }

  return { rowSums, colSums };
}

function findUsefulTableRegion(
  binaryImage: BitmapLikeImage,
  expectedQuestionCount?: number
) {
  const width = binaryImage.bitmap.width;
  const height = binaryImage.bitmap.height;
  const { rowSums, colSums } = buildProjectionSums(binaryImage);

  const horizontalLines = findPeakRegions(
    rowSums,
    width * ANSWER_SHEET_READER_CONFIG.horizontalLineDensityRatio,
    ANSWER_SHEET_READER_CONFIG.peakMergeDistance
  );

  if (horizontalLines.length < 2) {
    throw new AnswerSheetReadError(
      "Nao foi possivel detectar linhas suficientes da tabela."
    );
  }

  const verticalLines = findPeakRegions(
    colSums,
    height * ANSWER_SHEET_READER_CONFIG.verticalLineDensityRatio,
    ANSWER_SHEET_READER_CONFIG.peakMergeDistance
  );

  if (verticalLines.length < 2) {
    throw new AnswerSheetReadError(
      "Nao foi possivel detectar colunas suficientes da tabela."
    );
  }

  const usefulRows =
    clampQuestionCount(expectedQuestionCount) ??
    ANSWER_SHEET_READER_CONFIG.defaultQuestionCount;
  const fullRows = usefulRows + ANSWER_SHEET_READER_CONFIG.ignoreTopRows;
  const fullCols = USEFUL_COL_COUNT + ANSWER_SHEET_READER_CONFIG.ignoreLeftCols;

  const topY = horizontalLines[0];
  const bottomY = horizontalLines[horizontalLines.length - 1];
  const leftX = verticalLines[0];
  const rightX = verticalLines[verticalLines.length - 1];

  const fullTable: FullTableRegion = {
    x: leftX,
    y: topY,
    width: rightX - leftX,
    height: bottomY - topY,
    cellWidth: (rightX - leftX) / fullCols,
    cellHeight: (bottomY - topY) / fullRows,
  };

  if (
    fullTable.width < ANSWER_SHEET_READER_CONFIG.minTableWidth ||
    fullTable.height < ANSWER_SHEET_READER_CONFIG.minTableHeight
  ) {
    throw new AnswerSheetReadError(
      "Regiao da tabela muito pequena. Verifique a imagem capturada."
    );
  }

  return {
    fullTable,
    usefulTable: {
      x:
        fullTable.x +
        fullTable.cellWidth * ANSWER_SHEET_READER_CONFIG.ignoreLeftCols,
      y:
        fullTable.y +
        fullTable.cellHeight * ANSWER_SHEET_READER_CONFIG.ignoreTopRows,
      width: fullTable.cellWidth * USEFUL_COL_COUNT,
      height: fullTable.cellHeight * usefulRows,
      cellWidth: fullTable.cellWidth,
      cellHeight: fullTable.cellHeight,
      rowCount: usefulRows,
      colCount: USEFUL_COL_COUNT,
    } satisfies TableRegion,
  };
}

// Crops the detected table region from `src` and scales it to NORMALIZED_WIDTH × NORMALIZED_HEIGHT
// using nearest-neighbor interpolation, matching what the HTML reference tool does after warpPerspective.
function cropAndScaleToNormalized(
  src: BitmapLikeImage,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number
): BitmapLikeImage {
  const dstW = NORMALIZED_WIDTH;
  const dstH = NORMALIZED_HEIGHT;
  const data = new Uint8Array(dstW * dstH * 4);

  for (let dy = 0; dy < dstH; dy += 1) {
    for (let dx = 0; dx < dstW; dx += 1) {
      const sx = Math.max(
        0,
        Math.min(src.bitmap.width - 1, Math.floor(cropX + (dx * cropW) / dstW))
      );
      const sy = Math.max(
        0,
        Math.min(src.bitmap.height - 1, Math.floor(cropY + (dy * cropH) / dstH))
      );
      const sIdx = (sy * src.bitmap.width + sx) * 4;
      const dIdx = (dy * dstW + dx) * 4;
      data[dIdx] = src.bitmap.data[sIdx];
      data[dIdx + 1] = src.bitmap.data[sIdx + 1];
      data[dIdx + 2] = src.bitmap.data[sIdx + 2];
      data[dIdx + 3] = 255;
    }
  }

  return { bitmap: { width: dstW, height: dstH, data } };
}

// Returns a TableRegion for the 10×5 useful cells on the normalized 900×1100 canvas.
// The 11×6 grid divides the canvas uniformly (no extra margin needed since we cropped to the table borders).
function buildNormalizedTable(usefulRows: number): TableRegion {
  const cellW = NORMALIZED_WIDTH / ANSWER_SHEET_READER_CONFIG.totalCols;
  const cellH = NORMALIZED_HEIGHT / ANSWER_SHEET_READER_CONFIG.totalRows;
  return {
    x: cellW * ANSWER_SHEET_READER_CONFIG.ignoreLeftCols,
    y: cellH * ANSWER_SHEET_READER_CONFIG.ignoreTopRows,
    width: cellW * USEFUL_COL_COUNT,
    height: cellH * usefulRows,
    cellWidth: cellW,
    cellHeight: cellH,
    rowCount: usefulRows,
    colCount: USEFUL_COL_COUNT,
  };
}

function analyzeCellMeanIntensity(
  grayscaleImage: BitmapLikeImage,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const marginX = width * ANSWER_SHEET_READER_CONFIG.cellSampleMargin;
  const marginY = height * ANSWER_SHEET_READER_CONFIG.cellSampleMargin;

  const startX = Math.max(0, Math.floor(x + marginX));
  const startY = Math.max(0, Math.floor(y + marginY));
  const endX = Math.min(
    grayscaleImage.bitmap.width,
    Math.ceil(x + width - marginX)
  );
  const endY = Math.min(
    grayscaleImage.bitmap.height,
    Math.ceil(y + height - marginY)
  );

  let pixelCount = 0;
  let pixelSum = 0;

  for (let py = startY; py < endY; py += 1) {
    for (let px = startX; px < endX; px += 1) {
      const idx = (py * grayscaleImage.bitmap.width + px) * 4;
      pixelSum += grayscaleImage.bitmap.data[idx];
      pixelCount += 1;
    }
  }

  return pixelCount > 0 ? pixelSum / pixelCount : 255;
}

function analyzeCells(grayscaleImage: BitmapLikeImage, table: TableRegion): Cell[] {
  const cells: Cell[] = [];

  for (let row = 0; row < table.rowCount; row += 1) {
    for (let col = 0; col < table.colCount; col += 1) {
      const x = table.x + col * table.cellWidth;
      const y = table.y + row * table.cellHeight;

      cells.push({
        row,
        col,
        intensity: analyzeCellMeanIntensity(
          grayscaleImage,
          x,
          y,
          table.cellWidth,
          table.cellHeight
        ),
      });
    }
  }

  return cells;
}

function extractAnswers(
  cells: Cell[],
  rowCount: number,
  threshold: number
) {
  const respostas: string[] = [];
  const warnings: string[] = [];
  let blankLikeRows = 0;
  let fullyDarkRows = 0;

  for (let row = 0; row < rowCount; row += 1) {
    const rowCells = cells
      .filter((cell) => cell.row === row)
      .sort((left, right) => left.col - right.col);

    const rowIntensities = rowCells.map((cell) => cell.intensity);
    const sortedByDarkness = [...rowCells].sort(
      (left, right) => left.intensity - right.intensity
    );

    const bestCell = sortedByDarkness[0];
    const secondCell = sortedByDarkness[1];
    const minIntensity = bestCell?.intensity ?? 255;
    const secondIntensity = secondCell?.intensity ?? 255;
    const maxIntensity = Math.max(...rowIntensities);
    const contrastDelta = maxIntensity - minIntensity;

    const belowThreshold = Math.floor(minIntensity) <= threshold;
    const hasStrongContrast =
      contrastDelta > ANSWER_SHEET_READER_CONFIG.minMarkedDifference;
    const hasCompetingDarkCell =
      Math.floor(secondIntensity) <= threshold &&
      secondIntensity - minIntensity <=
        ANSWER_SHEET_READER_CONFIG.duplicateTolerance;

    if (minIntensity > ANSWER_SHEET_READER_CONFIG.blankRowIntensity) {
      blankLikeRows += 1;
    }

    if (maxIntensity < ANSWER_SHEET_READER_CONFIG.fullyDarkRowIntensity) {
      fullyDarkRows += 1;
    }

    if (belowThreshold && hasStrongContrast && !hasCompetingDarkCell && bestCell) {
      respostas.push(ANSWER_OPTIONS[bestCell.col] ?? "");
      continue;
    }

    respostas.push("");

    if (hasCompetingDarkCell) {
      const markedOptions = sortedByDarkness
        .filter(
          (cell) =>
            Math.floor(cell.intensity) <= threshold &&
            cell.intensity - minIntensity <=
              ANSWER_SHEET_READER_CONFIG.duplicateTolerance
        )
        .map((cell) => ANSWER_OPTIONS[cell.col] ?? "?")
        .join(", ");

      warnings.push(
        `Questao ${row + 1} com multiplas marcacoes detectadas: ${markedOptions}.`
      );
      continue;
    }

    warnings.push(
      `Questao ${row + 1} sem uma marcacao valida destacada.`
    );
  }

  const validAnswers = respostas.filter(Boolean).length;
  if (validAnswers === 0) {
    if (blankLikeRows === rowCount) {
      throw new AnswerSheetReadError(
        "Gabarito em branco - nenhuma resposta detectada."
      );
    }

    if (fullyDarkRows === rowCount) {
      throw new AnswerSheetReadError(
        "Gabarito invalido - todas as celulas parecem marcadas."
      );
    }

    throw new AnswerSheetReadError(
      "Marcacoes inconsistentes - verifique se ha exatamente uma resposta por questao."
    );
  }

  return { respostas, warnings };
}

// Draws a horizontal line with the given color and thickness directly on bitmap data.
function drawHLine(
  data: Uint8Array,
  imgW: number,
  imgH: number,
  x1: number,
  x2: number,
  y: number,
  r: number,
  g: number,
  b: number,
  thickness: number
) {
  const half = Math.floor(thickness / 2);
  for (let t = -half; t <= half; t += 1) {
    const py = Math.round(y) + t;
    if (py < 0 || py >= imgH) continue;
    for (let px = Math.round(x1); px <= Math.round(x2); px += 1) {
      if (px < 0 || px >= imgW) continue;
      const idx = (py * imgW + px) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
}

// Draws a vertical line with the given color and thickness directly on bitmap data.
function drawVLine(
  data: Uint8Array,
  imgW: number,
  imgH: number,
  x: number,
  y1: number,
  y2: number,
  r: number,
  g: number,
  b: number,
  thickness: number
) {
  const half = Math.floor(thickness / 2);
  for (let t = -half; t <= half; t += 1) {
    const px = Math.round(x) + t;
    if (px < 0 || px >= imgW) continue;
    for (let py = Math.round(y1); py <= Math.round(y2); py += 1) {
      if (py < 0 || py >= imgH) continue;
      const idx = (py * imgW + px) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
}

// Draws a filled circle with the given color directly on bitmap data.
function drawFilledCircle(
  data: Uint8Array,
  imgW: number,
  imgH: number,
  cx: number,
  cy: number,
  radius: number,
  r: number,
  g: number,
  b: number
) {
  const r2 = radius * radius;
  for (let py = Math.floor(cy - radius); py <= Math.ceil(cy + radius); py += 1) {
    for (let px = Math.floor(cx - radius); px <= Math.ceil(cx + radius); px += 1) {
      if (px < 0 || px >= imgW || py < 0 || py >= imgH) continue;
      const dx = px - cx;
      const dy = py - cy;
      if (dx * dx + dy * dy <= r2) {
        const idx = (py * imgW + px) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
  }
}

// Builds the mask image: the normalized (warped) color image with a purple 11×6 grid
// and red filled circles on every detected answer. Matches the HTML reference tool's mask canvas.
async function buildMaskImage(
  normalizedColorImage: BitmapLikeImage,
  respostas: string[]
): Promise<string> {
  const { width, height } = normalizedColorImage.bitmap;

  // Create a Jimp image and copy the normalized color image data into it
  const jimpImg = new Jimp({ width, height, color: 0xffffffff });
  const d = jimpImg.bitmap.data as unknown as Uint8Array;

  for (let i = 0; i < normalizedColorImage.bitmap.data.length; i += 1) {
    d[i] = normalizedColorImage.bitmap.data[i];
  }

  const cellW = width / ANSWER_SHEET_READER_CONFIG.totalCols;
  const cellH = height / ANSWER_SHEET_READER_CONFIG.totalRows;
  const lineThickness = 2;

  // Purple grid — all (totalRows+1) horizontal lines and (totalCols+1) vertical lines
  for (let row = 0; row <= ANSWER_SHEET_READER_CONFIG.totalRows; row += 1) {
    const y = row * cellH;
    drawHLine(d, width, height, 0, width - 1, y, 255, 0, 255, lineThickness);
  }
  for (let col = 0; col <= ANSWER_SHEET_READER_CONFIG.totalCols; col += 1) {
    const x = col * cellW;
    drawVLine(d, width, height, x, 0, height - 1, 255, 0, 255, lineThickness);
  }

  // Red filled circles for each valid detected answer
  const ignoreTop = ANSWER_SHEET_READER_CONFIG.ignoreTopRows;
  const ignoreLeft = ANSWER_SHEET_READER_CONFIG.ignoreLeftCols;
  const circleRadius = Math.min(cellW, cellH) * 0.35;

  respostas.forEach((answer, questionIndex) => {
    if (!answer) return;
    const colIndex = ANSWER_OPTIONS.indexOf(answer as (typeof ANSWER_OPTIONS)[number]);
    if (colIndex < 0) return;

    const cx = (ignoreLeft + colIndex + 0.5) * cellW;
    const cy = (ignoreTop + questionIndex + 0.5) * cellH;
    drawFilledCircle(d, width, height, cx, cy, circleRadius, 255, 0, 0);
  });

  return jimpImg.getBase64("image/jpeg");
}

export async function extractAnswerSheetFromImageBase64(
  imageBase64: string,
  options: AnswerSheetReadOptions = {}
): Promise<AnswerSheetExtraction> {
  const imageBuffer = imageBase64ToBuffer(imageBase64);
  const image = await Jimp.read(imageBuffer);

  const grayscaleImage = image.clone().greyscale().contrast(
    ANSWER_SHEET_READER_CONFIG.contrast
  );
  const { binaryImage } = buildBinaryImage(grayscaleImage);
  const { fullTable, usefulTable } = findUsefulTableRegion(
    binaryImage,
    clampQuestionCount(options.expectedQuestionCount)
  );

  // --- Normalize the detected table region to 900×1100 ---
  // This mirrors the HTML tool's warpPerspective step: all cells become uniform,
  // eliminating resolution and minor distortion differences.
  const normalizedGray = cropAndScaleToNormalized(
    grayscaleImage,
    fullTable.x,
    fullTable.y,
    fullTable.width,
    fullTable.height
  );
  const normalizedColor = cropAndScaleToNormalized(
    image,
    fullTable.x,
    fullTable.y,
    fullTable.width,
    fullTable.height
  );

  const normalizedTable = buildNormalizedTable(usefulTable.rowCount);
  const cells = analyzeCells(normalizedGray, normalizedTable);
  const cellThreshold = calculateOtsuThreshold(cells.map((cell) => cell.intensity));
  const { respostas, warnings } = extractAnswers(
    cells,
    normalizedTable.rowCount,
    cellThreshold
  );

  const maskImage = await buildMaskImage(normalizedColor, respostas);

  return {
    numQuestoes: usefulTable.rowCount,
    respostas,
    warnings,
    table: usefulTable,
    maskImage,
    provider: "jimp",
  };
}
