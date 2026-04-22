import { Camera } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import type { CameraModalViewModel } from "../controller/cameraModalTypes";
import { CameraPreview } from "../CameraPreview";
import { ProcessingView } from "../ProcessingView";
import { CameraModalErrorState } from "./CameraModalErrorState";
import { CameraModalFormContent } from "./CameraModalFormContent";

interface CameraModalPhaseContentProps {
  controller: CameraModalViewModel;
}

export function CameraModalPhaseContent({ controller }: CameraModalPhaseContentProps) {
  return (
    <AnimatePresence mode="wait">
      {controller.phase === "starting" && <motion.div key="starting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-950"><div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: "#003DA5" }}><Camera size={32} className="text-white" /></div><p className="text-gray-300 text-sm">Iniciando câmera...</p></motion.div>}
      {controller.phase === "error" && <CameraModalErrorState fileInputId={controller.fileInputId} cameraErrorMessage={controller.cameraErrorMessage} onManual={controller.handleManualForm} />}
      {controller.phase === "preview" && <CameraPreview mode={controller.mode} videoRef={controller.videoRef} fileInputId={controller.fileInputId} onCapture={controller.handleCapture} onManual={controller.handleManualForm} />}
      {controller.phase === "processing" && <ProcessingView capturedImage={controller.capturedImage} processingStatus={controller.processingStatus} mode={controller.mode} />}
      {controller.phase === "form" && <CameraModalFormContent controller={controller} />}
    </AnimatePresence>
  );
}
