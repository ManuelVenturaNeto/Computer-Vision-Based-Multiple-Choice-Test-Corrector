import type { Aluno, GabaritoReferencia } from "../types.js";

function toCsvCell(value: string | number | null | undefined) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function calculatePerformance(
  respostas: string[],
  referencia: string[]
) {
  const totalQuestoes = referencia.length;
  const acertos = referencia.filter((correta, index) => correta === respostas[index])
    .length;
  const nota =
    totalQuestoes > 0
      ? Number(((acertos / totalQuestoes) * 10).toFixed(1))
      : 0;

  return { acertos, nota };
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
    ...Array.from(
      { length: gabaritoRef.numQuestoes },
      (_, index) => `Q${index + 1}`
    ),
  ];

  const rows = alunos.map((aluno) => {
    const baseRow: Array<string | number> = [
      aluno.nome,
      aluno.matricula,
      gabaritoRef.disciplina,
      gabaritoRef.dataProva,
      aluno.acertos ?? "-",
      gabaritoRef.numQuestoes,
      aluno.nota ?? "-",
    ];

    const respostas = Array.from({ length: gabaritoRef.numQuestoes }, (_, index) => {
      const respostaAluno = aluno.gabarito?.[index] ?? "-";
      const respostaCorreta = gabaritoRef.respostas[index];
      return respostaAluno === respostaCorreta
        ? `OK:${respostaAluno}`
        : respostaAluno;
    });

    return [...baseRow, ...respostas];
  });

  return [headers, ...rows]
    .map((row) => row.map((value) => toCsvCell(value)).join(","))
    .join("\n");
}
