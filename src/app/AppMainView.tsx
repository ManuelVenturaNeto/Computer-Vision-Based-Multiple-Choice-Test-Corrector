import { AnimatePresence } from "motion/react";

import type { ReturnTypeUseAppState } from "./appTypes";

import { CorrigirView } from "@/views/CorrigirView";
import { HomeView } from "@/views/HomeView";

interface AppMainViewProps {
  state: ReturnTypeUseAppState;
}

export function AppMainView({ state }: AppMainViewProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <AnimatePresence mode="wait">
        {state.view === "home" ? <HomeView cameraEnabled={state.cameraEnabled} gabaritoRef={state.gabaritoRef} alunosCount={state.alunos.length} onReadGabarito={state.handleLerGabarito} onClearGabarito={state.handleLimparGabarito} onGoToCorrigir={state.handleGoToCorrigir} /> : state.gabaritoRef && <CorrigirView alunos={state.alunos} gabaritoRef={state.gabaritoRef} onLerGabarito={state.handleLerGabaritoAluno} />}
      </AnimatePresence>
    </div>
  );
}
