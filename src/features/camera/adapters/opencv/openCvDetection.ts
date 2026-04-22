import { calcularLimiarAutomatico } from "./openCvThreshold";

export function detectAnswers(intensidades: number[], rows: number, cols: number) {
  const respostas: string[] = [];
  const detectedAlts: number[] = [];
  const limiar = calcularLimiarAutomatico(intensidades);
  let invalid = false;
  let todasMuitoClaras = true;
  let todasMuitoEscuras = true;

  for (let question = 0; question < rows; question += 1) {
    const rowIntensities = Array.from({ length: cols }, (_, alt) => intensidades[question * cols + alt]);
    const minIntensity = Math.min(...rowIntensities);
    const maxIntensity = Math.max(...rowIntensities);
    const bestAlt = rowIntensities.indexOf(minIntensity);
    const isMarked = maxIntensity - minIntensity > 20 && minIntensity < limiar;
    if (!isMarked) {
      if (minIntensity > 200) todasMuitoClaras = true;
      if (maxIntensity < 150) todasMuitoEscuras = true;
      invalid = true;
      detectedAlts.push(-1);
      continue;
    }
    detectedAlts.push(bestAlt);
    respostas.push(String.fromCharCode(65 + bestAlt));
  }

  if (!invalid) {
    return { respostas, detectedAlts };
  }
  if (todasMuitoClaras) throw new Error("Gabarito em branco - nenhuma resposta detectada.");
  if (todasMuitoEscuras) throw new Error("Gabarito invalido - todas as celulas estao marcadas.");
  throw new Error("Marcacoes inconsistentes - verifique se ha exatamente uma resposta por questao.");
}
