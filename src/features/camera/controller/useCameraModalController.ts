import { useCallback, useEffect, useId, useRef, useState } from "react";

import { buildCameraModalPayload, validateCameraModalSubmission } from "./cameraModalSubmission";
import type { CameraModalProps, CameraModalViewModel } from "./cameraModalTypes";
import { getCameraModeMeta } from "../cameraModeMeta";
import { sanitizeStudentNameInput, sanitizeStudentRegistrationInput } from "../cameraValidation";
import {
  ALTERNATIVE_COUNT_BY_RANGE,
  DEFAULT_QUESTION_COUNT,
  EXAM_DEFAULT_ALTERNATIVE_RANGE,
  EXAM_DEFAULT_QUESTION_COUNT,
  buildAnswerSheetSummary,
  resizeAnswers,
  resolveExamQuestionCountInput,
  sanitizeExamQuestionCountInput,
  type AlternativeRange,
} from "../constants";
import { useCameraStream } from "../hooks/useCameraStream";
import { readImageFileAsDataUrl, waitForNextPaint } from "../imageSelection";
import { browserCameraProcessingAdapter } from "../services/cameraProcessing";

export function useCameraModalController(props: CameraModalProps): CameraModalViewModel {
  const {
    mode,
    numQuestoes: alunoQuestionCount = DEFAULT_QUESTION_COUNT,
    alunoNome,
    onClose,
    onGabaritoRef,
    onAlunoInfo,
    onGabaritoAluno,
  } = props;
  const { videoRef, startCamera, stopCamera, captureFrame } = useCameraStream();
  const fileInputId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<CameraModalViewModel["phase"]>(
    mode === "aluno-info" ? "starting" : "config"
  );
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState("");
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [answerSheetError, setAnswerSheetError] = useState<string | null>(null);
  const [answerSheetInfo, setAnswerSheetInfo] = useState<string | null>(null);
  const [disciplina, setDisciplina] = useState("");
  const [dataProva, setDataProva] = useState(new Date().toISOString().split("T")[0]);
  const [questionCountInput, setQuestionCountInputValue] = useState(
    String(EXAM_DEFAULT_QUESTION_COUNT)
  );
  const [alternativeRange, setAlternativeRange] = useState<AlternativeRange>(
    EXAM_DEFAULT_ALTERNATIVE_RANGE
  );
  const alternativeCount = ALTERNATIVE_COUNT_BY_RANGE[alternativeRange];
  const examQuestionCount = resolveExamQuestionCountInput(questionCountInput);
  const currentQuestionCount =
    mode === "gabarito-aluno" ? alunoQuestionCount : examQuestionCount;
  const [respostas, setRespostas] = useState<string[]>(
    Array(currentQuestionCount).fill("")
  );
  const [nome, setNomeValue] = useState("");
  const [matricula, setMatriculaValue] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearFeedback = useCallback(() => {
    setErrors({});
    setCameraErrorMessage(null);
    setOcrError(null);
    setAnswerSheetError(null);
    setAnswerSheetInfo(null);
  }, []);

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

  const handleConfirmConfig = useCallback(() => {
    void openCameraPreview();
  }, [openCameraPreview]);

  const handleRetry = useCallback(() => {
    setCapturedImage(null);
    setProcessingStatus("");
    if (mode === "aluno-info") {
      setNomeValue("");
      setMatriculaValue("");
    }
    clearFeedback();
    void openCameraPreview();
  }, [clearFeedback, mode, openCameraPreview]);

  useEffect(() => {
    if (mode !== "aluno-info") return;
    void openCameraPreview();
    return () => stopCamera();
  }, [mode, openCameraPreview, stopCamera]);

  useEffect(() => {
    if (mode === "aluno-info") return;
    setRespostas((current) => resizeAnswers(current, currentQuestionCount));
  }, [currentQuestionCount, mode]);

  const setQuestionCountInput = useCallback((value: string) => {
    setQuestionCountInputValue(sanitizeExamQuestionCountInput(value));
  }, []);

  const handleResposta = useCallback(
    (index: number, opcao: string) =>
      setRespostas((current) =>
        current.map((resposta, respostaIndex) =>
          respostaIndex === index ? opcao : resposta
        )
      ),
    []
  );

  const processCapturedImage = useCallback(
    async (imageData: string) => {
      setCapturedImage(imageData);
      stopCamera();
      setPhase("processing");
      setProcessingStatus(
        mode === "aluno-info" ? "Capturando imagem..." : "Processando imagem..."
      );
      clearFeedback();
      await waitForNextPaint();

      try {
        if (mode === "aluno-info") {
          setProcessingStatus("Analisando com IA...");
          const extracted = await browserCameraProcessingAdapter.extractAlunoFromImage(imageData);
          setNomeValue(extracted.nome);
          setMatriculaValue(extracted.matricula);
        } else {
          const result = await browserCameraProcessingAdapter.readAnswerSheetFromImage(
            imageData,
            currentQuestionCount,
            alternativeCount,
            (status) => setProcessingStatus(status)
          );
          setRespostas(resizeAnswers(result.respostas, currentQuestionCount));
          setAnswerSheetInfo(buildAnswerSheetSummary(result, currentQuestionCount));
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Nao foi possivel usar a imagem selecionada.";
        mode === "aluno-info" ? setOcrError(message) : setAnswerSheetError(message);
      } finally {
        setPhase("form");
      }
    },
    [alternativeCount, clearFeedback, currentQuestionCount, mode, stopCamera]
  );

  const handleCapture = useCallback(async () => {
    const imageData = captureFrame(canvasRef);
    if (imageData) await processCapturedImage(imageData);
  }, [captureFrame, processCapturedImage]);

  const handleSelecionarArquivo = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        stopCamera();
        setCapturedImage(null);
        setPhase("processing");
        setProcessingStatus("Preparando foto...");
        clearFeedback();
        await waitForNextPaint();
        await processCapturedImage(await readImageFileAsDataUrl(file));
      } finally {
        event.target.value = "";
      }
    },
    [clearFeedback, processCapturedImage, stopCamera]
  );

  const handleSubmit = useCallback(() => {
    const input = {
      mode,
      disciplina,
      dataProva,
      nome,
      matricula,
      respostas,
      numQuestoes: currentQuestionCount,
    };
    const nextErrors = validateCameraModalSubmission(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = buildCameraModalPayload(input);
    if (payload.type === "gabarito-ref") onGabaritoRef?.(payload.value);
    if (payload.type === "aluno-info") onAlunoInfo?.(payload.value.nome, payload.value.matricula);
    if (payload.type === "gabarito-aluno") onGabaritoAluno?.(payload.value);
  }, [
    currentQuestionCount,
    dataProva,
    disciplina,
    matricula,
    mode,
    nome,
    onAlunoInfo,
    onGabaritoAluno,
    onGabaritoRef,
    respostas,
  ]);

  const { title, icon: TitleIcon } = getCameraModeMeta(mode, alunoNome);

  return {
    mode,
    phase,
    numQuestoes: currentQuestionCount,
    alunoNome,
    fileInputId,
    videoRef,
    canvasRef,
    title,
    TitleIcon,
    capturedImage,
    processingStatus,
    cameraErrorMessage,
    ocrError,
    answerSheetError,
    answerSheetInfo,
    disciplina,
    dataProva,
    respostas,
    questionCountInput,
    nome,
    matricula,
    errors,
    alternativeRange,
    setAlternativeRange,
    alternativeCount,
    handleConfirmConfig,
    handleCapture,
    handleSelecionarArquivo,
    handleManualForm: () => {
      stopCamera();
      setPhase("form");
    },
    handleClose: () => {
      stopCamera();
      onClose();
    },
    handleRetry,
    handleSubmit,
    handleResposta,
    setQuestionCountInput,
    setDisciplina,
    setDataProva,
    setNome: (value) => setNomeValue(sanitizeStudentNameInput(value)),
    setMatricula: (value) => setMatriculaValue(sanitizeStudentRegistrationInput(value)),
  };
}
