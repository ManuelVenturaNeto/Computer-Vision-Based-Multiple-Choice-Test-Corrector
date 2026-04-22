import { motion } from "motion/react";

import type { GabaritoReferencia } from "@/types";

import { HomeHeroCard } from "./home/HomeHeroCard";
import { HomeHowToUseCard } from "./home/HomeHowToUseCard";
import { HomeReadReferenceButton } from "./home/HomeReadReferenceButton";
import { HomeReadyActions } from "./home/HomeReadyActions";

interface HomeViewProps {
  cameraEnabled: boolean;
  gabaritoRef: GabaritoReferencia | null;
  alunosCount: number;
  onReadGabarito: () => void;
  onClearGabarito: () => void;
  onGoToCorrigir: () => void;
}

export function HomeView(props: HomeViewProps) {
  const { cameraEnabled, gabaritoRef, alunosCount, onReadGabarito, onClearGabarito, onGoToCorrigir } = props;

  return (
    <motion.div key="home" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4 space-y-4">
      <HomeHeroCard gabaritoRef={gabaritoRef} />
      <HomeReadReferenceButton cameraEnabled={cameraEnabled} onReadGabarito={onReadGabarito} />
      {gabaritoRef ? <HomeReadyActions alunosCount={alunosCount} gabaritoRef={gabaritoRef} onClearGabarito={onClearGabarito} onGoToCorrigir={onGoToCorrigir} /> : <HomeHowToUseCard />}
    </motion.div>
  );
}
