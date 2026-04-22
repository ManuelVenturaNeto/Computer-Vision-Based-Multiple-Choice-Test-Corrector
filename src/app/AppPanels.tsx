import { AnimatePresence } from "motion/react";

import { ClearConfirmModal } from "@/components/ClearConfirmModal";
import { SettingsPanel } from "@/components/SettingsPanel";

import type { ReturnTypeUseAppState } from "./appTypes";

interface AppPanelsProps {
  state: ReturnTypeUseAppState;
}

export function AppPanels({ state }: AppPanelsProps) {
  return (
    <>
      <AnimatePresence>{state.showSettings && <SettingsPanel cameraEnabled={state.cameraEnabled} hasData={Boolean(state.gabaritoRef)} onToggleCamera={state.handleToggleCamera} onClearData={() => { state.handleCloseSettings(); state.handleLimparGabarito(); }} onClose={state.handleCloseSettings} />}</AnimatePresence>
      <AnimatePresence>{state.showClearConfirm && <ClearConfirmModal onConfirm={state.confirmLimpar} onCancel={state.handleCancelLimpar} />}</AnimatePresence>
    </>
  );
}
