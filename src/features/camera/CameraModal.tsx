import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { AlertCircle, BookOpen, Camera, CheckCircle, ChevronRight, Scan, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import type { GabaritoReferencia } from "@/types";

import { CameraPreview } from "./CameraPreview";
import {
  FIXED_QUESTION_COUNT,
  buildAnswerSheetSummary,
  resizeAnswers,
  type CameraMode,
  type CameraPhase,
} from "./constants";
import { AlunoInfoForm } from "./forms/AlunoInfoForm";
import { GabaritoAlunoForm } from "./forms/GabaritoAlunoForm";
import { GabaritoRefForm } from "./forms/GabaritoRefForm";
import { useCameraStream } from "./hooks/useCameraStream";
import { ProcessingView } from "./ProcessingView";
import {
  extractAlunoFromImage,
  readAnswerSheetFromImage,
} from "./services/cameraProcessing";

interface CameraModalProps {
  mode: CameraMode;
  numQuestoes?: number;
  alunoNome?: string;
  onClose: () => void;
  onGabaritoRef?: (gabarito: GabaritoReferencia) => void;
  onAlunoInfo?: (nome: string, matricula: string) => void;
  onGabaritoAluno?: (respostas: string[]) => void;
}

const MAX_SELECTED_IMAGE_DIMENSION = 1600;
const SELECTED_IMAGE_QUALITY = 0.82;

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function loadImageFromUrl(imageUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      reject(new Error("Nao foi possivel ler a imagem selecionada."));
    };
    image.src = imageUrl;
  });
}

function readFileAsDataUrl(file: File) {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Selecione uma imagem valida."));
  }

  const imageUrl = URL.createObjectURL(file);

  return loadImageFromUrl(imageUrl)
    .then((image) => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;

      if (!width || !height) {
        throw new Error("Nao foi possivel ler a imagem selecionada.");
      }

      const scale = Math.min(
        1,
        MAX_SELECTED_IMAGE_DIMENSION / Math.max(width, height)
      );
      const targetWidth = Math.max(1, Math.round(width * scale));
      const targetHeight = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Nao foi possivel preparar a imagem selecionada.");
      }

      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, targetWidth, targetHeight);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, targetWidth, targetHeight);

      return canvas.toDataURL("image/jpeg", SELECTED_IMAGE_QUALITY);
    })
    .catch((error: unknown) => {
      throw error instanceof Error
        ? error
        : new Error("Nao foi possivel ler a imagem selecionada.");
    })
    .finally(() => {
      URL.revokeObjectURL(imageUrl);
    });
}

