import { useCallback, useState } from "react";

import type { Aluno, AppView, GabaritoReferencia, ModalType } from "@/types";

export function useAppState() {
  const [view, setView] = useState<AppView>("home");
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [gabaritoRef, setGabaritoRef] = useState<GabaritoReferencia | null>(
    null
  );
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [activeModal, setActiveModal] = useState<ModalType>("none");
  const [activeAlunoId, setActiveAlunoId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleGoHome = () => {
    setView("home");
  };

  const handleGoToCorrigir = () => {
    setView("corrigir");
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const handleToggleCamera = () => {
    setCameraEnabled((value) => !value);
  };

  const handleCloseModal = () => {
    setActiveModal("none");
  };

  const handleCloseAlunoModal = () => {
    setActiveModal("none");
    setActiveAlunoId(null);
  };

  const handleLerGabarito = () => {
    if (!cameraEnabled) {
      setActiveModal("disabled");
      return;
    }

    setActiveModal("camera-gabarito-ref");
  };

  const handleGabaritoRefSaved = useCallback((gabarito: GabaritoReferencia) => {
    setGabaritoRef(gabarito);
    setActiveModal("none");
  }, []);

  const handleLimparGabarito = () => {
    setShowClearConfirm(true);
  };

  const confirmLimpar = () => {
    setGabaritoRef(null);
    setAlunos([]);
    setView("home");
    setActiveAlunoId(null);
    setShowClearConfirm(false);
  };

  const handleCancelLimpar = () => {
    setShowClearConfirm(false);
  };

  const handleAddAluno = () => {
    setActiveModal("camera-aluno-info");
  };

  const handleAlunoInfoSaved = useCallback((nome: string, matricula: string) => {
    const novoAluno: Aluno = {
      id: Date.now().toString(),
      nome,
      matricula,
    };

    setAlunos((previous) => [...previous, novoAluno]);
    setActiveModal("none");
  }, []);

  const handleLerGabaritoAluno = (alunoId: string) => {
    setActiveAlunoId(alunoId);
    setActiveModal("camera-gabarito-aluno");
  };

  const handleGabaritoAlunoSaved = useCallback(
    (respostas: string[]) => {
      if (!gabaritoRef || !activeAlunoId) return;

      const acertos = respostas.filter(
        (resposta, index) => resposta === gabaritoRef.respostas[index]
      ).length;
      const nota = parseFloat(
        ((acertos / gabaritoRef.numQuestoes) * 10).toFixed(1)
      );

      setAlunos((previous) =>
        previous.map((aluno) =>
          aluno.id === activeAlunoId
            ? {
                ...aluno,
                gabarito: respostas,
                acertos,
                nota,
                dataLeitura: new Date().toISOString(),
              }
            : aluno
        )
      );
      setActiveModal("none");
      setActiveAlunoId(null);
    },
    [activeAlunoId, gabaritoRef]
  );

  const activeAluno = alunos.find((aluno) => aluno.id === activeAlunoId) ?? null;

  return {
    view,
    setView,
    cameraEnabled,
    setCameraEnabled,
    gabaritoRef,
    alunos,
    activeModal,
    activeAlunoId,
    activeAluno,
    showSettings,
    showClearConfirm,
    handleGoHome,
    handleGoToCorrigir,
    handleOpenSettings,
    handleCloseSettings,
    handleToggleCamera,
    handleCloseModal,
    handleCloseAlunoModal,
    handleLerGabarito,
    handleGabaritoRefSaved,
    handleLimparGabarito,
    confirmLimpar,
    handleCancelLimpar,
    handleAddAluno,
    handleAlunoInfoSaved,
    handleLerGabaritoAluno,
    handleGabaritoAlunoSaved,
  };
}
