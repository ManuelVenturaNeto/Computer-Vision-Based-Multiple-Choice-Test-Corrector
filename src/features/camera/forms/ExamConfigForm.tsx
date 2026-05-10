import type { AlternativeRange, CameraMode } from "../constants";
import { ALTERNATIVE_RANGES, EXAM_MAX_QUESTION_COUNT, EXAM_MIN_QUESTION_COUNT } from "../constants";

interface ExamConfigFormProps {
  numQuestoes: number;
  questionCountInput: string;
  alternativeRange: AlternativeRange;
  mode: CameraMode;
  onQuestionCountChange: (value: string) => void;
  onAlternativeRangeChange: (r: AlternativeRange) => void;
  onConfirm: () => void;
}

export function ExamConfigForm(props: ExamConfigFormProps) {
  const { questionCountInput, alternativeRange, mode, onQuestionCountChange, onAlternativeRangeChange, onConfirm } = props;

  const title = mode === "gabarito-ref"
    ? "Configurar gabarito de referência"
    : "Configurar gabarito do aluno";

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-8 gap-6 bg-gray-50">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>

      <div>
        <label className="block text-sm text-gray-600 mb-1">
          {`Número de questões (${EXAM_MIN_QUESTION_COUNT}–${EXAM_MAX_QUESTION_COUNT})`}
        </label>
        <input
          inputMode="numeric"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-700"
          placeholder={String(props.numQuestoes)}
          value={questionCountInput}
          onChange={(event) => onQuestionCountChange(event.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-2">Alternativas</label>
        <div className="flex gap-2">
          {ALTERNATIVE_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => onAlternativeRangeChange(range)}
              className="flex-1 py-2 rounded-xl text-sm border transition-all"
              style={
                alternativeRange === range
                  ? { backgroundColor: "#003DA5", color: "white", borderColor: "#003DA5" }
                  : { backgroundColor: "white", color: "#374151", borderColor: "#D1D5DB" }
              }
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onConfirm}
        className="w-full py-3.5 rounded-xl text-white font-medium"
        style={{ backgroundColor: "#003DA5" }}
      >
        Continuar
      </button>
    </div>
  );
}
