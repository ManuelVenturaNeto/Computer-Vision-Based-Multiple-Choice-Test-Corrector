import { USEFUL_ROW_COUNT } from "./answerSheetConfig.js";
import { AnswerSheetReadError } from "./answerSheetError.js";
import type { BitmapLikeImage } from "./answerSheetTypes.js";

export function clampQuestionCount(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  const normalized = Math.round(parsed);
  return normalized === USEFUL_ROW_COUNT ? normalized : undefined;
}

export function calculateOtsuThreshold(intensities: number[]) {
  const histogram = new Array(256).fill(0);
  intensities.forEach((value) => {
    const index = Math.floor(value);
    if (index >= 0 && index < histogram.length) histogram[index] += 1;
  });
  return calculateOtsuThresholdFromHistogram(histogram, intensities.length);
}

export function buildBinaryImage(grayscaleImage: BitmapLikeImage) {
  const binaryData = new Uint8Array(grayscaleImage.bitmap.data);
  const histogram = new Array(256).fill(0);
  for (let index = 0; index < grayscaleImage.bitmap.data.length; index += 4) {
    histogram[grayscaleImage.bitmap.data[index]] += 1;
  }

  const threshold = calculateOtsuThresholdFromHistogram(
    histogram,
    grayscaleImage.bitmap.width * grayscaleImage.bitmap.height
  );
  for (let index = 0; index < binaryData.length; index += 4) {
    const output = binaryData[index] <= threshold ? 0 : 255;
    binaryData[index] = output;
    binaryData[index + 1] = output;
    binaryData[index + 2] = output;
    binaryData[index + 3] = 255;
  }

  return { bitmap: { ...grayscaleImage.bitmap, data: binaryData } };
}

export function assertImageBase64(imageBase64: string) {
  if (!imageBase64.trim()) {
    throw new AnswerSheetReadError("Imagem invalida para leitura do gabarito.");
  }
}

function calculateOtsuThresholdFromHistogram(histogram: number[], total: number) {
  let weightedSum = 0;
  for (let index = 0; index < histogram.length; index += 1) weightedSum += index * histogram[index];
  let sumBackground = 0;
  let weightBackground = 0;
  let bestVariance = -1;
  let threshold = 0;
  for (let index = 0; index < histogram.length; index += 1) {
    weightBackground += histogram[index];
    if (weightBackground === 0) continue;
    const weightForeground = total - weightBackground;
    if (weightForeground === 0) break;
    sumBackground += index * histogram[index];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (weightedSum - sumBackground) / weightForeground;
    const variance = weightBackground * weightForeground * (meanBackground - meanForeground) ** 2;
    if (variance > bestVariance) {
      bestVariance = variance;
      threshold = index;
    }
  }
  return threshold;
}
