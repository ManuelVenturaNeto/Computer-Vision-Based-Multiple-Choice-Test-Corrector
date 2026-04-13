import { CameraOff, X } from "lucide-react";
import { motion } from "motion/react";

interface DisabledModalProps {
  onClose: () => void;
}

export function DisabledModal({ onClose }: DisabledModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 200, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10"
      >
        <div className="flex justify-between items-start mb-4">
          <div />
          <div className="w-12 h-1 rounded-full bg-gray-300 mx-auto absolute left-0 right-0 top-3" />
          <button onClick={onClose} className="text-gray-400">
            <X size={22} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
            <CameraOff size={36} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-gray-900 mb-1">Função desabilitada</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              A leitura de gabarito por câmera está{" "}
              <strong>desabilitada</strong> no momento. Ative a função nas
              configurações para utilizá-la.
            </p>
          </div>
          <div
            className="w-full rounded-xl p-3 text-left"
            style={{ backgroundColor: "#EEF3FC" }}
          >
            <p className="text-xs" style={{ color: "#003DA5" }}>
              💡 <strong>Como ativar:</strong> Clique no ícone de configurações
              (⚙️) no canto superior direito e ative a opção "Leitura por
              câmera".
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-white"
            style={{ backgroundColor: "#003DA5" }}
          >
            Entendi
          </button>
        </div>
      </motion.div>
    </div>
  );
}
