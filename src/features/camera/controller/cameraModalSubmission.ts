import { FIXED_QUESTION_COUNT, type CameraMode } from "../constants";
import { validateCameraForm } from "../cameraValidation";

interface SubmissionInput {
  mode: CameraMode;
  disciplina: string;
  dataProva: string;
  nome: string;
  matricula: string;
  respostas: string[];
  numQuestoes: number;
}

export function validateCameraModalSubmission(input: SubmissionInput) {
  return validateCameraForm(input);
}

export function buildCameraModalPayload(input: SubmissionInput) {
  if (input.mode === "gabarito-ref") {
    return {
      type: "gabarito-ref" as const,
      value: {
        numQuestoes: FIXED_QUESTION_COUNT,
        respostas: input.respostas.slice(0, FIXED_QUESTION_COUNT),
        disciplina: input.disciplina,
        dataProva: input.dataProva,
      },
    };
  }
  if (input.mode === "aluno-info") {
    return { type: "aluno-info" as const, value: { nome: input.nome, matricula: input.matricula } };
  }
  return { type: "gabarito-aluno" as const, value: input.respostas.slice(0, input.numQuestoes) };
}
