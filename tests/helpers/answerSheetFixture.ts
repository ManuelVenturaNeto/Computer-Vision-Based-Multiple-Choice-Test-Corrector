import { Jimp, rgbaToInt } from "jimp";

const BLACK = rgbaToInt(0, 0, 0, 255);
const WHITE = rgbaToInt(255, 255, 255, 255);
const ANSWERS = ["A", "B", "C", "D", "E"] as const;
const TABLE = { x: 120, y: 140, width: 600, height: 880, rows: 11, cols: 6 };

interface WritableImage {
  setPixelColor(color: number, x: number, y: number): void;
}

export async function buildAnswerSheetImage(
  respostas: string[],
  options?: { duplicatedRow?: number; leaveBlank?: boolean }
) {
  const image = new Jimp({ width: 900, height: 1200, color: WHITE });
  const cellWidth = TABLE.width / TABLE.cols;
  const cellHeight = TABLE.height / TABLE.rows;
  for (let row = 0; row <= TABLE.rows; row += 1) drawRect(image, TABLE.x, Math.round(TABLE.y + row * cellHeight), TABLE.width, 4);
  for (let col = 0; col <= TABLE.cols; col += 1) drawRect(image, Math.round(TABLE.x + col * cellWidth), TABLE.y, 4, TABLE.height);
  for (let col = 1; col < TABLE.cols; col += 1) drawRect(image, Math.round(TABLE.x + col * cellWidth + cellWidth * 0.35), Math.round(TABLE.y + cellHeight * 0.3), Math.round(cellWidth * 0.3), Math.round(cellHeight * 0.4));
  for (let row = 1; row < TABLE.rows; row += 1) drawRect(image, Math.round(TABLE.x + cellWidth * 0.22), Math.round(TABLE.y + row * cellHeight + cellHeight * 0.28), Math.round(cellWidth * 0.28), Math.round(cellHeight * 0.42));
  if (options?.leaveBlank) return image.getBase64("image/png");
  respostas.forEach((resposta, row) => drawAnswer(image, resposta, row, cellWidth, cellHeight, options?.duplicatedRow));
  return image.getBase64("image/png");
}

function drawAnswer(image: WritableImage, resposta: string, row: number, cellWidth: number, cellHeight: number, duplicatedRow?: number) {
  const col = ANSWERS.indexOf(resposta as (typeof ANSWERS)[number]);
  if (col < 0) return;
  const centerX = Math.round(TABLE.x + (col + 1) * cellWidth + cellWidth / 2);
  const centerY = Math.round(TABLE.y + (row + 1) * cellHeight + cellHeight / 2);
  drawCircle(image, centerX, centerY, 16);
  if (duplicatedRow === row) drawCircle(image, Math.round(TABLE.x + ((col === 1 ? 3 : 2) * cellWidth) + cellWidth / 2), centerY, 16);
}

function drawRect(image: WritableImage, x: number, y: number, width: number, height: number) {
  for (let pixelY = y; pixelY < y + height; pixelY += 1) for (let pixelX = x; pixelX < x + width; pixelX += 1) image.setPixelColor(BLACK, pixelX, pixelY);
}

function drawCircle(image: WritableImage, centerX: number, centerY: number, radius: number) {
  for (let y = centerY - radius; y <= centerY + radius; y += 1) for (let x = centerX - radius; x <= centerX + radius; x += 1) if ((x - centerX) ** 2 + (y - centerY) ** 2 <= radius ** 2) image.setPixelColor(BLACK, x, y);
}
