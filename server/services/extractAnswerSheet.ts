import { extractAnswerSheetUseCase } from "../modules/answer-sheet/application/extractAnswerSheetUseCase.js";
import { JimpAnswerSheetImageAdapter } from "../modules/answer-sheet/adapters/jimp/JimpAnswerSheetImageAdapter.js";

export { ANSWER_SHEET_READER_CONFIG } from "../modules/answer-sheet/domain/answerSheetConfig.js";
export { AnswerSheetReadError } from "../modules/answer-sheet/domain/answerSheetError.js";
export type {
  AnswerSheetExtraction,
  AnswerSheetReadOptions,
  Cell,
  TableRegion,
} from "../modules/answer-sheet/domain/answerSheetTypes.js";

const jimpAnswerSheetImageAdapter = new JimpAnswerSheetImageAdapter();

export function extractAnswerSheetFromImageBase64(
  imageBase64: string,
  options = {}
) {
  return extractAnswerSheetUseCase(imageBase64, options, jimpAnswerSheetImageAdapter);
}
