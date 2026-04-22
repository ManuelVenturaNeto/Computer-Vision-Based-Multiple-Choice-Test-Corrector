import { useReducer } from "react";

import { appStateReducer, createInitialAppState } from "./appStateReducer";

export function useAppStateStore() {
  const [state, dispatch] = useReducer(
    appStateReducer,
    undefined,
    createInitialAppState
  );

  const activeAluno =
    state.alunos.find((aluno) => aluno.id === state.activeAlunoId) ?? null;

  return { state, dispatch, activeAluno };
}
