import { useAppStateStore } from "./useAppStateStore";
import { useAppStateStudentActions } from "./useAppStateStudentActions";
import { useAppStateViewActions } from "./useAppStateViewActions";

export function useAppState() {
  const { state, dispatch, activeAluno } = useAppStateStore();
  const viewActions = useAppStateViewActions(
    dispatch,
    state.view,
    state.cameraEnabled
  );
  const studentActions = useAppStateStudentActions(dispatch);

  return {
    ...state,
    activeAluno,
    ...viewActions,
    ...studentActions,
  };
}
