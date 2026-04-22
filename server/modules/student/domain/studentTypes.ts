export interface ExtractedStudentFields {
  nome: string;
  matricula: string;
}

export interface StudentExtraction extends ExtractedStudentFields {
  provider: "openai";
  model: string;
}
