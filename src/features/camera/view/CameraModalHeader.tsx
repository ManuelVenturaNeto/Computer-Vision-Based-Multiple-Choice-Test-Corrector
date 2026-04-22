import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";

interface CameraModalHeaderProps {
  title: string;
  TitleIcon: LucideIcon;
  onClose: () => void;
}

export function CameraModalHeader({ title, TitleIcon, onClose }: CameraModalHeaderProps) {
  return (
    <div style={{ backgroundColor: "#003DA5" }} className="flex items-center justify-between px-4 py-4 shrink-0">
      <div className="flex items-center gap-2"><TitleIcon size={20} className="text-white" /><span className="text-white text-sm">{title}</span></div>
      <button onClick={onClose} className="text-white p-1"><X size={22} /></button>
    </div>
  );
}
