import { AnimatePresence } from "motion/react";

import { DisabledModal } from "@/components/DisabledModal";
import { CameraModal } from "@/features/camera/CameraModal";

import type { ReturnTypeUseAppState } from "./appTypes";

interface AppModalsProps {
  state: ReturnTypeUseAppState;
}

export function AppModals({ state }: AppModalsProps) {
  return (
    <AnimatePresence>
      {state.activeModal === "disabled" && <DisabledModal onClose={state.handleCloseModal} />}
      {state.activeModal === "camera-gabarito-ref" && <CameraModal mode="gabarito-ref" onClose={state.handleCloseModal} onGabaritoRef={state.handleGabaritoRefSaved} />}
      {state.activeModal === "camera-aluno-info" && <CameraModal mode="aluno-info" onClose={state.handleCloseModal} onAlunoInfo={state.handleAlunoInfoSaved} />}
      {state.activeModal === "camera-gabarito-aluno" && <CameraModal mode="gabarito-aluno" numQuestoes={state.gabaritoRef?.numQuestoes} alunoNome={state.activeAluno?.nome} onClose={state.handleCloseAlunoModal} onGabaritoAluno={state.handleGabaritoAlunoSaved} />}
    </AnimatePresence>
  );
}
