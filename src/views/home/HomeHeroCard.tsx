import { CheckCircle2, ScanLine } from "lucide-react";

import type { GabaritoReferencia } from "@/types";

interface HomeHeroCardProps {
  gabaritoRef: GabaritoReferencia | null;
}

export function HomeHeroCard({ gabaritoRef }: HomeHeroCardProps) {
  return (
    <div className="rounded-2xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #003DA5 0%, #0056D6 100%)" }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs opacity-70 mb-1">Sistema de Correção</p>
          <h2 className="text-white mb-1">{gabaritoRef ? gabaritoRef.disciplina : "Gabarito não definido"}</h2>
          <p className="text-xs opacity-80">{gabaritoRef ? `${gabaritoRef.numQuestoes} questões · ${gabaritoRef.dataProva}` : "Leia o gabarito de referência para iniciar"}</p>
        </div>
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
          {gabaritoRef ? <CheckCircle2 size={24} className="text-green-300" /> : <ScanLine size={24} className="text-white/80" />}
        </div>
      </div>
      {gabaritoRef && (
        <div className="mt-4 flex gap-2 flex-wrap">
          {gabaritoRef.respostas.map((resposta, index) => (
            <span key={`${index}-${resposta}`} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
              {index + 1}.{resposta}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
