import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Camera,
  Trash2,
  ClipboardList,
  Settings,
  X,
  ChevronLeft,
  UserPlus,
  Copy,
  FileSpreadsheet,
  CheckCircle2,
  ScanLine,
  ToggleLeft,
  ToggleRight,
  BookOpenCheck,
  AlertTriangle,
  Check,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { GabaritoReferencia, Aluno, ModalType, AppView } from "./types";
import { CameraModal } from "./components/CameraModal";
import { DisabledModal } from "./components/DisabledModal";
import { StudentTable } from "./components/StudentTable";

export default function App() {
  const [view, setView] = useState<AppView>("home");
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [gabaritoRef, setGabaritoRef] = useState<GabaritoReferencia | null>(
    null
  );
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [activeModal, setActiveModal] = useState<ModalType>("none");
  const [activeAlunoId, setActiveAlunoId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedJSON, setCopiedJSON] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // ── Handlers ──────────────────────────────────────────

  const handleLerGabarito = () => {
    if (!cameraEnabled) {
      setActiveModal("disabled");
    } else {
      setActiveModal("camera-gabarito-ref");
    }
  };

  const handleGabaritoRefSaved = useCallback(
    (gabarito: GabaritoReferencia) => {
      setGabaritoRef(gabarito);
      setActiveModal("none");
    },
    []
  );

  const handleLimparGabarito = () => {
    setShowClearConfirm(true);
  };

  const confirmLimpar = () => {
    setGabaritoRef(null);
    setAlunos([]);
    setView("home");
    setShowClearConfirm(false);
  };

  const handleAddAluno = () => {
    setActiveModal("camera-aluno-info");
  };

  const handleAlunoInfoSaved = useCallback(
    (nome: string, matricula: string) => {
      const novo: Aluno = {
        id: Date.now().toString(),
        nome,
        matricula,
      };
      setAlunos((prev) => [...prev, novo]);
      setActiveModal("none");
    },
    []
  );

  const handleLerGabaritoAluno = (alunoId: string) => {
    setActiveAlunoId(alunoId);
    setActiveModal("camera-gabarito-aluno");
  };

  const handleGabaritoAlunoSaved = useCallback(
    (respostas: string[]) => {
      if (!gabaritoRef || !activeAlunoId) return;
      const acertos = respostas.filter(
        (r, i) => r === gabaritoRef.respostas[i]
      ).length;
      const nota = parseFloat(
        ((acertos / gabaritoRef.numQuestoes) * 10).toFixed(1)
      );
      setAlunos((prev) =>
        prev.map((a) =>
          a.id === activeAlunoId
            ? {
                ...a,
                gabarito: respostas,
                acertos,
                nota,
                dataLeitura: new Date().toISOString(),
              }
            : a
        )
      );
      setActiveModal("none");
      setActiveAlunoId(null);
    },
    [gabaritoRef, activeAlunoId]
  );

  const handleCopyJSON = async () => {
    const data = alunos.map((a) => ({
      nome: a.nome,
      matricula: a.matricula,
      nota: a.nota ?? null,
      acertos: a.acertos ?? null,
      totalQuestoes: gabaritoRef?.numQuestoes,
      disciplina: gabaritoRef?.disciplina,
      respostas: a.gabarito ?? null,
    }));
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2500);
  };

  const handleExportExcel = () => {
    if (!gabaritoRef) return;

    const rows = alunos.map((a) => {
      const row: Record<string, string | number | null> = {
        Nome: a.nome,
        Matrícula: a.matricula,
        Disciplina: gabaritoRef.disciplina,
        "Data da Prova": gabaritoRef.dataProva,
        Acertos: a.acertos ?? "-",
        [`Total (${gabaritoRef.numQuestoes})`]: gabaritoRef.numQuestoes,
        Nota: a.nota ?? "-",
      };
      Array.from({ length: gabaritoRef.numQuestoes }).forEach((_, i) => {
        const resp = a.gabarito?.[i] ?? "-";
        const ref = gabaritoRef.respostas[i];
        row[`Q${i + 1}`] = resp === ref ? `✓${resp}` : resp || "-";
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, gabaritoRef.disciplina || "Turma");
    XLSX.writeFile(
      wb,
      `notas_${gabaritoRef.disciplina || "turma"}_${gabaritoRef.dataProva}.xlsx`
    );
  };

  const activeAluno = alunos.find((a) => a.id === activeAlunoId);

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-md mx-auto relative">
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 shadow-md z-10"
        style={{ backgroundColor: "#003DA5" }}
      >
        <div className="flex items-center gap-2">
          {view === "corrigir" && (
            <button
              onClick={() => setView("home")}
              className="text-white mr-1"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          <div>
            <p className="text-white text-xs opacity-70 leading-none">
              PUC Minas
            </p>
            <h1 className="text-white leading-tight">
              {view === "home" ? "Corretor de Provas" : "Corrigir Provas"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {view === "corrigir" && alunos.length > 0 && (
            <>
              <button
                onClick={handleCopyJSON}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs border border-white/30 text-white"
                title="Copiar como JSON"
              >
                {copiedJSON ? (
                  <Check size={14} className="text-green-300" />
                ) : (
                  <Copy size={14} />
                )}
                {copiedJSON ? "Copiado!" : "JSON"}
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs border border-white/30 text-white"
                title="Exportar Excel"
              >
                <FileSpreadsheet size={14} />
                Excel
              </button>
            </>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="text-white p-1"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {view === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              {/* Hero card */}
              <div
                className="rounded-2xl p-5 text-white shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, #003DA5 0%, #0056D6 100%)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs opacity-70 mb-1">Sistema de Correção</p>
                    <h2 className="text-white mb-1">
                      {gabaritoRef
                        ? gabaritoRef.disciplina
                        : "Gabarito não definido"}
                    </h2>
                    {gabaritoRef ? (
                      <p className="text-xs opacity-80">
                        {gabaritoRef.numQuestoes} questões · {gabaritoRef.dataProva}
                      </p>
                    ) : (
                      <p className="text-xs opacity-70">
                        Leia o gabarito de referência para iniciar
                      </p>
                    )}
                  </div>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                  >
                    {gabaritoRef ? (
                      <CheckCircle2 size={24} className="text-green-300" />
                    ) : (
                      <ScanLine size={24} className="text-white/80" />
                    )}
                  </div>
                </div>

                {gabaritoRef && (
                  <div className="mt-4 flex gap-2 flex-wrap">
                    {gabaritoRef.respostas.map((r, i) => (
                      <span
                        key={i}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                      >
                        {i + 1}.{r}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Main action: Ler gabarito */}
              <button
                onClick={handleLerGabarito}
                className="w-full flex items-center gap-3 p-4 rounded-2xl text-white shadow-md active:scale-95 transition-transform"
                style={{
                  backgroundColor: cameraEnabled ? "#003DA5" : "#6B7280",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <Camera size={22} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white leading-tight">
                    Ler Gabarito Referência
                  </p>
                  <p className="text-xs opacity-70">
                    {cameraEnabled
                      ? "Abrir câmera para escanear"
                      : "Função desabilitada"}
                  </p>
                </div>
                {!cameraEnabled && (
                  <span className="text-xs bg-red-500/80 px-2 py-0.5 rounded-full">
                    OFF
                  </span>
                )}
              </button>

              {/* Actions when gabarito is set */}
              <AnimatePresence>
                {gabaritoRef && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="space-y-3"
                  >
                    <div className="flex gap-3">
                      <button
                        onClick={handleLimparGabarito}
                        className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white border border-red-200 text-red-500 shadow-sm active:scale-95 transition-transform"
                      >
                        <Trash2 size={18} />
                        <span className="text-sm">Limpar Gabarito</span>
                      </button>
                      <button
                        onClick={() => setView("corrigir")}
                        className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-2xl text-white shadow-md active:scale-95 transition-transform"
                        style={{ backgroundColor: "#F2A900" }}
                      >
                        <ClipboardList size={18} />
                        <span className="text-sm">Corrigir Provas</span>
                      </button>
                    </div>

                    {/* Info card */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpenCheck size={16} style={{ color: "#003DA5" }} />
                        <p className="text-sm text-gray-700">
                          Detalhes do gabarito
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-gray-400">Disciplina</p>
                          <p className="text-gray-700">{gabaritoRef.disciplina}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Data</p>
                          <p className="text-gray-700">{gabaritoRef.dataProva}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Questões</p>
                          <p className="text-gray-700">
                            {gabaritoRef.numQuestoes}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Alunos registrados</p>
                          <p className="text-gray-700">{alunos.length}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Help */}
              {!gabaritoRef && (
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-600 mb-3">Como usar:</p>
                  <div className="space-y-2.5">
                    {[
                      {
                        step: "1",
                        text: "Leia o gabarito de referência com a câmera",
                      },
                      {
                        step: "2",
                        text: 'Clique em "Corrigir Provas"',
                      },
                      {
                        step: "3",
                        text: "Adicione alunos e leia os gabaritos individualmente",
                      },
                      {
                        step: "4",
                        text: "Exporte as notas em JSON ou Excel",
                      },
                    ].map(({ step, text }) => (
                      <div key={step} className="flex items-start gap-3">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white shrink-0"
                          style={{ backgroundColor: "#003DA5" }}
                        >
                          {step}
                        </span>
                        <p className="text-sm text-gray-600">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === "corrigir" && gabaritoRef && (
            <motion.div
              key="corrigir"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="pb-28"
            >
              {/* Discipline badge */}
              <div
                className="mx-4 mt-4 rounded-xl p-3 flex items-center justify-between"
                style={{ backgroundColor: "#EEF3FC" }}
              >
                <div>
                  <p className="text-xs text-gray-500">Disciplina</p>
                  <p className="text-sm" style={{ color: "#003DA5" }}>
                    {gabaritoRef.disciplina}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Questões</p>
                  <p className="text-sm" style={{ color: "#003DA5" }}>
                    {gabaritoRef.numQuestoes}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <StudentTable
                  alunos={alunos}
                  gabaritoRef={gabaritoRef}
                  onLerGabarito={handleLerGabaritoAluno}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAB: Add aluno (only in corrigir view) */}
      <AnimatePresence>
        {view === "corrigir" && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-md w-full px-4 flex gap-2"
            style={{ maxWidth: 448 }}
          >
            <button
              onClick={handleAddAluno}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white shadow-xl active:scale-95 transition-transform"
              style={{ backgroundColor: "#003DA5" }}
            >
              <UserPlus size={20} />
              <span>+ Adicionar Aluno</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <>
            <div
              className="fixed inset-0 z-40"
              style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowSettings(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 24, stiffness: 280 }}
              className="fixed right-0 top-0 bottom-0 w-72 bg-white z-50 shadow-2xl"
            >
              <div
                className="flex items-center justify-between px-4 py-4"
                style={{ backgroundColor: "#003DA5" }}
              >
                <div className="flex items-center gap-2">
                  <Settings size={18} className="text-white" />
                  <span className="text-white">Configurações</span>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Camera toggle */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-800">Leitura por câmera</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {cameraEnabled
                          ? "Câmera ativa para leitura"
                          : "Câmera desabilitada"}
                      </p>
                    </div>
                    <button onClick={() => setCameraEnabled((v) => !v)}>
                      {cameraEnabled ? (
                        <ToggleRight
                          size={36}
                          style={{ color: "#003DA5" }}
                        />
                      ) : (
                        <ToggleLeft size={36} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
                  <p className="text-xs text-gray-500">Versão do app</p>
                  <p className="text-sm text-gray-700">
                    PUC Minas Corretor v1.0
                  </p>
                </div>

                {gabaritoRef && (
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      handleLimparGabarito();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-500 text-sm"
                  >
                    <Trash2 size={16} />
                    Limpar todos os dados
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Clear Confirm Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={28} className="text-red-500" />
                </div>
                <h3 className="text-gray-900">Limpar gabarito?</h3>
                <p className="text-sm text-gray-500">
                  Isso irá remover o gabarito de referência e{" "}
                  <strong>todos os dados dos alunos</strong>. Esta ação não pode
                  ser desfeita.
                </p>
                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmLimpar}
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm"
                  >
                    Limpar tudo
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === "disabled" && (
          <DisabledModal onClose={() => setActiveModal("none")} />
        )}
        {activeModal === "camera-gabarito-ref" && (
          <CameraModal
            mode="gabarito-ref"
            onClose={() => setActiveModal("none")}
            onGabaritoRef={handleGabaritoRefSaved}
          />
        )}
        {activeModal === "camera-aluno-info" && (
          <CameraModal
            mode="aluno-info"
            onClose={() => setActiveModal("none")}
            onAlunoInfo={handleAlunoInfoSaved}
          />
        )}
        {activeModal === "camera-gabarito-aluno" && (
          <CameraModal
            mode="gabarito-aluno"
            numQuestoes={gabaritoRef?.numQuestoes}
            alunoNome={activeAluno?.nome}
            onClose={() => {
              setActiveModal("none");
              setActiveAlunoId(null);
            }}
            onGabaritoAluno={handleGabaritoAlunoSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
