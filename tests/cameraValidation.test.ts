import assert from "node:assert/strict";
import test from "node:test";

import {
  sanitizeStudentNameInput,
  sanitizeStudentRegistrationInput,
  validateCameraForm,
} from "../src/features/camera/cameraValidation.js";

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
