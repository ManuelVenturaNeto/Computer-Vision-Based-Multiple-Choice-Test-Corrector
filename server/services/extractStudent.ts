import { extractStudentFromImageUseCase } from "../modules/student/application/extractStudentFromImageUseCase.js";
import { OpenAiStudentDocumentVisionAdapter } from "../modules/student/adapters/openai/OpenAiStudentDocumentVisionAdapter.js";

export {
  MissingApiKeyError,
  UpstreamRequestError,
} from "../modules/student/domain/studentErrors.js";
export { parseModelJson } from "../modules/student/domain/parseStudentModelJson.js";
export {
  sanitizeStudentName,
  sanitizeStudentRegistration,
} from "../modules/student/domain/studentSanitizers.js";
export type { StudentExtraction } from "../modules/student/domain/studentTypes.js";

const openAiStudentDocumentVisionAdapter = new OpenAiStudentDocumentVisionAdapter();

export function extractStudentFromImageBase64(imageBase64: string) {
  return extractStudentFromImageUseCase(
    imageBase64,
    openAiStudentDocumentVisionAdapter
  );
}
