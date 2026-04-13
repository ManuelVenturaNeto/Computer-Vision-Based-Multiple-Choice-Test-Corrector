import { Scan, CheckCircle2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { Aluno, GabaritoReferencia } from "../types";

interface StudentTableProps {
  alunos: Aluno[];
  gabaritoRef: GabaritoReferencia;
  onLerGabarito: (alunoId: string) => void;
}

function NotaBadge({ nota }: { nota?: number }) {
  if (nota === undefined)
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
        <Clock size={10} />
        Pendente
      </span>
    );

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

function AlunoRow({
  aluno,
  gabaritoRef,
  onLerGabarito,
}: {
  aluno: Aluno;
  gabaritoRef: GabaritoReferencia;
  onLerGabarito: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="border-b border-gray-100 cursor-pointer active:bg-gray-50"
        onClick={() => aluno.gabarito && setExpanded(!expanded)}
      >
        <td className="px-3 py-3">
          <div className="flex flex-col">
            <span className="text-sm text-gray-800 leading-tight">
              {aluno.nome}
            </span>
            <span className="text-xs text-gray-400">{aluno.matricula}</span>
          </div>
        </td>
        <td className="px-2 py-3 text-center">
          <NotaBadge nota={aluno.nota} />
        </td>
        <td className="px-2 py-3 text-right">
          {!aluno.gabarito ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLerGabarito(aluno.id);
              }}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-white"
              style={{ backgroundColor: "#003DA5" }}
            >
              <Scan size={12} />
              Ler gabarito
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="text-gray-400 p-1"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && aluno.gabarito && (
        <tr className="bg-gray-50">
          <td colSpan={3} className="px-3 py-3">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 mb-2">
                Acertos: <strong>{aluno.acertos}</strong>/
                {gabaritoRef.numQuestoes} &nbsp;·&nbsp; Nota:{" "}
                <strong>{aluno.nota?.toFixed(1)}</strong>
              </p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: gabaritoRef.numQuestoes }).map((_, i) => {
                  const correto =
                    aluno.gabarito![i] === gabaritoRef.respostas[i];
                  return (
                    <div
                      key={i}
                      className="flex flex-col items-center"
                      style={{ width: 32 }}
                    >
                      <span className="text-xs text-gray-400">{i + 1}</span>
                      <span
                        className="text-xs w-7 h-7 flex items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: correto ? "#DCFCE7" : "#FEE2E2",
                          color: correto ? "#166534" : "#991B1B",
                        }}
                      >
                        {aluno.gabarito![i] || "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => onLerGabarito(aluno.id)}
                className="mt-2 text-xs text-blue-600 underline"
              >
                Reler gabarito
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function StudentTable({
  alunos,
  gabaritoRef,
  onLerGabarito,
}: StudentTableProps) {
  const corrigidos = alunos.filter((a) => a.nota !== undefined).length;
  const mediaNotas =
    corrigidos > 0
      ? alunos
          .filter((a) => a.nota !== undefined)
          .reduce((acc, a) => acc + (a.nota ?? 0), 0) / corrigidos
      : null;

  if (alunos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#EEF3FC" }}
        >
          <Scan size={28} style={{ color: "#003DA5" }} />
        </div>
        <p className="text-gray-500 text-sm">
          Nenhum aluno adicionado ainda.
          <br />
          Clique em <strong>"+ Adicionar Aluno"</strong> para começar.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3">
        <div className="bg-white rounded-xl p-2.5 text-center border border-gray-100 shadow-sm">
          <p className="text-lg" style={{ color: "#003DA5" }}>
            {alunos.length}
          </p>
          <p className="text-xs text-gray-500">Alunos</p>
        </div>
        <div className="bg-white rounded-xl p-2.5 text-center border border-gray-100 shadow-sm">
          <p className="text-lg text-green-600">{corrigidos}</p>
          <p className="text-xs text-gray-500">Corrigidos</p>
        </div>
        <div className="bg-white rounded-xl p-2.5 text-center border border-gray-100 shadow-sm">
          <p
            className="text-lg"
            style={{
              color:
                mediaNotas === null
                  ? "#9CA3AF"
                  : mediaNotas >= 7
                  ? "#16A34A"
                  : mediaNotas >= 5
                  ? "#CA8A04"
                  : "#DC2626",
            }}
          >
            {mediaNotas !== null ? mediaNotas.toFixed(1) : "–"}
          </p>
          <p className="text-xs text-gray-500">Média</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white mx-4 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#003DA5" }}>
              <th className="text-left px-3 py-2.5 text-xs text-white/80">
                Aluno
              </th>
              <th className="text-center px-2 py-2.5 text-xs text-white/80">
                Nota
              </th>
              <th className="text-right px-2 py-2.5 text-xs text-white/80">
                Ação
              </th>
            </tr>
          </thead>
          <tbody>
            {alunos.map((aluno) => (
              <AlunoRow
                key={aluno.id}
                aluno={aluno}
                gabaritoRef={gabaritoRef}
                onLerGabarito={onLerGabarito}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
