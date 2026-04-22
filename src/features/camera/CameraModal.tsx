import type { CameraModalProps } from "./controller/cameraModalTypes";
import { useCameraModalController } from "./controller/useCameraModalController";
import { CameraModalView } from "./view/CameraModalView";

export function CameraModal(props: CameraModalProps) {
  const controller = useCameraModalController(props);
  return <CameraModalView controller={controller} />;
}
