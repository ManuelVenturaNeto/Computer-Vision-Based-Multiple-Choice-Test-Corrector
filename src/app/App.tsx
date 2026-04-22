import { AppHeader } from "@/components/AppHeader";
import { useAppState } from "@/hooks/useAppState";
import { useExport } from "@/hooks/useExport";

import { AppFloatingAction } from "./AppFloatingAction";
import { AppMainView } from "./AppMainView";
import { AppModals } from "./AppModals";
import { AppPanels } from "./AppPanels";

export default function App() {
  const state = useAppState();
  const exports = useExport(state.alunos, state.gabaritoRef);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-md mx-auto relative">
      <AppHeader view={state.view} showExportActions={state.view === "corrigir" && state.alunos.length > 0} copiedJSON={exports.copiedJSON} onBack={state.handleGoHome} onCopyJSON={exports.handleCopyJSON} onExportExcel={exports.handleExportExcel} onOpenSettings={state.handleOpenSettings} />
      <AppMainView state={state} />
      <AppFloatingAction show={state.view === "corrigir"} onAddAluno={state.handleAddAluno} />
      <AppPanels state={state} />
      <AppModals state={state} />
    </div>
  );
}
