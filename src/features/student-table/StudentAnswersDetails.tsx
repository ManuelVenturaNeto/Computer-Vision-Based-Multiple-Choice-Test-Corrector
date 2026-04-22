import type { Aluno, GabaritoReferencia } from "@/types";

interface StudentAnswersDetailsProps {
  aluno: Aluno;
  gabaritoRef: GabaritoReferencia;
  onLerGabarito: (alunoId: string) => void;
}

export function StudentAnswersDetails(props: StudentAnswersDetailsProps) {
  const { aluno, gabaritoRef, onLerGabarito } = props;

  return (
    <tr className="bg-gray-50">
      <td colSpan={3} className="px-3 py-3">
        <div className="space-y-1">
          <p className="text-xs text-gray-500 mb-2">Acertos: <strong>{aluno.acertos}</strong>/{gabaritoRef.numQuestoes}&nbsp;·&nbsp; Nota: <strong>{aluno.nota?.toFixed(1)}</strong></p>
          <div className="flex flex-wrap gap-1">{Array.from({ length: gabaritoRef.numQuestoes }).map((_, index) => <AnswerCell key={index} index={index} aluno={aluno} gabaritoRef={gabaritoRef} />)}</div>
          <button onClick={() => onLerGabarito(aluno.id)} className="mt-2 text-xs text-blue-600 underline">Reler gabarito</button>
        </div>
      </td>
    </tr>
  );
}

function AnswerCell({ aluno, gabaritoRef, index }: { aluno: Aluno; gabaritoRef: GabaritoReferencia; index: number }) {
  const correto = aluno.gabarito?.[index] === gabaritoRef.respostas[index];
  return <div className="flex flex-col items-center" style={{ width: 32 }}><span className="text-xs text-gray-400">{index + 1}</span><span className="text-xs w-7 h-7 flex items-center justify-center rounded-lg" style={{ backgroundColor: correto ? "#DCFCE7" : "#FEE2E2", color: correto ? "#166534" : "#991B1B" }}>{aluno.gabarito?.[index] || "-"}</span></div>;
}
