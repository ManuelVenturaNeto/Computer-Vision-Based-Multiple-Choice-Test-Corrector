import { CheckCircle2, Clock } from "lucide-react";

interface NotaBadgeProps {
  nota?: number;
}

export function NotaBadge({ nota }: NotaBadgeProps) {
  if (nota === undefined) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
        <Clock size={10} />
        Pendente
      </span>
    );
  }

  const cor =
    nota >= 7
      ? { bg: "#DCFCE7", text: "#166534" }
      : nota >= 5
        ? { bg: "#FEF9C3", text: "#713F12" }
        : { bg: "#FEE2E2", text: "#991B1B" };

  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
      style={{ backgroundColor: cor.bg, color: cor.text }}
    >
      <CheckCircle2 size={10} />
      {nota.toFixed(1)}
    </span>
  );
}
