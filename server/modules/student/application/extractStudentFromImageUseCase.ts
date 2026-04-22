import { serverConfig } from "../../../config.js";
import type { StudentExtraction } from "../domain/studentTypes.js";
import type { StudentDocumentVisionPort } from "../ports/studentDocumentVisionPort.js";

export async function extractStudentFromImageUseCase(
  imageBase64: string,
  visionPort: StudentDocumentVisionPort
): Promise<StudentExtraction> {
  const extractedStudent = await visionPort.extractStudent(imageBase64);

  return {
    ...extractedStudent,
    provider: "openai",
    model: serverConfig.openAiModel,
  };
}
