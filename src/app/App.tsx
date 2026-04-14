import { UserPlus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { AppHeader } from "@/components/AppHeader";
import { ClearConfirmModal } from "@/components/ClearConfirmModal";
import { DisabledModal } from "@/components/DisabledModal";
import { SettingsPanel } from "@/components/SettingsPanel";
import { CameraModal } from "@/features/camera/CameraModal";
import { useAppState } from "@/hooks/useAppState";
import { useExport } from "@/hooks/useExport";
import { CorrigirView } from "@/views/CorrigirView";
import { HomeView } from "@/views/HomeView";

export default function App() {
  const state = useAppState();
  const exports = useExport(state.alunos, state.gabaritoRef);
  const showExportActions = state.view === "corrigir" && state.alunos.length > 0;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-md mx-auto relative">
      <AppHeader
        view={state.view}
        showExportActions={showExportActions}
        copiedJSON={exports.copiedJSON}
        onBack={state.handleGoHome}
        onCopyJSON={exports.handleCopyJSON}
        onExportExcel={exports.handleExportExcel}
        onOpenSettings={state.handleOpenSettings}
      />

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {state.view === "home" ? (
            <HomeView
              cameraEnabled={state.cameraEnabled}
              gabaritoRef={state.gabaritoRef}
              alunosCount={state.alunos.length}
              onReadGabarito={state.handleLerGabarito}
              onClearGabarito={state.handleLimparGabarito}
              onGoToCorrigir={state.handleGoToCorrigir}
            />
          ) : (
            state.gabaritoRef && (
              <CorrigirView
                alunos={state.alunos}
                gabaritoRef={state.gabaritoRef}
                onLerGabarito={state.handleLerGabaritoAluno}
              />
            )
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {state.view === "corrigir" && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-md w-full px-4 flex gap-2"
            style={{ maxWidth: 448 }}
          >
            <button
              onClick={state.handleAddAluno}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white shadow-xl active:scale-95 transition-transform"
              style={{ backgroundColor: "#003DA5" }}
            >
              <UserPlus size={20} />
              <span>+ Adicionar Aluno</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.showSettings && (
          <SettingsPanel
            cameraEnabled={state.cameraEnabled}
            hasData={Boolean(state.gabaritoRef)}
            onToggleCamera={state.handleToggleCamera}
            onClearData={() => {
              state.handleCloseSettings();
              state.handleLimparGabarito();
            }}
            onClose={state.handleCloseSettings}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.showClearConfirm && (
          <ClearConfirmModal
            onConfirm={state.confirmLimpar}
            onCancel={state.handleCancelLimpar}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.activeModal === "disabled" && (
          <DisabledModal onClose={state.handleCloseModal} />
        )}
        {state.activeModal === "camera-gabarito-ref" && (
          <CameraModal
            mode="gabarito-ref"
            onClose={state.handleCloseModal}
            onGabaritoRef={state.handleGabaritoRefSaved}
          />
        )}
        {state.activeModal === "camera-aluno-info" && (
          <CameraModal
            mode="aluno-info"
            onClose={state.handleCloseModal}
            onAlunoInfo={state.handleAlunoInfoSaved}
          />
        )}
        {state.activeModal === "camera-gabarito-aluno" && (
          <CameraModal
            mode="gabarito-aluno"
            numQuestoes={state.gabaritoRef?.numQuestoes}
            alunoNome={state.activeAluno?.nome}
            onClose={state.handleCloseAlunoModal}
            onGabaritoAluno={state.handleGabaritoAlunoSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
