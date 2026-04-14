import { motion } from "motion/react";

import { StudentTable } from "@/features/student-table/StudentTable";
import type { Aluno, GabaritoReferencia } from "@/types";

interface CorrigirViewProps {
  alunos: Aluno[];
  gabaritoRef: GabaritoReferencia;
  onLerGabarito: (alunoId: string) => void;
}

export function CorrigirView({
  alunos,
  gabaritoRef,
  onLerGabarito,
}: CorrigirViewProps) {
  return (
    <motion.div
      key="corrigir"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="pb-28"
    >
      <div
        className="mx-4 mt-4 rounded-xl p-3 flex items-center justify-between"
        style={{ backgroundColor: "#EEF3FC" }}
      >
        <div>
          <p className="text-xs text-gray-500">Disciplina</p>
          <p className="text-sm" style={{ color: "#003DA5" }}>
            {gabaritoRef.disciplina}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Questões</p>
          <p className="text-sm" style={{ color: "#003DA5" }}>
            {gabaritoRef.numQuestoes}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <StudentTable
          alunos={alunos}
          gabaritoRef={gabaritoRef}
          onLerGabarito={onLerGabarito}
        />
      </div>
    </motion.div>
  );
}
