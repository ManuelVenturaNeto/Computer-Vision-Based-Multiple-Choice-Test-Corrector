export interface StudentExtractionPortResult {
  nome: string;
  matricula: string;
}

export interface AnswerSheetReadPortResult {
  respostas: string[];
  warnings: string[];
}

export interface CameraProcessingPort {
  extractAlunoFromImage(imageDataUrl: string): Promise<StudentExtractionPortResult>;
  readAnswerSheetFromImage(
    imageDataUrl: string,
    expectedQuestionCount?: number,
    onProgress?: (status: string, progress?: number) => void
  ): Promise<AnswerSheetReadPortResult>;
}
