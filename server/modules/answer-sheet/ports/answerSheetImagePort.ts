import type { BitmapLikeImage } from "../domain/answerSheetTypes.js";

export interface AnswerSheetImageInput {
  colorImage: BitmapLikeImage;
  grayscaleImage: BitmapLikeImage;
}

export interface AnswerSheetImagePort {
  readInput(imageBase64: string, contrast: number): Promise<AnswerSheetImageInput>;
  buildMaskImage(normalizedColorImage: BitmapLikeImage, respostas: string[]): Promise<string>;
}
