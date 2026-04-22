import type { ChangeEvent, RefObject } from "react";
import type { LucideIcon } from "lucide-react";
import type { GabaritoReferencia } from "@/types";

import type { CameraMode, CameraPhase } from "../constants";

export interface CameraModalProps {
  mode: CameraMode;
  numQuestoes?: number;
  alunoNome?: string;
  onClose: () => void;
  onGabaritoRef?: (gabarito: GabaritoReferencia) => void;
  onAlunoInfo?: (nome: string, matricula: string) => void;
  onGabaritoAluno?: (respostas: string[]) => void;
}

export interface CameraModalViewModel {
  mode: CameraMode;
  phase: CameraPhase;
  numQuestoes: number;
  alunoNome?: string;
  fileInputId: string;
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  title: string;
  TitleIcon: LucideIcon;
  capturedImage: string | null;
  processingStatus: string;
  cameraErrorMessage: string | null;
  ocrError: string | null;
  answerSheetError: string | null;
  answerSheetInfo: string | null;
  disciplina: string;
  dataProva: string;
  respostas: string[];
  nome: string;
  matricula: string;
  errors: Record<string, string>;
  handleCapture: () => Promise<void>;
  handleSelecionarArquivo: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleManualForm: () => void;
  handleClose: () => void;
  handleRetry: () => void;
  handleSubmit: () => void;
  handleResposta: (index: number, opcao: string) => void;
  setDisciplina: (value: string) => void;
  setDataProva: (value: string) => void;
  setNome: (value: string) => void;
  setMatricula: (value: string) => void;
}
