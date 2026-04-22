import { CheckCircle, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

import type { CameraModalViewModel } from "../controller/cameraModalTypes";
import { AlunoInfoForm } from "../forms/AlunoInfoForm";
import { GabaritoAlunoForm } from "../forms/GabaritoAlunoForm";
import { GabaritoRefForm } from "../forms/GabaritoRefForm";

interface CameraModalFormContentProps {
  controller: CameraModalViewModel;
}

export function CameraModalFormContent({ controller }: CameraModalFormContentProps) {
  return (
    <motion.div key="form" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <div className="flex-1 overflow-y-auto"><div className="p-4 space-y-4">{controller.mode === "aluno-info" ? <AlunoInfoForm capturedImage={controller.capturedImage} ocrError={controller.ocrError} nome={controller.nome} matricula={controller.matricula} errors={controller.errors} onNomeChange={controller.setNome} onMatriculaChange={controller.setMatricula} onRetry={controller.handleRetry} /> : controller.mode === "gabarito-ref" ? <GabaritoRefForm capturedImage={controller.capturedImage} answerSheetError={controller.answerSheetError} answerSheetInfo={controller.answerSheetInfo} disciplina={controller.disciplina} dataProva={controller.dataProva} respostas={controller.respostas} errors={controller.errors} onDisciplinaChange={controller.setDisciplina} onDataProvaChange={controller.setDataProva} onRespostaChange={controller.handleResposta} onRetry={controller.handleRetry} /> : <GabaritoAlunoForm alunoNome={controller.alunoNome} capturedImage={controller.capturedImage} answerSheetError={controller.answerSheetError} answerSheetInfo={controller.answerSheetInfo} respostas={controller.respostas} numQuestoes={controller.numQuestoes} errors={controller.errors} onRespostaChange={controller.handleResposta} onRetry={controller.handleRetry} />}</div></div>
      <div className="px-4 pt-3 pb-6 border-t border-gray-200 bg-white shrink-0"><button onClick={controller.handleSubmit} className="w-full py-3.5 rounded-xl text-white flex items-center justify-center gap-2" style={{ backgroundColor: "#003DA5" }}><CheckCircle size={18} /><span>{controller.mode === "gabarito-ref" ? "Salvar Gabarito Referência" : controller.mode === "aluno-info" ? "Registrar Aluno" : "Salvar Gabarito do Aluno"}</span><ChevronRight size={16} /></button></div>
    </motion.div>
  );
}
