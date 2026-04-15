import { RefreshCw, Scan, Sparkles } from "lucide-react";

import { OPCOES } from "../constants";

interface GabaritoAlunoFormProps {
  alunoNome?: string;
  capturedImage: string | null;
  maskImage: string | null;
  answerSheetError: string | null;
  answerSheetInfo: string | null;
  respostas: string[];
  numQuestoes: number;
  errors: Record<string, string>;
  onRespostaChange: (index: number, opcao: string) => void;
  onRetry: () => void;
}

export function GabaritoAlunoForm({
  alunoNome,
  capturedImage,
  maskImage,
  answerSheetError,
  answerSheetInfo,
  respostas,
  numQuestoes,
  errors,
  onRespostaChange,
  onRetry,
}: GabaritoAlunoFormProps) {
  return (
    <>
      <div
        className="rounded-xl p-3 flex items-center gap-2"
        style={{ backgroundColor: "#EEF3FC" }}
      >
        <Scan size={16} style={{ color: "#003DA5" }} />
        <p className="text-sm" style={{ color: "#003DA5" }}>
          Respostas de <strong>{alunoNome || "Aluno"}</strong>
        </p>
      </div>

      {capturedImage && (
        <div className="space-y-2">
          {maskImage ? (
            <div>
              <p className="text-xs text-gray-500 mb-1">Máscara de detecção (grade + marcações)</p>
              <img
                src={maskImage}
                alt="Máscara de detecção"
                className="w-full rounded-xl border border-gray-200 object-contain"
                style={{ maxHeight: 220, background: "#111" }}
              />
            </div>
          ) : (
            <img
              src={capturedImage}
              alt="Folha capturada"
              className="w-full h-28 object-cover rounded-xl border border-gray-200"
            />
          )}
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
                  Respostas preenchidas automaticamente
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {answerSheetInfo ?? "Revise as respostas antes de salvar."}
              </p>
            </div>
          )}
        </div>
      )}

      {errors.respostas && <p className="text-red-500 text-xs">{errors.respostas}</p>}

      <div className="space-y-2">
        {Array.from({ length: numQuestoes }).map((_, index) => (
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

      <button onClick={onRetry} className="flex items-center gap-2 text-xs text-gray-400 mt-1">
        <RefreshCw size={12} />
        Ler novamente pela câmera
      </button>
    </>
  );
}
