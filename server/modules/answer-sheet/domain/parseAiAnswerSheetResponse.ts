import { ALL_ANSWER_OPTIONS } from "./answerSheetConfig.js";
import type { AiAnswerSheetResult } from "./answerSheetTypes.js";

export function parseAiAnswerSheetResponse(
  content: string,
  questionCount: number,
  alternativeCount: number
): AiAnswerSheetResult {
  const validOptions = ALL_ANSWER_OPTIONS.slice(0, alternativeCount);
  const respostas: string[] = [];
  const warnings: string[] = [];

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return buildFallbackResult(questionCount, "IA retornou JSON invalido");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return buildFallbackResult(questionCount, "IA retornou JSON invalido");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("respostas" in parsed) ||
    !Array.isArray((parsed as Record<string, unknown>).respostas)
  ) {
    return buildFallbackResult(questionCount, "IA retornou JSON invalido");
  }

  const rawArray = (parsed as { respostas: unknown[] }).respostas.slice(0, questionCount);

  for (let index = 0; index < questionCount; index += 1) {
    const raw = rawArray[index];
    if (raw === undefined) {
      respostas.push("");
      warnings.push(`Questao ${index + 1} ausente na resposta da IA.`);
      continue;
    }

    const normalized = typeof raw === "string" ? raw.trim().toUpperCase() : "";

    if (normalized === "") {
      respostas.push("");
      continue;
    }

    if (!(validOptions as readonly string[]).includes(normalized)) {
      respostas.push("");
      warnings.push(
        `Questao ${index + 1}: opcao "${normalized}" invalida para ${alternativeCount} alternativas.`
      );
      continue;
    }

    respostas.push(normalized);
  }

  return { respostas, warnings };
}

function buildFallbackResult(questionCount: number, reason: string): AiAnswerSheetResult {
  const respostas = Array.from({ length: questionCount }, () => "");
  const warnings = Array.from(
    { length: questionCount },
    (_, index) => `Questao ${index + 1}: ${reason}.`
  );
  return { respostas, warnings };
}
