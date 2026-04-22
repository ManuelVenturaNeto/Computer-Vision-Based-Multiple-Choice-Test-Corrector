import type { Aluno, GabaritoReferencia } from "../types.js";
import { calculatePerformance } from "../utils/results.js";

import type { AppState } from "./appStateTypes.js";

export function createInitialAppState(): AppState {
  return {
    view: "home",
    cameraEnabled: true,
    gabaritoRef: null,
    alunos: [],
    activeModal: "none",
    activeAlunoId: null,
    showSettings: false,
    showClearConfirm: false,
  };
}

export function buildAluno(nome: string, matricula: string, createdAt: number): Aluno {
  return { id: String(createdAt), nome, matricula };
}

export function updateAlunoAnswers(
  alunos: Aluno[],
  activeAlunoId: string,
  gabaritoRef: GabaritoReferencia,
  respostas: string[],
  readAtIso: string
) {
  const performance = calculatePerformance(respostas, gabaritoRef.respostas);
  return alunos.map((aluno) => aluno.id === activeAlunoId ? { ...aluno, gabarito: respostas, acertos: performance.acertos, nota: performance.nota, dataLeitura: readAtIso } : aluno);
}
