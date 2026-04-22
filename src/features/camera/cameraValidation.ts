import {
  FIXED_QUESTION_COUNT,
  type CameraMode,
} from "./constants.js";

export function sanitizeStudentNameInput(value: string) {
  return value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
}

export function sanitizeStudentRegistrationInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

interface CameraFormValidationInput {
  mode: CameraMode;
  disciplina: string;
  nome: string;
  matricula: string;
  respostas: string[];
  numQuestoes: number;
}

export function validateCameraForm({
  mode,
  disciplina,
  nome,
  matricula,
  respostas,
  numQuestoes,
}: CameraFormValidationInput) {
  const errors: Record<string, string> = {};

  if (mode === "aluno-info") {
    if (!nome.trim()) {
      errors.nome = "Informe o nome do aluno";
    } else if (/[0-9!@#$%^&*()_+={}\[\]|\\:;"'<>,.?\/`~]/.test(nome)) {
      errors.nome = "Nome deve conter apenas letras";
    }

    if (!matricula.trim()) {
      errors.matricula = "Informe a matrícula";
    } else if (!/^\d{6}$/.test(matricula)) {
      errors.matricula = "Matrícula deve ter exatamente 6 dígitos";
    }

    return errors;
  }

  if (mode === "gabarito-ref") {
    if (!disciplina.trim()) {
      errors.disciplina = "Informe a disciplina";
    }

    const vazias = respostas
      .slice(0, FIXED_QUESTION_COUNT)
      .filter((resposta) => !resposta).length;

    if (vazias > 0) {
      errors.respostas = `${vazias} questão(ões) sem resposta`;
    }

    return errors;
  }

  const vazias = respostas
    .slice(0, numQuestoes)
    .filter((resposta) => !resposta).length;

  if (vazias > 0) {
    errors.respostas = `${vazias} questão(ões) sem resposta`;
  }

  return errors;
}
