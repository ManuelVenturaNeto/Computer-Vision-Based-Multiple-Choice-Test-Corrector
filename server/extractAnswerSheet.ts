import { Jimp } from "jimp";

const ANSWER_OPTIONS = ["A", "B", "C", "D", "E"] as const;

interface BitmapLikeImage {
  bitmap: {
    width: number;
    height: number;
    data: Uint8Array;
  };
}

// Ajuste estes valores para calibrar a leitura do gabarito.
export const ANSWER_SHEET_READER_CONFIG = {
  threshold: 128,
  contrast: 0.5,
  fillThreshold: 0.15,
  cellMargin: 0.2,
  minTableWidth: 300,
  minTableHeight: 200,
  horizontalLineDensityRatio: 0.2,
  verticalLineDensityRatio: 0.2,
  peakMergeDistance: 10,
  defaultQuestionCount: 10,
  maxQuestionCount: 50,
  columnCount: ANSWER_OPTIONS.length,
} as const;

export interface Cell {
  row: number;
  col: number;
  fillRatio: number;
  filled: boolean;
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
  if (normalized < 1 || normalized > ANSWER_SHEET_READER_CONFIG.maxQuestionCount) {
    return undefined;
  }

  return normalized;
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

  const filtered: number[] = [];
  for (const peak of peaks) {
    const previous = filtered.at(-1);
    if (previous === undefined || peak - previous > mergeDistance) {
      filtered.push(peak);
    }
  }

  return filtered;
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

function inferQuestionCount(horizontalLines: number[], expectedQuestionCount?: number) {
  const expected = clampQuestionCount(expectedQuestionCount);
  if (expected) {
    return expected;
  }

  const inferred =
    horizontalLines.length > 2
      ? horizontalLines.length - 1
      : ANSWER_SHEET_READER_CONFIG.defaultQuestionCount;

  return (
    clampQuestionCount(inferred) ??
    ANSWER_SHEET_READER_CONFIG.defaultQuestionCount
  );
}

function findTableRegion(
  binaryImage: BitmapLikeImage,
  expectedQuestionCount?: number
): TableRegion {
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

  const topY = horizontalLines[0];
  const bottomY = horizontalLines[horizontalLines.length - 1];
  const leftX = verticalLines[0];
  const rightX = verticalLines[verticalLines.length - 1];

  const tableWidth = rightX - leftX;
  const tableHeight = bottomY - topY;

  if (
    tableWidth < ANSWER_SHEET_READER_CONFIG.minTableWidth ||
    tableHeight < ANSWER_SHEET_READER_CONFIG.minTableHeight
  ) {
    throw new AnswerSheetReadError(
      "Regiao da tabela muito pequena. Verifique a imagem capturada."
    );
  }

  const rowCount = inferQuestionCount(horizontalLines, expectedQuestionCount);
  const colCount = ANSWER_SHEET_READER_CONFIG.columnCount;

  return {
    x: leftX,
    y: topY,
    width: tableWidth,
    height: tableHeight,
    cellWidth: tableWidth / colCount,
    cellHeight: tableHeight / rowCount,
    rowCount,
    colCount,
  };
}

function analyzeCellFillRatio(
  binaryImage: BitmapLikeImage,
  x: number,
  y: number,
  width: number,
  height: number
) {
  let darkPixels = 0;
  const totalPixels = width * height;

  for (let dy = 0; dy < height; dy += 1) {
    for (let dx = 0; dx < width; dx += 1) {
      const px = x + dx;
      const py = y + dy;
      const idx = (py * binaryImage.bitmap.width + px) * 4;
      if (binaryImage.bitmap.data[idx] === 0) {
        darkPixels += 1;
      }
    }
  }

  return totalPixels > 0 ? darkPixels / totalPixels : 0;
}

function analyzeCells(binaryImage: BitmapLikeImage, table: TableRegion): Cell[] {
  const cells: Cell[] = [];

  for (let row = 0; row < table.rowCount; row += 1) {
    for (let col = 0; col < table.colCount; col += 1) {
      const cellX = table.x + col * table.cellWidth;
      const cellY = table.y + row * table.cellHeight;

      const marginX = table.cellWidth * ANSWER_SHEET_READER_CONFIG.cellMargin;
      const marginY = table.cellHeight * ANSWER_SHEET_READER_CONFIG.cellMargin;

      const roiX = Math.max(0, Math.floor(cellX + marginX));
      const roiY = Math.max(0, Math.floor(cellY + marginY));
      const roiWidth = Math.max(
        1,
        Math.min(
          binaryImage.bitmap.width - roiX,
          Math.floor(table.cellWidth - 2 * marginX)
        )
      );
      const roiHeight = Math.max(
        1,
        Math.min(
          binaryImage.bitmap.height - roiY,
          Math.floor(table.cellHeight - 2 * marginY)
        )
      );

      const fillRatio = analyzeCellFillRatio(
        binaryImage,
        roiX,
        roiY,
        roiWidth,
        roiHeight
      );

      cells.push({
        row,
        col,
        fillRatio,
        filled: fillRatio > ANSWER_SHEET_READER_CONFIG.fillThreshold,
      });
    }
  }

  return cells;
}

function extractAnswers(cells: Cell[], rowCount: number) {
  const respostas: string[] = [];
  const warnings: string[] = [];

  for (let row = 0; row < rowCount; row += 1) {
    const rowCells = cells
      .filter((cell) => cell.row === row)
      .sort((left, right) => left.col - right.col);

    const marked = rowCells.filter((cell) => cell.filled);

    if (marked.length === 1) {
      respostas.push(ANSWER_OPTIONS[marked[0].col] ?? "");
      continue;
    }

    if (marked.length > 1) {
      const markedOptions = marked
        .map((cell) => ANSWER_OPTIONS[cell.col] ?? "?")
        .join(", ");
      warnings.push(
        `Questao ${row + 1} com multiplas marcacoes detectadas: ${markedOptions}.`
      );
    }

    respostas.push("");
  }

  return { respostas, warnings };
}

export async function extractAnswerSheetFromImageBase64(
  imageBase64: string,
  options: AnswerSheetReadOptions = {}
): Promise<AnswerSheetExtraction> {
  const imageBuffer = imageBase64ToBuffer(imageBase64);
  const image = await Jimp.read(imageBuffer);

  const preparedImage = image.clone().greyscale().contrast(
    ANSWER_SHEET_READER_CONFIG.contrast
  );
  const binaryImage = preparedImage
    .clone()
    .threshold({ max: ANSWER_SHEET_READER_CONFIG.threshold });

  const table = findTableRegion(
    binaryImage,
    clampQuestionCount(options.expectedQuestionCount)
  );
  const cells = analyzeCells(binaryImage, table);
  const { respostas, warnings } = extractAnswers(cells, table.rowCount);

  return {
    numQuestoes: table.rowCount,
    respostas,
    warnings,
    table,
    provider: "jimp",
  };
}
