import { AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface ClearConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ClearConfirmModal({
  onConfirm,
  onCancel,
}: ClearConfirmModalProps) {
  return (
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
            <strong>todos os dados dos alunos</strong>. Esta ação não pode ser
            desfeita.
          </p>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm"
            >
              Limpar tudo
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
