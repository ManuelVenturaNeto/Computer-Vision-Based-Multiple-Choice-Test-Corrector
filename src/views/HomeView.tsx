import {
  BookOpenCheck,
  Camera,
  CheckCircle2,
  ClipboardList,
  ScanLine,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import type { GabaritoReferencia } from "@/types";

interface HomeViewProps {
  cameraEnabled: boolean;
  gabaritoRef: GabaritoReferencia | null;
  alunosCount: number;
  onReadGabarito: () => void;
  onClearGabarito: () => void;
  onGoToCorrigir: () => void;
}

export function HomeView({
  cameraEnabled,
  gabaritoRef,
  alunosCount,
  onReadGabarito,
  onClearGabarito,
  onGoToCorrigir,
}: HomeViewProps) {
  return (
    <motion.div
      key="home"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-4 space-y-4"
    >
      <div
        className="rounded-2xl p-5 text-white shadow-lg"
        style={{
          background: "linear-gradient(135deg, #003DA5 0%, #0056D6 100%)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs opacity-70 mb-1">Sistema de Correção</p>
            <h2 className="text-white mb-1">
              {gabaritoRef ? gabaritoRef.disciplina : "Gabarito não definido"}
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
            {gabaritoRef.respostas.map((resposta, index) => (
              <span
                key={index}
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              >
                {index + 1}.{resposta}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onReadGabarito}
        className="w-full flex items-center gap-3 p-4 rounded-2xl text-white shadow-md active:scale-95 transition-transform"
        style={{ backgroundColor: cameraEnabled ? "#003DA5" : "#6B7280" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
        >
          <Camera size={22} className="text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-white leading-tight">Ler Gabarito Referência</p>
          <p className="text-xs opacity-70">
            {cameraEnabled ? "Abrir câmera para escanear" : "Função desabilitada"}
          </p>
        </div>
        {!cameraEnabled && (
          <span className="text-xs bg-red-500/80 px-2 py-0.5 rounded-full">
            OFF
          </span>
        )}
      </button>

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
                onClick={onClearGabarito}
                className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white border border-red-200 text-red-500 shadow-sm active:scale-95 transition-transform"
              >
                <Trash2 size={18} />
                <span className="text-sm">Limpar Gabarito</span>
              </button>
              <button
                onClick={onGoToCorrigir}
                className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-2xl text-white shadow-md active:scale-95 transition-transform"
                style={{ backgroundColor: "#F2A900" }}
              >
                <ClipboardList size={18} />
                <span className="text-sm">Corrigir Provas</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <BookOpenCheck size={16} style={{ color: "#003DA5" }} />
                <p className="text-sm text-gray-700">Detalhes do gabarito</p>
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
                  <p className="text-gray-700">{gabaritoRef.numQuestoes}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Alunos registrados</p>
                  <p className="text-gray-700">{alunosCount}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!gabaritoRef && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-600 mb-3">Como usar:</p>
          <div className="space-y-2.5">
            {[
              "Leia o gabarito de referência com a câmera",
              'Clique em "Corrigir Provas"',
              "Adicione alunos e leia os gabaritos individualmente",
              "Exporte as notas em JSON ou Excel",
            ].map((texto, index) => (
              <div key={texto} className="flex items-start gap-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white shrink-0"
                  style={{ backgroundColor: "#003DA5" }}
                >
                  {index + 1}
                </span>
                <p className="text-sm text-gray-600">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
