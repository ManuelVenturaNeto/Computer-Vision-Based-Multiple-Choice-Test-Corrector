import { Camera } from "lucide-react";
import { motion } from "motion/react";
import type { Ref } from "react";

import {
  OPCOES,
  type LiveAnswerSheetDetection,
  type CameraMode,
} from "./constants";

interface CameraPreviewProps {
  mode: CameraMode;
  liveDetection: LiveAnswerSheetDetection | null;
  scanProgress: number;
  videoRef: Ref<HTMLVideoElement>;
  videoElement: HTMLVideoElement | null;
  fileInputId: string;
  onCapture: () => void | Promise<void>;
  onManual: () => void;
}

function DetectedAnswerSheetOverlay({
  liveDetection,
  videoElement,
}: {
  liveDetection: LiveAnswerSheetDetection;
  videoElement: HTMLVideoElement | null;
}) {
  if (!videoElement) return null;

  const containerWidth = videoElement.clientWidth;
  const containerHeight = videoElement.clientHeight;
  if (containerWidth <= 0 || containerHeight <= 0) return null;

  const sourceWidth = liveDetection.frameWidth;
  const sourceHeight = liveDetection.frameHeight;
  const coverScale = Math.max(
    containerWidth / sourceWidth,
    containerHeight / sourceHeight
  );
  const renderedWidth = sourceWidth * coverScale;
  const renderedHeight = sourceHeight * coverScale;
  const offsetX = (containerWidth - renderedWidth) / 2;
  const offsetY = (containerHeight - renderedHeight) / 2;

  const tableLeft = offsetX + liveDetection.table.x * coverScale;
  const tableTop = offsetY + liveDetection.table.y * coverScale;
  const tableWidth = liveDetection.table.width * coverScale;
  const tableHeight = liveDetection.table.height * coverScale;
  const colWidth = liveDetection.table.cellWidth * coverScale;
  const rowHeight = liveDetection.table.cellHeight * coverScale;

  return (
    <div className="absolute inset-0">
      {/* 
        Sobreposição dinâmica:
        - a grade azul é desenhada na posição retornada pela visão computacional
        - a bolinha vermelha aparece apenas quando a linha tem uma única marcação válida
        - linhas sem resposta ficam sem bolinha, criando o "gap" visual pedido
      */}
      <div
        className="absolute border-2 border-cyan-300/90 bg-cyan-300/10 rounded-[10px]"
        style={{
          left: tableLeft,
          top: tableTop,
          width: tableWidth,
          height: tableHeight,
        }}
      >
        {Array.from({ length: liveDetection.table.colCount - 1 }).map((_, index) => (
          <div
            key={`detected-col-${index}`}
            className="absolute top-0 bottom-0 border-r border-cyan-300/60"
            style={{ left: (index + 1) * colWidth }}
          />
        ))}

        {Array.from({ length: liveDetection.table.rowCount - 1 }).map((_, index) => (
          <div
            key={`detected-row-${index}`}
            className="absolute left-0 right-0 border-b border-cyan-300/55"
            style={{ top: (index + 1) * rowHeight }}
          />
        ))}

        {liveDetection.gapRows.map((row) => (
          <div
            key={`gap-row-${row}`}
            className="absolute left-0 right-0 bg-yellow-400/10"
            style={{
              top: row * rowHeight,
              height: rowHeight,
            }}
          />
        ))}
      </div>

      {liveDetection.markedAnswers.map((answer) => (
        <div
          key={`mark-${answer.row}-${answer.col}-${answer.option}`}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: offsetX + answer.centerX * coverScale,
            top: offsetY + answer.centerY * coverScale,
          }}
        >
          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
        </div>
      ))}

      <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[11px] text-white">
        {liveDetection.markedAnswers.length} marcações válidas · {liveDetection.gapRows.length} gaps
      </div>
    </div>
  );
}

export function CameraPreview({
  mode,
  liveDetection,
  scanProgress,
  videoRef,
  videoElement,
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

          {mode !== "aluno-info" && scanProgress > 0 && (
            <div
              className="absolute left-0 right-0 h-0.5 bg-yellow-400"
              style={{ top: `${scanProgress}%`, transition: "top 80ms" }}
            />
          )}

          {mode !== "aluno-info" ? (
            liveDetection ? (
              <DetectedAnswerSheetOverlay
                liveDetection={liveDetection}
                videoElement={videoElement}
              />
            ) : null
          ) : (
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
            : liveDetection
              ? "Gabarito identificado. Confira as bolinhas vermelhas."
              : "Aponte a câmera para o gabarito para detectar as marcações"}
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pb-10 px-6 flex flex-col items-center gap-4 bg-gradient-to-t from-black/80 to-transparent pt-16">
        {mode !== "aluno-info" && scanProgress > 0 && scanProgress < 100 && (
          <div className="w-full bg-white/20 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-yellow-400 transition-all"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        )}

        <button
          onClick={onCapture}
          disabled={scanProgress > 0}
          className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-4 border-white disabled:opacity-50 shadow-lg active:scale-95 transition-transform"
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
