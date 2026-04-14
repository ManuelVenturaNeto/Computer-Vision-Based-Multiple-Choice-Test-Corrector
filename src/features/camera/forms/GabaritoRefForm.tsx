import { BookOpen, RefreshCw, Sparkles } from "lucide-react";

import { FIXED_QUESTION_COUNT, OPCOES } from "../constants";

interface GabaritoRefFormProps {
  capturedImage: string | null;
  answerSheetError: string | null;
  answerSheetInfo: string | null;
  disciplina: string;
  dataProva: string;
  respostas: string[];
  errors: Record<string, string>;
  onDisciplinaChange: (value: string) => void;
  onDataProvaChange: (value: string) => void;
  onRespostaChange: (index: number, opcao: string) => void;
  onRetry: () => void;
}

export function GabaritoRefForm({
  capturedImage,
  answerSheetError,
  answerSheetInfo,
  disciplina,
  dataProva,
  respostas,
  errors,
  onDisciplinaChange,
  onDataProvaChange,
  onRespostaChange,
  onRetry,
}: GabaritoRefFormProps) {
  return (
    <>
      {capturedImage ? (
        <div className="flex gap-3 items-start">
          <img
            src={capturedImage}
            alt="Gabarito capturado"
            className="w-20 h-14 object-cover rounded-xl border border-gray-200"
          />
          <div className="flex-1">
            {answerSheetError ? (
              <div className="rounded-xl p-2.5 bg-yellow-50 border border-yellow-200">
                <p className="text-xs text-yellow-700">{answerSheetError}</p>
              </div>
            ) : (
              <div
                className="rounded-xl p-2.5"
                style={{ backgroundColor: "#EEF3FC" }}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Sparkles size={12} style={{ color: "#003DA5" }} />
                  <span className="text-xs" style={{ color: "#003DA5" }}>
                    Gabarito lido automaticamente
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {answerSheetInfo ?? "Confira as respostas antes de salvar."}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl p-3 flex items-center gap-3"
          style={{ backgroundColor: "#EEF3FC" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#003DA5" }}
          >
            <BookOpen size={18} className="text-white" />
          </div>
          <p className="text-sm text-gray-600">
            Tire uma foto para preencher o gabarito automaticamente ou ajuste
            manualmente.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-600 mb-1">Disciplina</label>
        <input
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-700"
          placeholder="Ex: Cálculo I"
          value={disciplina}
          onChange={(event) => onDisciplinaChange(event.target.value)}
        />
        {errors.disciplina && (
          <p className="text-red-500 text-xs mt-1">{errors.disciplina}</p>
        )}
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Data da Prova</label>
        <input
          type="date"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-700"
          value={dataProva}
          onChange={(event) => onDataProvaChange(event.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Número de Questões
        </label>
        <div
          className="w-full rounded-xl px-3 py-2.5 text-sm border border-gray-200"
          style={{ backgroundColor: "#EEF3FC", color: "#003DA5" }}
        >
          10 questões fixas
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-2">Gabarito</label>
        {errors.respostas && (
          <p className="text-red-500 text-xs mb-2">{errors.respostas}</p>
        )}
        <div className="space-y-2">
          {Array.from({ length: FIXED_QUESTION_COUNT }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200"
            >
              <span className="text-xs text-gray-500 w-6 shrink-0">
                {index + 1}.
              </span>
              <div className="flex gap-1.5 flex-1">
                {OPCOES.map((opcao) => (
                  <button
                    key={opcao}
                    onClick={() => onRespostaChange(index, opcao)}
                    className="flex-1 py-1.5 rounded-lg text-xs border transition-all"
                    style={
                      respostas[index] === opcao
                        ? {
                            backgroundColor: "#003DA5",
                            color: "white",
                            borderColor: "#003DA5",
                          }
                        : {
                            backgroundColor: "white",
                            color: "#374151",
                            borderColor: "#D1D5DB",
                          }
                    }
                  >
                    {opcao}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onRetry} className="flex items-center gap-2 text-xs text-gray-400 mt-1">
        <RefreshCw size={12} />
        Ler novamente pela câmera
      </button>
    </>
  );
}
