import type { AppState, AppStateAction } from "./appStateTypes.js";
import { buildAluno, updateAlunoAnswers } from "./appStateHelpers.js";

export function transitionAppState(state: AppState, action: AppStateAction): AppState {
  switch (action.type) {
    case "set-view": return { ...state, view: action.view };
    case "set-camera-enabled": return { ...state, cameraEnabled: action.value };
    case "toggle-camera": return { ...state, cameraEnabled: !state.cameraEnabled };
    case "open-settings": return { ...state, showSettings: true };
    case "close-settings": return { ...state, showSettings: false };
    case "close-modal": return { ...state, activeModal: "none" };
    case "close-aluno-modal": return { ...state, activeModal: "none", activeAlunoId: null };
    case "open-disabled-modal": return { ...state, activeModal: "disabled" };
    case "open-gabarito-ref-modal": return { ...state, activeModal: "camera-gabarito-ref" };
    case "save-gabarito-ref": return { ...state, gabaritoRef: action.gabarito, activeModal: "none" };
    case "request-clear": return { ...state, showClearConfirm: true };
    case "cancel-clear": return { ...state, showClearConfirm: false };
    case "confirm-clear": return { ...state, gabaritoRef: null, alunos: [], view: "home", activeAlunoId: null, activeModal: "none", showClearConfirm: false };
    case "open-aluno-info-modal": return { ...state, activeModal: "camera-aluno-info" };
    case "add-aluno": return { ...state, alunos: [...state.alunos, buildAluno(action.nome, action.matricula, action.createdAt)], activeModal: "none" };
    case "open-aluno-gabarito-modal": return { ...state, activeAlunoId: action.alunoId, activeModal: "camera-gabarito-aluno" };
    case "save-aluno-gabarito":
      return !state.gabaritoRef || !state.activeAlunoId
        ? state
        : { ...state, alunos: updateAlunoAnswers(state.alunos, state.activeAlunoId, state.gabaritoRef, action.respostas, action.readAtIso), activeModal: "none", activeAlunoId: null };
  }
}
