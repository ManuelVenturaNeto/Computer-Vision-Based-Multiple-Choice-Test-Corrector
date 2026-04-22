import type { Aluno, GabaritoReferencia } from "@/types";

import { StudentRow } from "./StudentRow";

interface StudentTableGridProps {
  alunos: Aluno[];
  gabaritoRef: GabaritoReferencia;
  onLerGabarito: (alunoId: string) => void;
}

export function StudentTableGrid(props: StudentTableGridProps) {
  const { alunos, gabaritoRef, onLerGabarito } = props;

  return (
    <div className="bg-white mx-4 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead><tr style={{ backgroundColor: "#003DA5" }}><th className="text-left px-3 py-2.5 text-xs text-white/80">Aluno</th><th className="text-center px-2 py-2.5 text-xs text-white/80">Nota</th><th className="text-right px-2 py-2.5 text-xs text-white/80">Ação</th></tr></thead>
        <tbody>{alunos.map((aluno) => <StudentRow key={aluno.id} aluno={aluno} gabaritoRef={gabaritoRef} onLerGabarito={onLerGabarito} />)}</tbody>
      </table>
    </div>
  );
}
