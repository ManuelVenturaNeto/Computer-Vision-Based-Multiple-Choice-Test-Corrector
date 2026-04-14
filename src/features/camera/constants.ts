import type { AnswerSheetReadResponse } from "./services/cameraProcessing";

export const OPCOES = ["A", "B", "C", "D", "E"] as const;
export const FIXED_QUESTION_COUNT = 10;
export const QUESTAO_LABELS = Array.from(
  { length: FIXED_QUESTION_COUNT },
  (_, index) => `${index + 1}`.padStart(2, "0")
);

export type CameraMode = "gabarito-ref" | "aluno-info" | "gabarito-aluno";
export type CameraPhase = "starting" | "preview" | "processing" | "form" | "error";

export interface LiveDetectedAnswer {
  row: number;
  col: number;
  option: string;
  centerX: number;
  centerY: number;
}

export interface LiveAnswerSheetDetection {
  frameWidth: number;
  frameHeight: number;
  table: AnswerSheetReadResponse["table"];
  markedAnswers: LiveDetectedAnswer[];
  gapRows: number[];
}

export function resizeAnswers(answerList: string[], targetLength: number) {
  return Array.from(
    { length: targetLength },
    (_, index) => answerList[index] ?? ""
  );
}

export function buildAnswerSheetSummary(result: AnswerSheetReadResponse) {
  const totalLidas = result.respostas.filter(Boolean).length;

  if (result.warnings.length > 0) {
    return `Leitura concluida com ${totalLidas}/${FIXED_QUESTION_COUNT} questoes marcadas. Revise as questoes em branco.`;
  }

  return `Leitura automatica concluida com ${totalLidas}/${FIXED_QUESTION_COUNT} questoes preenchidas.`;
}
