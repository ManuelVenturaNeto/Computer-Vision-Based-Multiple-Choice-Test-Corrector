import assert from "node:assert/strict";
import test from "node:test";

import { Jimp, rgbaToInt } from "jimp";

import { extractAnswerSheetFromImageBase64 } from "../server/services/extractAnswerSheet.js";

const BLACK = rgbaToInt(0, 0, 0, 255);
const WHITE = rgbaToInt(255, 255, 255, 255);
const ANSWERS = ["A", "B", "C", "D", "E"] as const;

async function buildAnswerSheetImage(
  respostas: string[],
  options?: { duplicatedRow?: number }
) {
  const width = 900;
  const height = 1200;
  const image = new Jimp({ width, height, color: WHITE });
  const table = { x: 120, y: 140, width: 500, height: 800, rows: 10, cols: 5 };
  const cellWidth = table.width / table.cols;
  const cellHeight = table.height / table.rows;

  const drawRect = (x: number, y: number, rectWidth: number, rectHeight: number) => {
    for (let yy = y; yy < y + rectHeight; yy += 1) {
      for (let xx = x; xx < x + rectWidth; xx += 1) {
        image.setPixelColor(BLACK, xx, yy);
      }
    }
  };

  const drawCircle = (centerX: number, centerY: number, radius: number) => {
    for (let y = centerY - radius; y <= centerY + radius; y += 1) {
      for (let x = centerX - radius; x <= centerX + radius; x += 1) {
        const dx = x - centerX;
        const dy = y - centerY;
        if (dx * dx + dy * dy <= radius * radius) {
          image.setPixelColor(BLACK, x, y);
        }
      }
    }
  };

  for (let row = 0; row <= table.rows; row += 1) {
    drawRect(table.x, Math.round(table.y + row * cellHeight), table.width, 4);
  }

  for (let col = 0; col <= table.cols; col += 1) {
    drawRect(Math.round(table.x + col * cellWidth), table.y, 4, table.height);
  }

  respostas.forEach((resposta, row) => {
    const col = ANSWERS.indexOf(resposta as (typeof ANSWERS)[number]);
    if (col < 0) {
      return;
    }

    const centerX = Math.round(table.x + col * cellWidth + cellWidth / 2);
    const centerY = Math.round(table.y + row * cellHeight + cellHeight / 2);
    drawCircle(centerX, centerY, 16);

    if (options?.duplicatedRow === row) {
      const extraCol = col === 1 ? 2 : 1;
      const extraCenterX = Math.round(table.x + extraCol * cellWidth + cellWidth / 2);
      drawCircle(extraCenterX, centerY, 16);
    }
  });

  return image.getBase64("image/png");
}

test("extractAnswerSheetFromImageBase64 reads marked answers", async () => {
  const respostas = ["A", "C", "B", "D", "E", "A", "B", "C", "D", "E"];
  const imageBase64 = await buildAnswerSheetImage(respostas);

  const result = await extractAnswerSheetFromImageBase64(imageBase64);

  assert.equal(result.numQuestoes, 10);
  assert.deepEqual(result.respostas, respostas);
  assert.deepEqual(result.warnings, []);
});

test("extractAnswerSheetFromImageBase64 warns on duplicated marks", async () => {
  const respostas = ["A", "C", "B", "D", "E", "A", "B", "C", "D", "E"];
  const imageBase64 = await buildAnswerSheetImage(respostas, {
    duplicatedRow: 2,
  });

  const result = await extractAnswerSheetFromImageBase64(imageBase64);

  assert.equal(result.respostas[2], "");
  assert.match(result.warnings[0] ?? "", /Questao 3/);
});
