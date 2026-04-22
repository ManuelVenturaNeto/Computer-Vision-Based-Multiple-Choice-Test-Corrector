import { Camera } from "lucide-react";

interface HomeReadReferenceButtonProps {
  cameraEnabled: boolean;
  onReadGabarito: () => void;
}

export function HomeReadReferenceButton({
  cameraEnabled,
  onReadGabarito,
}: HomeReadReferenceButtonProps) {
  return (
    <button onClick={onReadGabarito} className="w-full flex items-center gap-3 p-4 rounded-2xl text-white shadow-md active:scale-95 transition-transform" style={{ backgroundColor: cameraEnabled ? "#003DA5" : "#6B7280" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
        <Camera size={22} className="text-white" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-white leading-tight">Ler Gabarito Referência</p>
        <p className="text-xs opacity-70">{cameraEnabled ? "Abrir câmera para escanear" : "Função desabilitada"}</p>
      </div>
      {!cameraEnabled && <span className="text-xs bg-red-500/80 px-2 py-0.5 rounded-full">OFF</span>}
    </button>
  );
}
