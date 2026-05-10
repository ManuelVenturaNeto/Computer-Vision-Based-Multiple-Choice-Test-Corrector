import assert from "node:assert/strict";
import test from "node:test";

import { extractAnswerSheetFromImageBase64 } from "../server/services/extractAnswerSheet.js";
import { buildAnswerSheetImage, buildMinExamFixture, buildMaxExamFixture } from "./helpers/answerSheetFixture.js";
import { extractAnswerSheetController } from "../server/modules/answer-sheet/controller/extractAnswerSheetController.js";

const respostas = ["A", "C", "B", "D", "E", "A", "B", "C", "D", "E"];

test("extractAnswerSheetFromImageBase64 reads marked answers", async () => {
  const result = await extractAnswerSheetFromImageBase64(
    await buildAnswerSheetImage(respostas)
  );

  assert.equal(result.numQuestoes, 10);
  assert.deepEqual(result.respostas, respostas);
  assert.deepEqual(result.warnings, []);
});

test("extractAnswerSheetFromImageBase64 reads a custom question count", async () => {
  const customRespostas = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "A",
    "B",
    "C",
    "D",
    "E",
    "A",
    "C",
    "E",
  ];
  const result = await extractAnswerSheetFromImageBase64(
    await buildAnswerSheetImage(customRespostas),
    { expectedQuestionCount: 13 }
  );

  assert.equal(result.numQuestoes, 13);
  assert.deepEqual(result.respostas, customRespostas);
  assert.deepEqual(result.warnings, []);
});

test("extractAnswerSheetFromImageBase64 warns on duplicated marks", async () => {
  const result = await extractAnswerSheetFromImageBase64(
    await buildAnswerSheetImage(respostas, { duplicatedRow: 2 })
  );

  assert.equal(result.respostas[2], "");
  assert.match(result.warnings[0] ?? "", /Questao 3/);
});

test("extractAnswerSheetFromImageBase64 reads 4 questions with A-D range", async () => {
  const { image, respostas: minRespostas, alternativeCount } = await buildMinExamFixture();
  const result = await extractAnswerSheetFromImageBase64(image, {
    expectedQuestionCount: 4,
    expectedAlternativeCount: alternativeCount,
  });

  assert.equal(result.numQuestoes, 4);
  assert.deepEqual(result.respostas, minRespostas);
  assert.deepEqual(result.warnings, []);
});

test("extractAnswerSheetFromImageBase64 reads 15 questions with A-F range", async () => {
  const { image, respostas: maxRespostas, alternativeCount } = await buildMaxExamFixture();
  const result = await extractAnswerSheetFromImageBase64(image, {
    expectedQuestionCount: 15,
    expectedAlternativeCount: alternativeCount,
  });

  assert.equal(result.numQuestoes, 15);
  assert.deepEqual(result.respostas, maxRespostas);
  assert.deepEqual(result.warnings, []);
});

test("extractAnswerSheetController returns 400 when expectedAlternativeCount is out of range", async () => {
  let statusCode = 0;
  let responseBody: unknown = null;

  const mockRequest = {
    body: {
      imageBase64: "data:image/png;base64,abc",
      expectedAlternativeCount: 3,
    },
  };

  const mockResponse = {
    status(code: number) { statusCode = code; return this; },
    json(body: unknown) { responseBody = body; return this; },
  };

  await extractAnswerSheetController(
    mockRequest as Parameters<typeof extractAnswerSheetController>[0],
    mockResponse as Parameters<typeof extractAnswerSheetController>[1],
    () => undefined
  );

  assert.equal(statusCode, 400);
  assert.ok(
    typeof responseBody === "object" &&
    responseBody !== null &&
    "error" in responseBody &&
    typeof (responseBody as Record<string, unknown>).error === "string"
  );
});
