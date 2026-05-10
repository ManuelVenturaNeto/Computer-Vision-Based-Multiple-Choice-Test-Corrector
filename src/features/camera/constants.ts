export const OPCOES = ["A", "B", "C", "D", "E", "F"] as const;
export const DEFAULT_QUESTION_COUNT = 10;
export const MIN_QUESTION_COUNT = 1;
export const MAX_QUESTION_COUNT = 100;
export const FIXED_QUESTION_COUNT = DEFAULT_QUESTION_COUNT;
export const QUESTAO_LABELS = Array.from(
  { length: FIXED_QUESTION_COUNT },
  (_, index) => `${index + 1}`.padStart(2, "0")
);

export type AlternativeRange = "A-D" | "A-E" | "A-F";
export const ALTERNATIVE_RANGES = ["A-D", "A-E", "A-F"] as const satisfies readonly AlternativeRange[];
export const ALTERNATIVE_COUNT_BY_RANGE: Record<AlternativeRange, number> = { "A-D": 4, "A-E": 5, "A-F": 6 };
export const EXAM_MIN_QUESTION_COUNT = 4;
export const EXAM_MAX_QUESTION_COUNT = 15;
export const EXAM_DEFAULT_QUESTION_COUNT = 10;
export const EXAM_DEFAULT_ALTERNATIVE_RANGE: AlternativeRange = "A-E";

export type CameraMode = "gabarito-ref" | "aluno-info" | "gabarito-aluno";
export type CameraPhase = "config" | "starting" | "preview" | "processing" | "form" | "error";

export function sanitizeExamQuestionCountInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 2);
  if (!digits) return "";
  const parsed = Number.parseInt(digits, 10);
  if (!Number.isFinite(parsed)) return "";
  return String(Math.min(EXAM_MAX_QUESTION_COUNT, Math.max(EXAM_MIN_QUESTION_COUNT, parsed)));
}

export function resolveExamQuestionCountInput(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return EXAM_DEFAULT_QUESTION_COUNT;
  return Math.min(EXAM_MAX_QUESTION_COUNT, Math.max(EXAM_MIN_QUESTION_COUNT, parsed));
}

interface AnswerSheetSummaryInput {
  respostas: string[];
  warnings: string[];
}

export function resizeAnswers(answerList: string[], targetLength: number) {
  return Array.from(
    { length: targetLength },
    (_, index) => answerList[index] ?? ""
  );
}

export function sanitizeQuestionCountInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 3);
  if (!digits) return "";

  const parsed = Number.parseInt(digits, 10);
  if (!Number.isFinite(parsed)) return "";

  return String(
    Math.min(MAX_QUESTION_COUNT, Math.max(MIN_QUESTION_COUNT, parsed))
  );
}

export function resolveQuestionCountInput(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_QUESTION_COUNT;

  return Math.min(
    MAX_QUESTION_COUNT,
    Math.max(MIN_QUESTION_COUNT, parsed)
  );
}

export function buildAnswerSheetSummary(
  result: AnswerSheetSummaryInput,
  totalQuestoes = result.respostas.length || DEFAULT_QUESTION_COUNT
) {
  const totalLidas = result.respostas.filter(Boolean).length;

  if (result.warnings.length > 0) {
    return `Leitura concluida com ${totalLidas}/${totalQuestoes} questoes marcadas. Revise as questoes em branco.`;
  }

  return `Leitura automatica concluida com ${totalLidas}/${totalQuestoes} questoes preenchidas.`;
}
