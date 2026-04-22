import { Sparkles, User } from "lucide-react";

interface AlunoCaptureSummaryProps {
  capturedImage: string | null;
  ocrError: string | null;
}

export function AlunoCaptureSummary({ capturedImage, ocrError }: AlunoCaptureSummaryProps) {
  if (!capturedImage) {
    return <div className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: "#EEF3FC" }}><div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#003DA5" }}><User size={18} className="text-white" /></div><p className="text-sm text-gray-600">Preencha os dados do aluno</p></div>;
  }

  return (
    <div className="flex gap-3 items-start">
      <img src={capturedImage} alt="Documento capturado" className="w-20 h-14 object-cover rounded-xl border border-gray-200" />
      <div className="flex-1">{ocrError ? <div className="rounded-xl p-2.5 bg-yellow-50 border border-yellow-200"><p className="text-xs text-yellow-700">⚠️ {ocrError}</p></div> : <div className="rounded-xl p-2.5" style={{ backgroundColor: "#EEF3FC" }}><div className="flex items-center gap-1.5 mb-0.5"><Sparkles size={12} style={{ color: "#003DA5" }} /><span className="text-xs" style={{ color: "#003DA5" }}>Dados extraídos pela IA</span></div><p className="text-xs text-gray-500">Confira e corrija se necessário.</p></div>}</div>
    </div>
  );
}
