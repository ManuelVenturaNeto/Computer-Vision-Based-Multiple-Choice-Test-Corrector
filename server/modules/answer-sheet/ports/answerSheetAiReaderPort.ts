import type { AiAnswerSheetResult } from "../domain/answerSheetTypes.js";

export interface AnswerSheetAiReaderPort {
  readAnswers(
    imageBase64: string,
    questionCount: number,
    alternativeCount: number
  ): Promise<AiAnswerSheetResult>;
}
