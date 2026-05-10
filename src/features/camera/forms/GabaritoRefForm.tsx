import { BookOpen } from "lucide-react";

import { AnswerOptionsGrid } from "./AnswerOptionsGrid";
import { AnswerSheetCaptureSummary } from "./AnswerSheetCaptureSummary";
import { FormRetryButton } from "./FormRetryButton";
import { GabaritoRefMetadataFields } from "./GabaritoRefMetadataFields";

interface GabaritoRefFormProps {
  capturedImage: string | null;
  answerSheetError: string | null;
  answerSheetInfo: string | null;
  disciplina: string;
  dataProva: string;
  numQuestoes: number;
  alternativeCount: number;
  respostas: string[];
  errors: Record<string, string>;
  onDisciplinaChange: (value: string) => void;
  onDataProvaChange: (value: string) => void;
  onRespostaChange: (index: number, opcao: string) => void;
  onRetry: () => void;
}

export function GabaritoRefForm(props: GabaritoRefFormProps) {
  const { capturedImage, answerSheetError, answerSheetInfo, disciplina, dataProva, numQuestoes, alternativeCount, respostas, errors, onDisciplinaChange, onDataProvaChange, onRespostaChange, onRetry } = props;

  return (
    <>
      <AnswerSheetCaptureSummary capturedImage={capturedImage} alt="Gabarito capturado" error={answerSheetError} info={answerSheetInfo ?? "Confira as respostas antes de salvar."} emptyMessage="Tire uma foto para preencher o gabarito automaticamente ou ajuste manualmente." title="Gabarito lido automaticamente" Icon={BookOpen} />
      <GabaritoRefMetadataFields disciplina={disciplina} dataProva={dataProva} disciplinaError={errors.disciplina} onDisciplinaChange={onDisciplinaChange} onDataProvaChange={onDataProvaChange} />
      <div><label className="block text-sm text-gray-600 mb-2">Gabarito</label>{errors.respostas && <p className="text-red-500 text-xs mb-2">{errors.respostas}</p>}<AnswerOptionsGrid numQuestoes={numQuestoes} alternativeCount={alternativeCount} respostas={respostas} onRespostaChange={onRespostaChange} /></div>
      <FormRetryButton label="Ler novamente pela câmera" onRetry={onRetry} />
    </>
  );
}
