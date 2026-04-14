import { Loader2, Sparkles } from "lucide-react";
import { motion } from "motion/react";

import type { CameraMode } from "./constants";

interface ProcessingViewProps {
  capturedImage: string | null;
  processingStatus: string;
  mode: CameraMode;
}

export function ProcessingView({
  capturedImage,
  processingStatus,
  mode,
}: ProcessingViewProps) {
  return (
    <motion.div
      key="processing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col bg-gray-950 overflow-hidden"
    >
      {capturedImage && (
        <div className="flex-1 relative">
          <img
            src={capturedImage}
            alt="Captura"
            className="w-full h-full object-cover opacity-40"
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,61,165,0.8)" }}
            >
              <Loader2 size={36} className="text-white animate-spin" />
            </div>

            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-1">
                <Sparkles size={16} className="text-yellow-400" />
                <span className="text-white text-sm">
                  {mode === "aluno-info" ? "Analisando com IA..." : "Lendo gabarito..."}
                </span>
              </div>
              <p className="text-gray-400 text-xs">{processingStatus}</p>
            </div>

            <div className="flex gap-1 mt-2">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="w-2 h-2 rounded-full bg-yellow-400"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: index * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
