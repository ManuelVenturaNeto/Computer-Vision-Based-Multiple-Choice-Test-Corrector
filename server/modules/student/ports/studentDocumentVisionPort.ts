import type { ExtractedStudentFields } from "../domain/studentTypes.js";

export interface StudentDocumentVisionPort {
  extractStudent(imageBase64: string): Promise<ExtractedStudentFields>;
}
