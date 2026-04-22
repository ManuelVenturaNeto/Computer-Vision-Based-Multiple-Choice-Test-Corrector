import type { Aluno } from "@/types";

interface StudentTableStatsProps {
  alunos: Aluno[];
}

export function StudentTableStats({ alunos }: StudentTableStatsProps) {
  const corrigidos = alunos.filter((aluno) => aluno.nota !== undefined).length;
  const mediaNotas = corrigidos > 0 ? alunos.filter((aluno) => aluno.nota !== undefined).reduce((total, aluno) => total + (aluno.nota ?? 0), 0) / corrigidos : null;

  return (
    <div className="grid grid-cols-3 gap-2 px-4 py-3">
      <StatCard label="Alunos" value={String(alunos.length)} color="#003DA5" />
      <StatCard label="Corrigidos" value={String(corrigidos)} className="text-green-600" />
      <StatCard label="Média" value={mediaNotas !== null ? mediaNotas.toFixed(1) : "–"} color={getAverageColor(mediaNotas)} />
    </div>
  );
}

function StatCard({ label, value, color, className }: { label: string; value: string; color?: string; className?: string }) {
  return <div className="bg-white rounded-xl p-2.5 text-center border border-gray-100 shadow-sm"><p className={`text-lg ${className ?? ""}`} style={color ? { color } : undefined}>{value}</p><p className="text-xs text-gray-500">{label}</p></div>;
}

function getAverageColor(mediaNotas: number | null) {
  if (mediaNotas === null) return "#9CA3AF";
  if (mediaNotas >= 7) return "#16A34A";
  if (mediaNotas >= 5) return "#CA8A04";
  return "#DC2626";
}
