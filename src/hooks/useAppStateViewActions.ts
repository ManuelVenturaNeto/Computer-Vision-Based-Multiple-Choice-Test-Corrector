import { useCallback, type Dispatch } from "react";

import type { AppView } from "@/types";

import type { AppStateAction } from "./appStateTypes";

type StateSetter<T> = (value: T | ((current: T) => T)) => void;

export function useAppStateViewActions(
  dispatch: Dispatch<AppStateAction>,
  view: AppView,
  cameraEnabled: boolean
) {
  const setView = useCallback<StateSetter<AppView>>((value) => dispatch({ type: "set-view", view: typeof value === "function" ? value(view) : value }), [dispatch, view]);
  const setCameraEnabled = useCallback<StateSetter<boolean>>((value) => dispatch({ type: "set-camera-enabled", value: typeof value === "function" ? value(cameraEnabled) : value }), [cameraEnabled, dispatch]);

  return {
    setView,
    setCameraEnabled,
    handleGoHome: () => dispatch({ type: "set-view", view: "home" }),
    handleGoToCorrigir: () => dispatch({ type: "set-view", view: "corrigir" }),
    handleOpenSettings: () => dispatch({ type: "open-settings" }),
    handleCloseSettings: () => dispatch({ type: "close-settings" }),
    handleToggleCamera: () => dispatch({ type: "toggle-camera" }),
    handleCloseModal: () => dispatch({ type: "close-modal" }),
    handleCloseAlunoModal: () => dispatch({ type: "close-aluno-modal" }),
    handleLerGabarito: () => dispatch({ type: cameraEnabled ? "open-gabarito-ref-modal" : "open-disabled-modal" }),
    handleLimparGabarito: () => dispatch({ type: "request-clear" }),
    confirmLimpar: () => dispatch({ type: "confirm-clear" }),
    handleCancelLimpar: () => dispatch({ type: "cancel-clear" }),
  };
}
