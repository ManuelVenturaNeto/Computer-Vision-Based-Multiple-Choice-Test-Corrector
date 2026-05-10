import { Jimp, rgbaToInt } from "jimp";

import { ALL_ANSWER_OPTIONS } from "../../server/modules/answer-sheet/domain/answerSheetConfig.js";

const BLACK = rgbaToInt(0, 0, 0, 255);
const WHITE = rgbaToInt(255, 255, 255, 255);

interface FixtureOptions {
  alternativeCount?: number;
  duplicatedRow?: number;
  leaveBlank?: boolean;
}

function buildTableConfig(alternativeCount: number) {
  return {
    x: 120,
    y: 140,
    width: 600,
    height: 880,
    cols: 1 + alternativeCount,
    answers: ALL_ANSWER_OPTIONS.slice(0, alternativeCount),
  };
}

interface WritableImage {
  setPixelColor(color: number, x: number, y: number): void;
}

export async function buildAnswerSheetImage(
  respostas: string[],
  options?: FixtureOptions
) {
  const alternativeCount = options?.alternativeCount ?? 5;
  const TABLE = buildTableConfig(alternativeCount);
  const ANSWERS = TABLE.answers;

  const image = new Jimp({ width: 900, height: 1200, color: WHITE });
  const totalRows = respostas.length + 1;
  const cellWidth = TABLE.width / TABLE.cols;
  const cellHeight = TABLE.height / totalRows;
  for (let row = 0; row <= totalRows; row += 1) drawRect(image, TABLE.x, Math.round(TABLE.y + row * cellHeight), TABLE.width, 4);
  for (let col = 0; col <= TABLE.cols; col += 1) drawRect(image, Math.round(TABLE.x + col * cellWidth), TABLE.y, 4, TABLE.height);
  for (let col = 1; col < TABLE.cols; col += 1) drawRect(image, Math.round(TABLE.x + col * cellWidth + cellWidth * 0.35), Math.round(TABLE.y + cellHeight * 0.3), Math.round(cellWidth * 0.3), Math.round(cellHeight * 0.4));
  for (let row = 1; row < totalRows; row += 1) drawRect(image, Math.round(TABLE.x + cellWidth * 0.22), Math.round(TABLE.y + row * cellHeight + cellHeight * 0.28), Math.round(cellWidth * 0.28), Math.round(cellHeight * 0.42));
  if (options?.leaveBlank) return image.getBase64("image/png");
  const circleRadius = Math.round(Math.min(cellWidth, cellHeight) * 0.28);
  respostas.forEach((resposta, row) => drawAnswer(image, resposta, row, cellWidth, cellHeight, ANSWERS, circleRadius, options?.duplicatedRow));
  return image.getBase64("image/png");
}

export async function buildMinExamFixture() {
  const respostas = ["A", "B", "C", "D"];
  const image = await buildAnswerSheetImage(respostas, { alternativeCount: 4 });
  return { image, respostas, alternativeCount: 4 };
}

export async function buildMaxExamFixture() {
  const respostas = Array.from({ length: 15 }, (_, i) => ALL_ANSWER_OPTIONS[i % 6] ?? "A");
  const image = await buildAnswerSheetImage(respostas, { alternativeCount: 6 });
  return { image, respostas, alternativeCount: 6 };
}

function drawAnswer(
  image: WritableImage,
  resposta: string,
  row: number,
  cellWidth: number,
  cellHeight: number,
  answers: readonly string[],
  radius: number,
  duplicatedRow?: number
) {
  const col = answers.indexOf(resposta);
  if (col < 0) return;
  const centerX = Math.round(120 + (col + 1) * cellWidth + cellWidth / 2);
  const centerY = Math.round(140 + (row + 1) * cellHeight + cellHeight / 2);
  drawCircle(image, centerX, centerY, radius);
  if (duplicatedRow === row) drawCircle(image, Math.round(120 + ((col === 1 ? 3 : 2) * cellWidth) + cellWidth / 2), centerY, radius);
}

function drawRect(image: WritableImage, x: number, y: number, width: number, height: number) {
  for (let pixelY = y; pixelY < y + height; pixelY += 1) for (let pixelX = x; pixelX < x + width; pixelX += 1) image.setPixelColor(BLACK, pixelX, pixelY);
}

function drawCircle(image: WritableImage, centerX: number, centerY: number, radius: number) {
  for (let y = centerY - radius; y <= centerY + radius; y += 1) for (let x = centerX - radius; x <= centerX + radius; x += 1) if ((x - centerX) ** 2 + (y - centerY) ** 2 <= radius ** 2) image.setPixelColor(BLACK, x, y);
}
