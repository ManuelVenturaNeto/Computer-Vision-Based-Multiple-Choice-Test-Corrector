import {
  ANSWER_OPTIONS,
  ANSWER_SHEET_READER_CONFIG,
} from "./answerSheetConfig.js";
import { AnswerSheetReadError } from "./answerSheetError.js";
import type { Cell } from "./answerSheetTypes.js";

export function extractAnswers(cells: Cell[], rowCount: number, threshold: number) {
  const respostas: string[] = [];
  const warnings: string[] = [];
  let blankLikeRows = 0;
  let fullyDarkRows = 0;

  for (let row = 0; row < rowCount; row += 1) {
    const rowCells = cells.filter((cell) => cell.row === row).sort((left, right) => left.col - right.col);
    const intensities = rowCells.map((cell) => cell.intensity);
    const minIntensity = Math.min(...intensities);
    const maxIntensity = Math.max(...intensities);
    const markedCells = rowCells.filter((cell) => cell.intensity <= minIntensity + ANSWER_SHEET_READER_CONFIG.duplicateTolerance);
    const isMarked = maxIntensity - minIntensity > ANSWER_SHEET_READER_CONFIG.minMarkedDifference && Math.floor(minIntensity) <= threshold;

    if (minIntensity > ANSWER_SHEET_READER_CONFIG.blankRowIntensity) blankLikeRows += 1;
    if (maxIntensity < ANSWER_SHEET_READER_CONFIG.fullyDarkRowIntensity) fullyDarkRows += 1;

    if (!isMarked || markedCells.length !== 1) {
      respostas.push("");
      warnings.push(`Questao ${row + 1} sem uma marcacao valida destacada.`);
      continue;
    }

    respostas.push(ANSWER_OPTIONS[markedCells[0].col] ?? "");
  }

  assertValidAnswers(respostas, blankLikeRows, fullyDarkRows, rowCount);
  return { respostas, warnings };
}

function assertValidAnswers(
  respostas: string[],
  blankLikeRows: number,
  fullyDarkRows: number,
  rowCount: number
) {
  if (respostas.some(Boolean)) return;
  if (blankLikeRows === rowCount) {
    throw new AnswerSheetReadError("Gabarito em branco - nenhuma resposta detectada.");
  }
  if (fullyDarkRows === rowCount) {
    throw new AnswerSheetReadError("Gabarito invalido - todas as celulas parecem marcadas.");
  }
  throw new AnswerSheetReadError(
    "Marcacoes inconsistentes - verifique se ha exatamente uma resposta por questao."
  );
}
