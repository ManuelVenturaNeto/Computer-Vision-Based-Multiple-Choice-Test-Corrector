import type { Aluno, GabaritoReferencia } from "../types.js";

import { buildResultAnswerCells, buildResultBaseRow } from "./resultRows.js";

function toCsvCell(value: string | number | null | undefined) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function buildResultsCsv(
  alunos: Aluno[],
  gabaritoRef: GabaritoReferencia
) {
  const headers = [
    "Nome",
    "Matricula",
    "Disciplina",
    "Data da Prova",
    "Acertos",
    `Total (${gabaritoRef.numQuestoes})`,
    "Nota",
    ...Array.from({ length: gabaritoRef.numQuestoes }, (_, index) => `Q${index + 1}`),
  ];

  const rows = alunos.map((aluno) => {
    const baseRow = buildResultBaseRow(aluno, gabaritoRef);
    const respostas = buildResultAnswerCells(aluno, gabaritoRef, (answer) => `OK:${answer}`);
    return [baseRow.nome, baseRow.matricula, baseRow.disciplina, baseRow.dataProva, baseRow.acertos, baseRow.totalQuestoes, baseRow.nota, ...respostas];
  });

  return [headers, ...rows]
    .map((row) => row.map((value) => toCsvCell(value)).join(","))
    .join("\n");
}
