import { useEffect, useRef, useState } from "react";
import {
  Camera,
  X,
  CheckCircle,
  AlertCircle,
  Scan,
  ChevronRight,
  User,
  BookOpen,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { GabaritoReferencia } from "../types";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;

type CameraPhase = "starting" | "preview" | "processing" | "form" | "error";

interface CameraModalProps {
  mode: "gabarito-ref" | "aluno-info" | "gabarito-aluno";
  numQuestoes?: number;
  alunoNome?: string;
  onClose: () => void;
  onGabaritoRef?: (gabarito: GabaritoReferencia) => void;
  onAlunoInfo?: (nome: string, matricula: string) => void;
  onGabaritoAluno?: (respostas: string[]) => void;
}

const OPCOES = ["A", "B", "C", "D", "E"];

async function extractAlunoFromImage(
  imageDataUrl: string
): Promise<{ nome: string; matricula: string }> {
  const base64 = imageDataUrl.split(",")[1];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analise esta imagem de um documento de aluno universitário.
Extraia:
1. O NOME do aluno: encontra-se próximo ao texto "Nome:" na imagem. O nome é composto somente por letras e espaços (sem números, pontos, hífens ou caracteres especiais).
2. A MATRÍCULA do aluno: encontra-se próximo ao texto "Matricula:" ou "Matrícula:" na imagem. É composta por exatamente 6 dígitos numéricos.

Retorne APENAS um JSON válido no formato: {"nome": "...", "matricula": "..."}
Se não encontrar algum campo, deixe como string vazia "".`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 150,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const nome = (parsed.nome ?? "")
        .replace(/[^a-zA-ZÀ-ÿ\s]/g, "")
        .trim();
      const matricula = (parsed.matricula ?? "")
        .replace(/\D/g, "")
        .slice(0, 6);
      return { nome, matricula };
    } catch {
      return { nome: "", matricula: "" };
    }
  }
  return { nome: "", matricula: "" };
}

export function CameraModal({
  mode,
  numQuestoes = 10,
  alunoNome,
  onClose,
  onGabaritoRef,
  onAlunoInfo,
  onGabaritoAluno,
}: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<CameraPhase>("starting");
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState("");
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Form states
  const [disciplina, setDisciplina] = useState("");
  const [dataProva, setDataProva] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [qtdQuestoes, setQtdQuestoes] = useState(numQuestoes);
  const [respostas, setRespostas] = useState<string[]>(
    Array(numQuestoes).fill("")
  );
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    setRespostas(Array(qtdQuestoes).fill(""));
  }, [qtdQuestoes]);

  const startCamera = async () => {
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPhase("preview");
    } catch {
      setPhase("error");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.92);
  };

  const handleCapturarAluno = async () => {
    const imageData = captureFrame();
    if (!imageData) return;

    setCapturedImage(imageData);
    stopCamera();
    setPhase("processing");
    setProcessingStatus("Capturando imagem...");
    setOcrError(null);

    try {
      setProcessingStatus("Analisando com IA...");
      const extracted = await extractAlunoFromImage(imageData);
      setNome(extracted.nome);
      setMatricula(extracted.matricula);
      setPhase("form");
    } catch (err) {
      console.error("OCR error:", err);
      setOcrError(
        "Não foi possível analisar a imagem automaticamente. Confira e preencha os campos manualmente."
      );
      setPhase("form");
    }
  };

  const handleCapturarGabarito = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        stopCamera();
        setPhase("form");
      }
    }, 80);
  };

  const handleResposta = (idx: number, opcao: string) => {
    setRespostas((prev) => {
      const novo = [...prev];
      novo[idx] = opcao;
      return novo;
    });
  };

  const validateAndSubmit = () => {
    const errs: Record<string, string> = {};

    if (mode === "gabarito-ref") {
      if (!disciplina.trim()) errs.disciplina = "Informe a disciplina";
      if (qtdQuestoes < 1 || qtdQuestoes > 50)
        errs.qtd = "Entre 1 e 50 questões";
      const vazias = respostas.slice(0, qtdQuestoes).filter((r) => !r).length;
      if (vazias > 0) errs.respostas = `${vazias} questão(ões) sem resposta`;
    } else if (mode === "aluno-info") {
      if (!nome.trim()) errs.nome = "Informe o nome do aluno";
      else if (/[0-9!@#$%^&*()_+={}\[\]|\\:;"'<>,.?\/`~]/.test(nome))
        errs.nome = "Nome deve conter apenas letras";
      if (!matricula.trim()) errs.matricula = "Informe a matrícula";
      else if (!/^\d{6}$/.test(matricula))
        errs.matricula = "Matrícula deve ter exatamente 6 dígitos";
    } else if (mode === "gabarito-aluno") {
      const vazias = respostas.slice(0, numQuestoes).filter((r) => !r).length;
      if (vazias > 0) errs.respostas = `${vazias} questão(ões) sem resposta`;
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (mode === "gabarito-ref" && onGabaritoRef) {
      onGabaritoRef({
        numQuestoes: qtdQuestoes,
        respostas: respostas.slice(0, qtdQuestoes),
        disciplina,
        dataProva,
      });
    } else if (mode === "aluno-info" && onAlunoInfo) {
      onAlunoInfo(nome, matricula);
    } else if (mode === "gabarito-aluno" && onGabaritoAluno) {
      onGabaritoAluno(respostas.slice(0, numQuestoes));
    }
  };

  const modeLabels = {
    "gabarito-ref": { title: "Ler Gabarito Referência", icon: BookOpen },
    "aluno-info": { title: "Identificar Aluno", icon: User },
    "gabarito-aluno": {
      title: `Gabarito de ${alunoNome || "Aluno"}`,
      icon: Scan,
    },
  };

  const { title, icon: TitleIcon } = modeLabels[mode];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div
        style={{ backgroundColor: "#003DA5" }}
        className="flex items-center justify-between px-4 py-4 shrink-0"
      >
        <div className="flex items-center gap-2">
          <TitleIcon size={20} className="text-white" />
          <span className="text-white text-sm">{title}</span>
        </div>
        <button onClick={onClose} className="text-white p-1">
          <X size={22} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Starting */}
        {phase === "starting" && (
          <motion.div
            key="starting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-950"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
              style={{ backgroundColor: "#003DA5" }}
            >
              <Camera size={32} className="text-white" />
            </div>
            <p className="text-gray-300 text-sm">Iniciando câmera...</p>
          </motion.div>
        )}

        {/* Camera Error */}
        {phase === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-950 px-6"
          >
            <AlertCircle size={48} className="text-red-400" />
            <p className="text-white text-center">
              Câmera não disponível neste dispositivo/navegador.
            </p>
            <p className="text-gray-400 text-sm text-center">
              Você pode inserir os dados manualmente.
            </p>
            <button
              onClick={() => setPhase("form")}
              className="mt-2 px-6 py-3 rounded-xl text-white text-sm"
              style={{ backgroundColor: "#003DA5" }}
            >
              Inserir dados manualmente
            </button>
          </motion.div>
        )}

        {/* Camera Preview */}
        {phase === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col relative overflow-hidden"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Scan overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div
                className="w-72 h-52 rounded-2xl relative"
                style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)" }}
              >
                {/* Corner marks */}
                <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-yellow-400 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-yellow-400 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-yellow-400 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-yellow-400 rounded-br-xl" />

                {/* Scan line for gabarito mode */}
                {mode !== "aluno-info" && scanProgress > 0 && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-yellow-400"
                    style={{ top: `${scanProgress}%`, transition: "top 80ms" }}
                  />
                )}

                {/* Aluno label hints */}
                {mode === "aluno-info" && (
                  <div className="absolute inset-0 flex flex-col justify-center items-start px-3 gap-2">
                    <div className="bg-yellow-400/20 border border-yellow-400/50 rounded px-2 py-0.5">
                      <span className="text-yellow-300 text-xs">Nome: ___</span>
                    </div>
                    <div className="bg-yellow-400/20 border border-yellow-400/50 rounded px-2 py-0.5">
                      <span className="text-yellow-300 text-xs">
                        Matrícula: ______
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <p className="mt-4 text-white text-xs bg-black/60 px-3 py-1.5 rounded-full">
                {mode === "aluno-info"
                  ? "Enquadre o documento com Nome e Matrícula"
                  : "Posicione o gabarito no quadro"}
              </p>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 pb-10 px-6 flex flex-col items-center gap-4 bg-gradient-to-t from-black/80 to-transparent pt-16">
              {/* Scan progress (gabarito modes) */}
              {mode !== "aluno-info" && scanProgress > 0 && scanProgress < 100 && (
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-yellow-400 transition-all"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              )}

              {mode === "aluno-info" ? (
                <>
                  <button
                    onClick={handleCapturarAluno}
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-4 border-white shadow-lg active:scale-95 transition-transform"
                    style={{ backgroundColor: "#003DA5" }}
                  >
                    <Camera size={30} className="text-white" />
                  </button>
                  <p className="text-white/60 text-xs">
                    A IA irá extrair Nome e Matrícula automaticamente
                  </p>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCapturarGabarito}
                    disabled={scanProgress > 0}
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center border-4 border-white disabled:opacity-50 shadow-lg active:scale-95 transition-transform"
                    style={{ backgroundColor: "#003DA5" }}
                  >
                    <Camera size={30} className="text-white" />
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  stopCamera();
                  setPhase("form");
                }}
                className="text-white/60 text-xs underline"
              >
                Inserir manualmente
              </button>
            </div>
          </motion.div>
        )}

        {/* Processing (OCR) */}
        {phase === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col bg-gray-950 overflow-hidden"
          >
            {capturedImage && (
              <div className="flex-1 relative">
                <img
                  src={capturedImage}
                  alt="Captura"
                  className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(0,61,165,0.8)" }}
                  >
                    <Loader2 size={36} className="text-white animate-spin" />
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-2 justify-center mb-1">
                      <Sparkles size={16} className="text-yellow-400" />
                      <span className="text-white text-sm">
                        Analisando com IA...
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs">{processingStatus}</p>
                  </div>

                  <div className="flex gap-1 mt-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-yellow-400"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Form */}
        {phase === "form" && (
          <motion.div
            key="form"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden bg-gray-50"
          >
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* ── ALUNO INFO FORM ── */}
                {mode === "aluno-info" && (
                  <>
                    {capturedImage && (
                      <div className="flex gap-3 items-start">
                        <img
                          src={capturedImage}
                          alt="Documento capturado"
                          className="w-20 h-14 object-cover rounded-xl border border-gray-200"
                        />
                        <div className="flex-1">
                          {ocrError ? (
                            <div className="rounded-xl p-2.5 bg-yellow-50 border border-yellow-200">
                              <p className="text-xs text-yellow-700">
                                ⚠️ {ocrError}
                              </p>
                            </div>
                          ) : (
                            <div
                              className="rounded-xl p-2.5"
                              style={{ backgroundColor: "#EEF3FC" }}
                            >
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Sparkles
                                  size={12}
                                  style={{ color: "#003DA5" }}
                                />
                                <span
                                  className="text-xs"
                                  style={{ color: "#003DA5" }}
                                >
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
                    )}

                    {!capturedImage && (
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
                        <p className="text-sm text-gray-600">
                          Preencha os dados do aluno
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Nome completo
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-700"
                        placeholder="Somente letras"
                        value={nome}
                        onChange={(e) =>
                          setNome(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""))
                        }
                        autoCapitalize="words"
                      />
                      {errors.nome && (
                        <p className="text-red-500 text-xs mt-1">{errors.nome}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Matrícula{" "}
                        <span className="text-gray-400 text-xs">(6 dígitos)</span>
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-700 tracking-widest"
                        placeholder="000000"
                        value={matricula}
                        onChange={(e) =>
                          setMatricula(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        inputMode="numeric"
                        maxLength={6}
                      />
                      {matricula && (
                        <p
                          className={`text-xs mt-1 ${
                            matricula.length === 6
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {matricula.length}/6 dígitos
                        </p>
                      )}
                      {errors.matricula && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.matricula}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setCapturedImage(null);
                        setNome("");
                        setMatricula("");
                        setErrors({});
                        setOcrError(null);
                        setScanProgress(0);
                        startCamera();
                      }}
                      className="flex items-center gap-2 text-xs text-gray-400 mt-1"
                    >
                      <RefreshCw size={12} />
                      Tirar outra foto
                    </button>
                  </>
                )}

                {/* ── GABARITO REF FORM ── */}
                {mode === "gabarito-ref" && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Disciplina
                      </label>
                      <input
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-700"
                        placeholder="Ex: Cálculo I"
                        value={disciplina}
                        onChange={(e) => setDisciplina(e.target.value)}
                      />
                      {errors.disciplina && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.disciplina}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Data da Prova
                      </label>
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-700"
                        value={dataProva}
                        onChange={(e) => setDataProva(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Número de Questões
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={1}
                          max={50}
                          value={qtdQuestoes}
                          onChange={(e) =>
                            setQtdQuestoes(Number(e.target.value))
                          }
                          className="flex-1"
                        />
                        <span
                          className="w-10 text-center py-1 rounded-lg text-sm text-white"
                          style={{ backgroundColor: "#003DA5" }}
                        >
                          {qtdQuestoes}
                        </span>
                      </div>
                      {errors.qtd && (
                        <p className="text-red-500 text-xs mt-1">{errors.qtd}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">
                        Gabarito
                      </label>
                      {errors.respostas && (
                        <p className="text-red-500 text-xs mb-2">
                          {errors.respostas}
                        </p>
                      )}
                      <div className="space-y-2">
                        {Array.from({ length: qtdQuestoes }).map((_, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200"
                          >
                            <span className="text-xs text-gray-500 w-6 shrink-0">
                              {i + 1}.
                            </span>
                            <div className="flex gap-1.5 flex-1">
                              {OPCOES.map((op) => (
                                <button
                                  key={op}
                                  onClick={() => handleResposta(i, op)}
                                  className="flex-1 py-1.5 rounded-lg text-xs border transition-all"
                                  style={
                                    respostas[i] === op
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
                                  {op}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ── GABARITO ALUNO FORM ── */}
                {mode === "gabarito-aluno" && (
                  <>
                    <div
                      className="rounded-xl p-3 flex items-center gap-2"
                      style={{ backgroundColor: "#EEF3FC" }}
                    >
                      <Scan size={16} style={{ color: "#003DA5" }} />
                      <p className="text-sm" style={{ color: "#003DA5" }}>
                        Respostas de{" "}
                        <strong>{alunoNome || "Aluno"}</strong>
                      </p>
                    </div>
                    {errors.respostas && (
                      <p className="text-red-500 text-xs">{errors.respostas}</p>
                    )}
                    <div className="space-y-2">
                      {Array.from({ length: numQuestoes }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200"
                        >
                          <span className="text-xs text-gray-500 w-6 shrink-0">
                            {i + 1}.
                          </span>
                          <div className="flex gap-1.5 flex-1">
                            {OPCOES.map((op) => (
                              <button
                                key={op}
                                onClick={() => handleResposta(i, op)}
                                className="flex-1 py-1.5 rounded-lg text-xs border transition-all"
                                style={
                                  respostas[i] === op
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
                                {op}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="px-4 pt-3 pb-6 border-t border-gray-200 bg-white shrink-0">
              <button
                onClick={validateAndSubmit}
                className="w-full py-3.5 rounded-xl text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: "#003DA5" }}
              >
                <CheckCircle size={18} />
                <span>
                  {mode === "gabarito-ref"
                    ? "Salvar Gabarito Referência"
                    : mode === "aluno-info"
                    ? "Registrar Aluno"
                    : "Salvar Gabarito do Aluno"}
                </span>
                <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
