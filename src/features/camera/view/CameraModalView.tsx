import type { CameraModalViewModel } from "../controller/cameraModalTypes";

import { CameraModalHeader } from "./CameraModalHeader";
import { CameraModalPhaseContent } from "./CameraModalPhaseContent";

interface CameraModalViewProps {
  controller: CameraModalViewModel;
}

export function CameraModalView({ controller }: CameraModalViewProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <canvas ref={controller.canvasRef} className="hidden" />
      <input id={controller.fileInputId} type="file" accept="image/*" capture={controller.mode === "aluno-info" ? "user" : "environment"} onChange={(event) => { void controller.handleSelecionarArquivo(event); }} className="sr-only" tabIndex={-1} aria-hidden="true" />
      <CameraModalHeader title={controller.title} TitleIcon={controller.TitleIcon} onClose={controller.handleClose} />
      <CameraModalPhaseContent controller={controller} />
    </div>
  );
}
