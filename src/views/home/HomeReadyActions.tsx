import { BookOpenCheck, ClipboardList, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import type { GabaritoReferencia } from "@/types";

interface HomeReadyActionsProps {
  alunosCount: number;
  gabaritoRef: GabaritoReferencia;
  onClearGabarito: () => void;
  onGoToCorrigir: () => void;
}

export function HomeReadyActions(props: HomeReadyActionsProps) {
  const { alunosCount, gabaritoRef, onClearGabarito, onGoToCorrigir } = props;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-3">
        <div className="flex gap-3">
          <button onClick={onClearGabarito} className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white border border-red-200 text-red-500 shadow-sm active:scale-95 transition-transform"><Trash2 size={18} /><span className="text-sm">Limpar Gabarito</span></button>
          <button onClick={onGoToCorrigir} className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-2xl text-white shadow-md active:scale-95 transition-transform" style={{ backgroundColor: "#F2A900" }}><ClipboardList size={18} /><span className="text-sm">Corrigir Provas</span></button>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3"><BookOpenCheck size={16} style={{ color: "#003DA5" }} /><p className="text-sm text-gray-700">Detalhes do gabarito</p></div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Detail label="Disciplina" value={gabaritoRef.disciplina} />
            <Detail label="Data" value={gabaritoRef.dataProva} />
            <Detail label="Questões" value={String(gabaritoRef.numQuestoes)} />
            <Detail label="Alunos registrados" value={String(alunosCount)} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-gray-400">{label}</p><p className="text-gray-700">{value}</p></div>;
}
