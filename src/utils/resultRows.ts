import type { Aluno, GabaritoReferencia } from "../types.js";

export interface ResultBaseRow {
  nome: string;
  matricula: string;
  disciplina: string;
  dataProva: string;
  acertos: number | "-";
  totalQuestoes: number;
  nota: number | "-";
}

export function buildResultBaseRow(
  aluno: Aluno,
  gabaritoRef: GabaritoReferencia
): ResultBaseRow {
  return {
    nome: aluno.nome,
    matricula: aluno.matricula,
    disciplina: gabaritoRef.disciplina,
    dataProva: gabaritoRef.dataProva,
    acertos: aluno.acertos ?? "-",
    totalQuestoes: gabaritoRef.numQuestoes,
    nota: aluno.nota ?? "-",
  };
}

export function buildResultAnswerCells(
  aluno: Aluno,
  gabaritoRef: GabaritoReferencia,
  formatCorrectAnswer: (answer: string) => string,
  blankValue = "-"
) {
  return Array.from({ length: gabaritoRef.numQuestoes }, (_, index) => {
    const respostaAluno = aluno.gabarito?.[index] ?? blankValue;
    const respostaCorreta = gabaritoRef.respostas[index];

    return respostaAluno === respostaCorreta
      ? formatCorrectAnswer(respostaAluno)
      : respostaAluno;
  });
}
