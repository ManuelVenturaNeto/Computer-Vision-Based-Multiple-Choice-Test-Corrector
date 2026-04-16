import { Camera } from "lucide-react";
import { motion } from "motion/react";
import type { Ref } from "react";

import type { CameraMode } from "./constants";

interface CameraPreviewProps {
  mode: CameraMode;
  videoRef: Ref<HTMLVideoElement>;
  fileInputId: string;
  onCapture: () => void | Promise<void>;
  onManual: () => void;
}

export function CameraPreview({
  mode,
  videoRef,
  fileInputId,
  onCapture,
  onManual,
}: CameraPreviewProps) {
  return (
    <motion.div
      key="preview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col relative overflow-hidden"
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div
          className="w-[84vw] max-w-[420px] h-[58vh] min-h-[360px] max-h-[620px] rounded-[32px] relative"
          style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)" }}
        >
          <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-yellow-400 rounded-tl-[28px]" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-yellow-400 rounded-tr-[28px]" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-yellow-400 rounded-bl-[28px]" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-yellow-400 rounded-br-[28px]" />

          {mode === "aluno-info" && (
            <div className="absolute inset-0 flex flex-col justify-center items-start px-5 gap-3">
              <div className="bg-yellow-400/20 border border-yellow-400/50 rounded px-3 py-1">
                <span className="text-yellow-300 text-sm">Nome: ___</span>
              </div>
              <div className="bg-yellow-400/20 border border-yellow-400/50 rounded px-3 py-1">
                <span className="text-yellow-300 text-sm">Matrícula: ______</span>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-white text-xs bg-black/60 px-3 py-1.5 rounded-full">
          {mode === "aluno-info"
            ? "Enquadre o documento com Nome e Matrícula"
            : "Aponte a câmera para o gabarito e tire a foto"}
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pb-10 px-6 flex flex-col items-center gap-4 bg-gradient-to-t from-black/80 to-transparent pt-16">
        <button
          onClick={onCapture}
          className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-4 border-white shadow-lg active:scale-95 transition-transform"
          style={{ backgroundColor: "#003DA5" }}
        >
          <Camera size={30} className="text-white" />
        </button>

        {mode === "aluno-info" && (
          <p className="text-white/60 text-xs">
            A IA irá extrair Nome e Matrícula automaticamente
          </p>
        )}

        <label
          htmlFor={fileInputId}
          className="text-white/70 text-xs underline cursor-pointer"
        >
          Usar foto do celular
        </label>

        <button onClick={onManual} className="text-white/60 text-xs underline">
          Inserir manualmente
        </button>
      </div>
    </motion.div>
  );
}