export function CameraModal({
  mode,
  numQuestoes = FIXED_QUESTION_COUNT,
  alunoNome,
  onClose,
  onGabaritoRef,
  onAlunoInfo,
  onGabaritoAluno,
}: CameraModalProps) {
  const { videoRef, startCamera, stopCamera, captureFrame } = useCameraStream();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputId = useId();

  const [phase, setPhase] = useState<CameraPhase>("starting");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState("");
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [answerSheetError, setAnswerSheetError] = useState<string | null>(null);
  const [answerSheetInfo, setAnswerSheetInfo] = useState<string | null>(null);
  const [disciplina, setDisciplina] = useState("");
  const [dataProva, setDataProva] = useState(new Date().toISOString().split("T")[0]);
  const [respostas, setRespostas] = useState<string[]>(
    Array(FIXED_QUESTION_COUNT).fill("")
  );
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isAlunoInfoMode = mode === "aluno-info";

  const openCameraPreview = useCallback(async () => {
    setPhase("starting");
    setCameraErrorMessage(null);
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    setPhase("preview");

    try {
      await startCamera();
    } catch (error) {
      setCameraErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel iniciar a camera neste dispositivo."
      );
      setPhase("error");
    }
  }, [startCamera]);

  useEffect(() => {
    void openCameraPreview();

    return () => {
      stopCamera();
    };
  }, [openCameraPreview, stopCamera]);

  const resetToCamera = () => {
    setCapturedImage(null);
    setProcessingStatus("");
    setErrors({});
    setCameraErrorMessage(null);
    setOcrError(null);
    setAnswerSheetError(null);
    setAnswerSheetInfo(null);
    void openCameraPreview();
  };

  const processAlunoImage = async (imageData: string) => {
    setCapturedImage(imageData);
    stopCamera();
    setPhase("processing");
    setProcessingStatus("Capturando imagem...");
    setOcrError(null);
    await waitForNextPaint();

    try {
      setProcessingStatus("Analisando com IA...");
      const extracted = await extractAlunoFromImage(imageData);
      setNome(extracted.nome);
      setMatricula(extracted.matricula);
    } catch {
      setOcrError(
        "Não foi possível analisar a imagem automaticamente. Confira e preencha os campos manualmente."
      );
    } finally {
      setPhase("form");
    }
  };

  const processGabaritoImage = async (imageData: string) => {
    setCapturedImage(imageData);
    stopCamera();
    setPhase("processing");
    setProcessingStatus("Processando imagem...");
    setAnswerSheetError(null);
    setAnswerSheetInfo(null);
    await waitForNextPaint();

    try {
      const result = await readAnswerSheetFromImage(
        imageData,
        FIXED_QUESTION_COUNT,
        (status) => {
          setProcessingStatus(status);
        }
      );
      const totalQuestoes =
        mode === "gabarito-aluno" ? numQuestoes : FIXED_QUESTION_COUNT;

      setErrors({});
      setRespostas(resizeAnswers(result.respostas, totalQuestoes));
      setAnswerSheetInfo(buildAnswerSheetSummary(result));
    } catch (error) {
      setAnswerSheetError(
        error instanceof Error
          ? error.message
          : "Não foi possível ler o gabarito automaticamente. Confira e preencha manualmente."
      );
    } finally {
      setPhase("form");
    }
  };

  /*
    A camera possui dois fluxos independentes:
    1. aluno-info: mantem a leitura atual por OCR/API
    2. gabarito: so processa depois da foto, executando o pipeline do algo.html
  */
  const processCapturedImage = async (imageData: string) => {
    if (isAlunoInfoMode) {
      await processAlunoImage(imageData);
      return;
    }

    await processGabaritoImage(imageData);
  };

  const handleCapture = async () => {
    const imageData = captureFrame(canvasRef);
    if (!imageData) return;
    await processCapturedImage(imageData);
  };

  const handleSelecionarArquivo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      stopCamera();
      setCapturedImage(null);
      setPhase("processing");
      setProcessingStatus("Preparando foto...");
      setOcrError(null);
      setAnswerSheetError(null);
      setAnswerSheetInfo(null);
      await waitForNextPaint();

      const imageData = await readFileAsDataUrl(file);
      await processCapturedImage(imageData);
    } catch (error) {
      if (isAlunoInfoMode) {
        setOcrError(
          error instanceof Error ? error.message : "Nao foi possivel usar a imagem selecionada."
        );
      } else {
        setAnswerSheetError(
          error instanceof Error ? error.message : "Nao foi possivel usar a imagem selecionada."
        );
      }
      setPhase("form");
    } finally {
      event.target.value = "";
    }
  };

  const handleResposta = (index: number, opcao: string) => {
    setRespostas((previous) => {
      const next = [...previous];
      next[index] = opcao;
      return next;
    });
  };

  const handleManualForm = () => {
    stopCamera();
    setPhase("form");
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const validateAndSubmit = () => {
    const nextErrors: Record<string, string> = {};

    if (mode === "gabarito-ref") {
      if (!disciplina.trim()) nextErrors.disciplina = "Informe a disciplina";
      const vazias = respostas
        .slice(0, FIXED_QUESTION_COUNT)
        .filter((resposta) => !resposta).length;
      if (vazias > 0) nextErrors.respostas = `${vazias} questão(ões) sem resposta`;
    } else if (mode === "aluno-info") {
      if (!nome.trim()) nextErrors.nome = "Informe o nome do aluno";
      else if (/[0-9!@#$%^&*()_+={}\[\]|\\:;"'<>,.?\/`~]/.test(nome)) {
        nextErrors.nome = "Nome deve conter apenas letras";
      }

      if (!matricula.trim()) nextErrors.matricula = "Informe a matrícula";
      else if (!/^\d{6}$/.test(matricula)) {
        nextErrors.matricula = "Matrícula deve ter exatamente 6 dígitos";
      }
    } else {
      const vazias = respostas
        .slice(0, numQuestoes)
        .filter((resposta) => !resposta).length;
      if (vazias > 0) nextErrors.respostas = `${vazias} questão(ões) sem resposta`;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (mode === "gabarito-ref" && onGabaritoRef) {
      onGabaritoRef({
        numQuestoes: FIXED_QUESTION_COUNT,
        respostas: respostas.slice(0, FIXED_QUESTION_COUNT),
        disciplina,
        dataProva,
      });
      return;
    }

    if (mode === "aluno-info" && onAlunoInfo) {
      onAlunoInfo(nome, matricula);
      return;
    }

    if (mode === "gabarito-aluno" && onGabaritoAluno) {
      onGabaritoAluno(respostas.slice(0, numQuestoes));
    }
  };

  const modeLabels = {
    "gabarito-ref": { title: "Ler Gabarito Referência", icon: BookOpen },
    "aluno-info": { title: "Identificar Aluno", icon: User },
    "gabarito-aluno": { title: `Gabarito de ${alunoNome || "Aluno"}`, icon: Scan },
  };
  const { title, icon: TitleIcon } = modeLabels[mode];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <canvas ref={canvasRef} className="hidden" />
      <input
        id={fileInputId}
        type="file"
        accept="image/*"
        capture={mode === "aluno-info" ? "user" : "environment"}
        onChange={handleSelecionarArquivo}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <div
        style={{ backgroundColor: "#003DA5" }}
        className="flex items-center justify-between px-4 py-4 shrink-0"
      >
        <div className="flex items-center gap-2">
          <TitleIcon size={20} className="text-white" />
          <span className="text-white text-sm">{title}</span>
        </div>
        <button onClick={handleClose} className="text-white p-1">
          <X size={22} />
        </button>
      </div>

      <AnimatePresence mode="wait">
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
            {cameraErrorMessage && (
              <p className="text-gray-300 text-sm text-center">
                {cameraErrorMessage}
              </p>
            )}
            <p className="text-gray-400 text-sm text-center">
              Você pode tirar uma foto pelo navegador ou inserir os dados manualmente.
            </p>
            <label
              htmlFor={fileInputId}
              className="mt-1 px-6 py-3 rounded-xl text-white text-sm border border-white/20 cursor-pointer"
              style={{ backgroundColor: "#1F2937" }}
            >
              Tirar ou enviar foto
            </label>
            <button
              onClick={handleManualForm}
              className="mt-2 px-6 py-3 rounded-xl text-white text-sm"
              style={{ backgroundColor: "#003DA5" }}
            >
              Inserir dados manualmente
            </button>
          </motion.div>
        )}

        {phase === "preview" && (
          <CameraPreview
            mode={mode}
            videoRef={videoRef}
            fileInputId={fileInputId}
            onCapture={handleCapture}
            onManual={handleManualForm}
          />
        )}

        {phase === "processing" && (
          <ProcessingView
            capturedImage={capturedImage}
            processingStatus={processingStatus}
            mode={mode}
          />
        )}

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
                  {isAlunoInfoMode ? (
                    <AlunoInfoForm
                    capturedImage={capturedImage}
                    ocrError={ocrError}
                    nome={nome}
                    matricula={matricula}
                    errors={errors}
                    onNomeChange={(value) =>
                      setNome(value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""))
                    }
                    onMatriculaChange={(value) =>
                      setMatricula(value.replace(/\D/g, "").slice(0, 6))
                    }
                    onRetry={() => {
                      setNome("");
                      setMatricula("");
                      resetToCamera();
                    }}
                  />
                ) : mode === "gabarito-ref" ? (
                  <GabaritoRefForm
                    capturedImage={capturedImage}
                    answerSheetError={answerSheetError}
                    answerSheetInfo={answerSheetInfo}
                    disciplina={disciplina}
                    dataProva={dataProva}
                    respostas={respostas}
                    errors={errors}
                    onDisciplinaChange={setDisciplina}
                    onDataProvaChange={setDataProva}
                    onRespostaChange={handleResposta}
                    onRetry={resetToCamera}
                  />
                ) : (
                  <GabaritoAlunoForm
                    alunoNome={alunoNome}
                    capturedImage={capturedImage}
                    answerSheetError={answerSheetError}
                    answerSheetInfo={answerSheetInfo}
                    respostas={respostas}
                    numQuestoes={numQuestoes}
                    errors={errors}
                    onRespostaChange={handleResposta}
                    onRetry={resetToCamera}
                  />
                )}
              </div>
            </div>

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
                    : isAlunoInfoMode
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
