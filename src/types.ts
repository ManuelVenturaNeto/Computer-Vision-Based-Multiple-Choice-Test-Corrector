export interface GabaritoReferencia {
  numQuestoes: number;
  respostas: string[];
  disciplina: string;
  dataProva: string;
}

export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  gabarito?: string[];
  nota?: number;
  acertos?: number;
  dataLeitura?: string;
}

export type ModalType =
  | "none"
  | "disabled"
  | "camera-gabarito-ref"
  | "camera-aluno-info"
  | "camera-gabarito-aluno";

export type AppView = "home" | "corrigir";
