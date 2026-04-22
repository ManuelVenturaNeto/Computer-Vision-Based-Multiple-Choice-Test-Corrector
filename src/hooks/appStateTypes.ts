import type { Aluno, AppView, GabaritoReferencia, ModalType } from "../types.js";

export interface AppState {
  view: AppView;
  cameraEnabled: boolean;
  gabaritoRef: GabaritoReferencia | null;
  alunos: Aluno[];
  activeModal: ModalType;
  activeAlunoId: string | null;
  showSettings: boolean;
  showClearConfirm: boolean;
}

export type AppStateAction =
  | { type: "set-view"; view: AppView }
  | { type: "set-camera-enabled"; value: boolean }
  | { type: "toggle-camera" }
  | { type: "open-settings" | "close-settings" | "close-modal" | "close-aluno-modal" }
  | { type: "open-disabled-modal" | "open-gabarito-ref-modal" | "request-clear" | "cancel-clear" | "confirm-clear" | "open-aluno-info-modal" }
  | { type: "save-gabarito-ref"; gabarito: GabaritoReferencia }
  | { type: "add-aluno"; nome: string; matricula: string; createdAt: number }
  | { type: "open-aluno-gabarito-modal"; alunoId: string }
  | { type: "save-aluno-gabarito"; respostas: string[]; readAtIso: string };
