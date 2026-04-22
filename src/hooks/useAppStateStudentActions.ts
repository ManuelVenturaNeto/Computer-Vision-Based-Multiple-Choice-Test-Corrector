import { useCallback, type Dispatch } from "react";

import type { GabaritoReferencia } from "@/types";

import type { AppStateAction } from "./appStateTypes";

export function useAppStateStudentActions(
  dispatch: Dispatch<AppStateAction>
) {
  const handleGabaritoRefSaved = useCallback((gabarito: GabaritoReferencia) => {
    dispatch({ type: "save-gabarito-ref", gabarito });
  }, [dispatch]);

  const handleAlunoInfoSaved = useCallback((nome: string, matricula: string) => {
    dispatch({ type: "add-aluno", nome, matricula, createdAt: Date.now() });
  }, [dispatch]);

  const handleGabaritoAlunoSaved = useCallback((respostas: string[]) => {
    dispatch({ type: "save-aluno-gabarito", respostas, readAtIso: new Date().toISOString() });
  }, [dispatch]);

  return {
    handleAddAluno: () => dispatch({ type: "open-aluno-info-modal" }),
    handleGabaritoRefSaved,
    handleAlunoInfoSaved,
    handleLerGabaritoAluno: (alunoId: string) => dispatch({ type: "open-aluno-gabarito-modal", alunoId }),
    handleGabaritoAlunoSaved,
  };
}
