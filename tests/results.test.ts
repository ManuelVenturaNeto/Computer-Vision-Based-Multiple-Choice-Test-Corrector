import assert from "node:assert/strict";
import test from "node:test";

import { calculatePerformance, buildResultsCsv } from "../src/utils/results";
import type { Aluno, GabaritoReferencia } from "../src/types";

test("calculatePerformance computes acertos and nota", () => {
  const result = calculatePerformance(["A", "B", "C", "D"], ["A", "E", "C", "D"]);

  assert.equal(result.acertos, 3);
  assert.equal(result.nota, 7.5);
});

test("buildResultsCsv marks matching answers and includes headers", () => {
  const gabaritoRef: GabaritoReferencia = {
    disciplina: "Calculo",
    dataProva: "2026-04-13",
    numQuestoes: 2,
    respostas: ["A", "B"],
  };
  const alunos: Aluno[] = [
    {
      id: "1",
      nome: "Ana Maria",
      matricula: "123456",
      acertos: 2,
      nota: 10,
      gabarito: ["A", "B"],
    },
  ];

  const csv = buildResultsCsv(alunos, gabaritoRef);

  assert.match(csv, /"Nome","Matricula","Disciplina"/);
  assert.match(csv, /"Ana Maria","123456","Calculo"/);
  assert.match(csv, /"OK:A","OK:B"/);
});
