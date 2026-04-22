import { AlunoCaptureSummary } from "./AlunoCaptureSummary";
import { FormRetryButton } from "./FormRetryButton";

interface AlunoInfoFormProps {
  capturedImage: string | null;
  ocrError: string | null;
  nome: string;
  matricula: string;
  errors: Record<string, string>;
  onNomeChange: (value: string) => void;
  onMatriculaChange: (value: string) => void;
  onRetry: () => void;
}

export function AlunoInfoForm(props: AlunoInfoFormProps) {
  const { capturedImage, ocrError, nome, matricula, errors, onNomeChange, onMatriculaChange, onRetry } = props;

  return (
    <>
      <AlunoCaptureSummary capturedImage={capturedImage} ocrError={ocrError} />
      <div><label className="block text-sm text-gray-600 mb-1">Nome completo</label><input className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-700" placeholder="Somente letras" value={nome} onChange={(event) => onNomeChange(event.target.value)} autoCapitalize="words" />{errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}</div>
      <div><label className="block text-sm text-gray-600 mb-1">Matrícula <span className="text-gray-400 text-xs">(6 dígitos)</span></label><input className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-700 tracking-widest" placeholder="000000" value={matricula} onChange={(event) => onMatriculaChange(event.target.value)} inputMode="numeric" maxLength={6} />{matricula && <p className={`text-xs mt-1 ${matricula.length === 6 ? "text-green-600" : "text-gray-400"}`}>{matricula.length}/6 dígitos</p>}{errors.matricula && <p className="text-red-500 text-xs mt-1">{errors.matricula}</p>}</div>
      <FormRetryButton label="Tirar outra foto" onRetry={onRetry} />
    </>
  );
}
