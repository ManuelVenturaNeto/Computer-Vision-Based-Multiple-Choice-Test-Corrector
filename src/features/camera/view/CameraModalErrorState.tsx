import { AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface CameraModalErrorStateProps {
  fileInputId: string;
  cameraErrorMessage: string | null;
  onManual: () => void;
}

export function CameraModalErrorState(props: CameraModalErrorStateProps) {
  const { fileInputId, cameraErrorMessage, onManual } = props;

  return (
    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-950 px-6">
      <AlertCircle size={48} className="text-red-400" />
      <p className="text-white text-center">Câmera não disponível neste dispositivo/navegador.</p>
      {cameraErrorMessage && <p className="text-gray-300 text-sm text-center">{cameraErrorMessage}</p>}
      <p className="text-gray-400 text-sm text-center">Você pode tirar uma foto pelo navegador ou inserir os dados manualmente.</p>
      <label htmlFor={fileInputId} className="mt-1 px-6 py-3 rounded-xl text-white text-sm border border-white/20 cursor-pointer" style={{ backgroundColor: "#1F2937" }}>Tirar ou enviar foto</label>
      <button onClick={onManual} className="mt-2 px-6 py-3 rounded-xl text-white text-sm" style={{ backgroundColor: "#003DA5" }}>Inserir dados manualmente</button>
    </motion.div>
  );
}
