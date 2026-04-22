import { UserPlus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface AppFloatingActionProps {
  show: boolean;
  onAddAluno: () => void;
}

export function AppFloatingAction({ show, onAddAluno }: AppFloatingActionProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-md w-full px-4 flex gap-2" style={{ maxWidth: 448 }}>
          <button onClick={onAddAluno} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white shadow-xl active:scale-95 transition-transform" style={{ backgroundColor: "#003DA5" }}>
            <UserPlus size={20} />
            <span>+ Adicionar Aluno</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
