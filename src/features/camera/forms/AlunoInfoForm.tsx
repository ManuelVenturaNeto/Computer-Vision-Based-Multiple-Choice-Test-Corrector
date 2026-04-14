import { RefreshCw, Sparkles, User } from "lucide-react";

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

export function AlunoInfoForm({
  capturedImage,
  ocrError,
  nome,
  matricula,
  errors,
  onNomeChange,
  onMatriculaChange,
  onRetry,
}: AlunoInfoFormProps) {
  return (
    <>
      {capturedImage ? (
        <div className="flex gap-3 items-start">
          <img
            src={capturedImage}
            alt="Documento capturado"
            className="w-20 h-14 object-cover rounded-xl border border-gray-200"
          />
          <div className="flex-1">
            {ocrError ? (
              <div className="rounded-xl p-2.5 bg-yellow-50 border border-yellow-200">
                <p className="text-xs text-yellow-700">⚠️ {ocrError}</p>
              </div>
            ) : (
              <div
                className="rounded-xl p-2.5"
                style={{ backgroundColor: "#EEF3FC" }}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Sparkles size={12} style={{ color: "#003DA5" }} />
                  <span className="text-xs" style={{ color: "#003DA5" }}>
                    Dados extraídos pela IA
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Confira e corrija se necessário.
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
            <User size={18} className="text-white" />
          </div>
          <p className="text-sm text-gray-600">Preencha os dados do aluno</p>
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-600 mb-1">Nome completo</label>
        <input
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-700"
          placeholder="Somente letras"
          value={nome}
          onChange={(event) => onNomeChange(event.target.value)}
          autoCapitalize="words"
        />
        {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">
          Matrícula <span className="text-gray-400 text-xs">(6 dígitos)</span>
        </label>
        <input
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-700 tracking-widest"
          placeholder="000000"
          value={matricula}
          onChange={(event) => onMatriculaChange(event.target.value)}
          inputMode="numeric"
          maxLength={6}
        />
        {matricula && (
          <p
            className={`text-xs mt-1 ${
              matricula.length === 6 ? "text-green-600" : "text-gray-400"
            }`}
          >
            {matricula.length}/6 dígitos
          </p>
        )}
        {errors.matricula && (
          <p className="text-red-500 text-xs mt-1">{errors.matricula}</p>
        )}
      </div>

      <button onClick={onRetry} className="flex items-center gap-2 text-xs text-gray-400 mt-1">
        <RefreshCw size={12} />
        Tirar outra foto
      </button>
    </>
  );
}
