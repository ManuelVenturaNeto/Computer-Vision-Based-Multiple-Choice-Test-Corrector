export { createInitialAppState } from "./appStateHelpers.js";
export type { AppState, AppStateAction } from "./appStateTypes.js";

import type { AppState, AppStateAction } from "./appStateTypes.js";
import { transitionAppState } from "./appStateTransitions.js";

export function appStateReducer(state: AppState, action: AppStateAction) {
  return transitionAppState(state, action);
}
