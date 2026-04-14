import { Settings, ToggleLeft, ToggleRight, Trash2, X } from "lucide-react";
import { motion } from "motion/react";

interface SettingsPanelProps {
  cameraEnabled: boolean;
  hasData: boolean;
  onToggleCamera: () => void;
  onClearData: () => void;
  onClose: () => void;
}

export function SettingsPanel({
  cameraEnabled,
  hasData,
  onToggleCamera,
  onClearData,
  onClose,
}: SettingsPanelProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
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
          <button onClick={onClose} className="text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
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
              <button onClick={onToggleCamera}>
                {cameraEnabled ? (
                  <ToggleRight size={36} style={{ color: "#003DA5" }} />
                ) : (
                  <ToggleLeft size={36} className="text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
            <p className="text-xs text-gray-500">Versão do app</p>
            <p className="text-sm text-gray-700">PUC Minas Corretor v1.0</p>
          </div>

          {hasData && (
            <button
              onClick={onClearData}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-500 text-sm"
            >
              <Trash2 size={16} />
              Limpar todos os dados
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}
