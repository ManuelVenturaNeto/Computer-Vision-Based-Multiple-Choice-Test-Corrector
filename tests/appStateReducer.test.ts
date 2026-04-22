import assert from "node:assert/strict";
import test from "node:test";

import {
  appStateReducer,
  createInitialAppState,
} from "../src/hooks/appStateReducer.js";
import type { GabaritoReferencia } from "../src/types.js";

const gabaritoRef: GabaritoReferencia = {
  disciplina: "Calculo",
  dataProva: "2026-04-22",
  numQuestoes: 3,
  respostas: ["A", "B", "C"],
};

test("appStateReducer saves the reference sheet and computes student performance", () => {
  let state = createInitialAppState();

  state = appStateReducer(state, {
    type: "save-gabarito-ref",
    gabarito: gabaritoRef,
  });
  state = appStateReducer(state, {
    type: "add-aluno",
    nome: "Maria",
    matricula: "123456",
    createdAt: 100,
  });
  state = appStateReducer(state, {
    type: "open-aluno-gabarito-modal",
    alunoId: "100",
  });
  state = appStateReducer(state, {
    type: "save-aluno-gabarito",
    respostas: ["A", "E", "C"],
    readAtIso: "2026-04-22T12:00:00.000Z",
  });

  assert.equal(state.alunos[0]?.acertos, 2);
  assert.equal(state.alunos[0]?.nota, 6.7);
  assert.equal(state.alunos[0]?.dataLeitura, "2026-04-22T12:00:00.000Z");
  assert.equal(state.activeModal, "none");
  assert.equal(state.activeAlunoId, null);
});

test("appStateReducer confirm-clear resets the correction flow", () => {
  let state = createInitialAppState();

  state = appStateReducer(state, {
    type: "save-gabarito-ref",
    gabarito: gabaritoRef,
  });
  state = appStateReducer(state, {
    type: "add-aluno",
    nome: "Ana",
    matricula: "654321",
    createdAt: 200,
  });
  state = appStateReducer(state, { type: "set-view", view: "corrigir" });
  state = appStateReducer(state, { type: "request-clear" });
  state = appStateReducer(state, { type: "confirm-clear" });

  assert.equal(state.view, "home");
  assert.equal(state.gabaritoRef, null);
  assert.deepEqual(state.alunos, []);
  assert.equal(state.showClearConfirm, false);
});
