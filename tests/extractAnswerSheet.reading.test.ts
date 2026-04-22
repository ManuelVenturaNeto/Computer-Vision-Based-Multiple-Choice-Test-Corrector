import assert from "node:assert/strict";
import test from "node:test";

import { extractAnswerSheetFromImageBase64 } from "../server/services/extractAnswerSheet.js";
import { buildAnswerSheetImage } from "./helpers/answerSheetFixture.js";

const respostas = ["A", "C", "B", "D", "E", "A", "B", "C", "D", "E"];

test("extractAnswerSheetFromImageBase64 reads marked answers", async () => {
  const result = await extractAnswerSheetFromImageBase64(
    await buildAnswerSheetImage(respostas)
  );

  assert.equal(result.numQuestoes, 10);
  assert.deepEqual(result.respostas, respostas);
  assert.deepEqual(result.warnings, []);
});

test("extractAnswerSheetFromImageBase64 warns on duplicated marks", async () => {
  const result = await extractAnswerSheetFromImageBase64(
    await buildAnswerSheetImage(respostas, { duplicatedRow: 2 })
  );

  assert.equal(result.respostas[2], "");
  assert.match(result.warnings[0] ?? "", /Questao 3/);
});
