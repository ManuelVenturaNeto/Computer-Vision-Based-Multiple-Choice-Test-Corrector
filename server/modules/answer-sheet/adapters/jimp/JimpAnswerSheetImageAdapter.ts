import { Jimp } from "jimp";

import {
  ANSWER_OPTIONS,
  ANSWER_SHEET_READER_CONFIG,
} from "../../domain/answerSheetConfig.js";
import type { BitmapLikeImage } from "../../domain/answerSheetTypes.js";
import type { AnswerSheetImagePort } from "../../ports/answerSheetImagePort.js";
import { loadJimpImage } from "./jimpImageLoader.js";
import { drawFilledCircle, drawHLine, drawVLine } from "./jimpMaskDrawing.js";

interface BitmapSource {
  bitmap: {
    width: number;
    height: number;
    data: Uint8Array;
  };
}

export class JimpAnswerSheetImageAdapter implements AnswerSheetImagePort {
  async readInput(imageBase64: string, contrast: number) {
    const colorImage = await loadJimpImage(imageBase64);
    return {
      colorImage: toBitmapImage(colorImage),
      grayscaleImage: toBitmapImage(colorImage.clone().greyscale().contrast(contrast)),
    };
  }

  async buildMaskImage(normalizedColorImage: BitmapLikeImage, respostas: string[]) {
    const image = new Jimp({ width: normalizedColorImage.bitmap.width, height: normalizedColorImage.bitmap.height, color: 0xffffffff });
    const data = image.bitmap.data as unknown as Uint8Array;
    normalizedColorImage.bitmap.data.forEach((value, index) => { data[index] = value; });
    const cellWidth = image.bitmap.width / ANSWER_SHEET_READER_CONFIG.totalCols;
    const cellHeight = image.bitmap.height / ANSWER_SHEET_READER_CONFIG.totalRows;

    for (let row = 0; row <= ANSWER_SHEET_READER_CONFIG.totalRows; row += 1) drawHLine(data, normalizedColorImage, 0, image.bitmap.width - 1, row * cellHeight, [255, 0, 255]);
    for (let col = 0; col <= ANSWER_SHEET_READER_CONFIG.totalCols; col += 1) drawVLine(data, normalizedColorImage, col * cellWidth, 0, image.bitmap.height - 1, [255, 0, 255]);
    respostas.forEach((answer, questionIndex) => drawAnswerMarker(data, normalizedColorImage, answer, questionIndex, cellWidth, cellHeight));

    return image.getBase64("image/jpeg");
  }
}

function toBitmapImage(image: BitmapSource): BitmapLikeImage {
  return { bitmap: { width: image.bitmap.width, height: image.bitmap.height, data: new Uint8Array(image.bitmap.data) } };
}

function drawAnswerMarker(data: Uint8Array, image: BitmapLikeImage, answer: string, questionIndex: number, cellWidth: number, cellHeight: number) {
  const colIndex = ANSWER_OPTIONS.indexOf(answer as (typeof ANSWER_OPTIONS)[number]);
  if (colIndex < 0) return;
  drawFilledCircle(
    data,
    image,
    (ANSWER_SHEET_READER_CONFIG.ignoreLeftCols + colIndex + 0.5) * cellWidth,
    (ANSWER_SHEET_READER_CONFIG.ignoreTopRows + questionIndex + 0.5) * cellHeight,
    Math.min(cellWidth, cellHeight) * 0.35,
    [255, 0, 0]
  );
}
