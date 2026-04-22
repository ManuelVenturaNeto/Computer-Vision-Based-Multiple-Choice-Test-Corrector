import type { Aluno, GabaritoReferencia } from "@/types";

import { StudentTableEmptyState } from "./StudentTableEmptyState";
import { StudentTableGrid } from "./StudentTableGrid";
import { StudentTableStats } from "./StudentTableStats";

interface StudentTableProps {
  alunos: Aluno[];
  gabaritoRef: GabaritoReferencia;
  onLerGabarito: (alunoId: string) => void;
}

export function StudentTable({ alunos, gabaritoRef, onLerGabarito }: StudentTableProps) {
  if (alunos.length === 0) {
    return <StudentTableEmptyState />;
  }

  return (
    <div>
      <StudentTableStats alunos={alunos} />
      <StudentTableGrid alunos={alunos} gabaritoRef={gabaritoRef} onLerGabarito={onLerGabarito} />
    </div>
  );
}
