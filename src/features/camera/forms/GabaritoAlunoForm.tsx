import { Scan } from "lucide-react";

import { AnswerOptionsGrid } from "./AnswerOptionsGrid";
import { AnswerSheetCaptureSummary } from "./AnswerSheetCaptureSummary";
import { FormRetryButton } from "./FormRetryButton";

interface GabaritoAlunoFormProps {
  alunoNome?: string;
  capturedImage: string | null;
  answerSheetError: string | null;
  answerSheetInfo: string | null;
  respostas: string[];
  numQuestoes: number;
  errors: Record<string, string>;
  onRespostaChange: (index: number, opcao: string) => void;
  onRetry: () => void;
}

export function GabaritoAlunoForm(props: GabaritoAlunoFormProps) {
  const { alunoNome, capturedImage, answerSheetError, answerSheetInfo, respostas, numQuestoes, errors, onRespostaChange, onRetry } = props;

  return (
    <>
      <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: "#EEF3FC" }}><Scan size={16} style={{ color: "#003DA5" }} /><p className="text-sm" style={{ color: "#003DA5" }}>Respostas de <strong>{alunoNome || "Aluno"}</strong></p></div>
      <AnswerSheetCaptureSummary capturedImage={capturedImage} alt="Folha capturada" error={answerSheetError} info={answerSheetInfo ?? "Revise as respostas antes de salvar."} emptyMessage="Revise e ajuste as respostas do aluno manualmente." title="Respostas preenchidas automaticamente" Icon={Scan} />
      {errors.respostas && <p className="text-red-500 text-xs">{errors.respostas}</p>}
      <AnswerOptionsGrid numQuestoes={numQuestoes} respostas={respostas} onRespostaChange={onRespostaChange} />
      <FormRetryButton label="Ler novamente pela câmera" onRetry={onRetry} />
    </>
  );
}
