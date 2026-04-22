import { ChevronDown, ChevronUp, Scan } from "lucide-react";
import { useState } from "react";

import type { Aluno, GabaritoReferencia } from "@/types";

import { NotaBadge } from "./NotaBadge";
import { StudentAnswersDetails } from "./StudentAnswersDetails";

interface StudentRowProps {
  aluno: Aluno;
  gabaritoRef: GabaritoReferencia;
  onLerGabarito: (id: string) => void;
}

export function StudentRow({ aluno, gabaritoRef, onLerGabarito }: StudentRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="border-b border-gray-100 cursor-pointer active:bg-gray-50" onClick={() => aluno.gabarito && setExpanded((value) => !value)}>
        <td className="px-3 py-3"><div className="flex flex-col"><span className="text-sm text-gray-800 leading-tight">{aluno.nome}</span><span className="text-xs text-gray-400">{aluno.matricula}</span></div></td>
        <td className="px-2 py-3 text-center"><NotaBadge nota={aluno.nota} /></td>
        <td className="px-2 py-3 text-right">{aluno.gabarito ? <ToggleButton expanded={expanded} onToggle={() => setExpanded((value) => !value)} /> : <ReadButton alunoId={aluno.id} onLerGabarito={onLerGabarito} />}</td>
      </tr>
      {expanded && aluno.gabarito && <StudentAnswersDetails aluno={aluno} gabaritoRef={gabaritoRef} onLerGabarito={onLerGabarito} />}
    </>
  );
}

function ToggleButton({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return <button onClick={(event) => { event.stopPropagation(); onToggle(); }} className="text-gray-400 p-1">{expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>;
}

function ReadButton({ alunoId, onLerGabarito }: { alunoId: string; onLerGabarito: (id: string) => void }) {
  return <button onClick={(event) => { event.stopPropagation(); onLerGabarito(alunoId); }} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-white" style={{ backgroundColor: "#003DA5" }}><Scan size={12} />Ler gabarito</button>;
}
