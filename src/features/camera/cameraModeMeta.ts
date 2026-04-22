import {
  BookOpen,
  Scan,
  User,
  type LucideIcon,
} from "lucide-react";

import type { CameraMode } from "./constants";

interface CameraModeMeta {
  title: string;
  icon: LucideIcon;
}

export function getCameraModeMeta(
  mode: CameraMode,
  alunoNome?: string
): CameraModeMeta {
  switch (mode) {
    case "gabarito-ref":
      return { title: "Ler Gabarito Referência", icon: BookOpen };
    case "aluno-info":
      return { title: "Identificar Aluno", icon: User };
    case "gabarito-aluno":
      return { title: `Gabarito de ${alunoNome || "Aluno"}`, icon: Scan };
  }
}
