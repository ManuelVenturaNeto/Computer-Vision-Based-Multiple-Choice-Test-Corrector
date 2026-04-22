import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

interface AnswerSheetCaptureSummaryProps {
  capturedImage: string | null;
  title: string;
  alt: string;
  error: string | null;
  info: string | null;
  emptyMessage: string;
  Icon: LucideIcon;
}

export function AnswerSheetCaptureSummary(props: AnswerSheetCaptureSummaryProps) {
  const { capturedImage, title, alt, error, info, emptyMessage, Icon } = props;
  if (!capturedImage) {
    return <div className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: "#EEF3FC" }}><div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#003DA5" }}><Icon size={18} className="text-white" /></div><p className="text-sm text-gray-600">{emptyMessage}</p></div>;
  }

  return (
    <div className="space-y-2">
      <img src={capturedImage} alt={alt} className="w-full h-28 object-cover rounded-xl border border-gray-200" />
      {error ? <div className="rounded-xl p-2.5 bg-yellow-50 border border-yellow-200"><p className="text-xs text-yellow-700">{error}</p></div> : <div className="rounded-xl p-2.5" style={{ backgroundColor: "#EEF3FC" }}><div className="flex items-center gap-1.5 mb-0.5"><Sparkles size={12} style={{ color: "#003DA5" }} /><span className="text-xs" style={{ color: "#003DA5" }}>{title}</span></div><p className="text-xs text-gray-500">{info}</p></div>}
    </div>
  );
}
