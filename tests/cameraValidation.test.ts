import assert from "node:assert/strict";
import test from "node:test";

import {
  sanitizeStudentNameInput,
  sanitizeStudentRegistrationInput,
  validateCameraForm,
} from "../src/features/camera/cameraValidation.js";
import {
  sanitizeExamQuestionCountInput,
  resolveExamQuestionCountInput,
  EXAM_DEFAULT_QUESTION_COUNT,
  EXAM_MIN_QUESTION_COUNT,
  EXAM_MAX_QUESTION_COUNT,
} from "../src/features/camera/constants.js";

test("sanitizeStudentNameInput removes non-letter characters", () => {
  assert.equal(
    sanitizeStudentNameInput("Joao 123 da-Silva!!"),
    "Joao  daSilva"
  );
});

test("sanitizeStudentRegistrationInput keeps only six digits", () => {
  assert.equal(sanitizeStudentRegistrationInput("AB-123456-99"), "123456");
});

test("validateCameraForm requires disciplina and all reference answers", () => {
  const errors = validateCameraForm({
    mode: "gabarito-ref",
    disciplina: "",
    nome: "",
    matricula: "",
    respostas: ["A", "", "C", "", "", "", "", "", "", ""],
    numQuestoes: 10,
  });

  assert.equal(errors.disciplina, "Informe a disciplina");
  assert.equal(errors.respostas, "8 questão(ões) sem resposta");

  const customCountErrors = validateCameraForm({
    mode: "gabarito-ref",
    disciplina: "Historia",
    nome: "",
    matricula: "",
    respostas: Array(13).fill("A"),
    numQuestoes: 13,
  });

  assert.equal(customCountErrors.respostas, undefined);
});

test("validateCameraForm validates aluno-info and aluno answer sheet modes", () => {
  const alunoErrors = validateCameraForm({
    mode: "aluno-info",
    disciplina: "",
    nome: "Maria 123",
    matricula: "12",
    respostas: [],
    numQuestoes: 10,
  });
  const gabaritoAlunoErrors = validateCameraForm({
    mode: "gabarito-aluno",
    disciplina: "",
    nome: "",
    matricula: "",
    respostas: ["A", "", ""],
    numQuestoes: 3,
  });

  assert.equal(alunoErrors.nome, "Nome deve conter apenas letras");
  assert.equal(alunoErrors.matricula, "Matrícula deve ter exatamente 6 dígitos");
  assert.equal(gabaritoAlunoErrors.respostas, "2 questão(ões) sem resposta");
});

test("sanitizeExamQuestionCountInput clamps to exam bounds", () => {
  assert.equal(sanitizeExamQuestionCountInput("3"), String(EXAM_MIN_QUESTION_COUNT));
  assert.equal(sanitizeExamQuestionCountInput("20"), String(EXAM_MAX_QUESTION_COUNT));
  assert.equal(sanitizeExamQuestionCountInput("10"), "10");
  assert.equal(sanitizeExamQuestionCountInput(""), "");
  assert.equal(sanitizeExamQuestionCountInput("abc"), "");
  assert.equal(sanitizeExamQuestionCountInput("4"), "4");
  assert.equal(sanitizeExamQuestionCountInput("15"), "15");
});

test("resolveExamQuestionCountInput returns default for non-numeric input", () => {
  assert.equal(resolveExamQuestionCountInput(""), EXAM_DEFAULT_QUESTION_COUNT);
  assert.equal(resolveExamQuestionCountInput("abc"), EXAM_DEFAULT_QUESTION_COUNT);
  assert.equal(resolveExamQuestionCountInput("10"), 10);
  assert.equal(resolveExamQuestionCountInput("3"), EXAM_MIN_QUESTION_COUNT);
  assert.equal(resolveExamQuestionCountInput("20"), EXAM_MAX_QUESTION_COUNT);
  assert.equal(resolveExamQuestionCountInput("4"), 4);
  assert.equal(resolveExamQuestionCountInput("15"), 15);
});
