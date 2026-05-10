import assert from "node:assert/strict";
import test from "node:test";

import { extractAnswerSheetUseCase } from "../server/modules/answer-sheet/application/extractAnswerSheetUseCase.js";
import {
  AnswerSheetAiFallbackError,
  AnswerSheetInvalidInputError,
  AnswerSheetUnreadableError,
} from "../server/modules/answer-sheet/domain/answerSheetError.js";
import type { AnswerSheetAiReaderPort } from "../server/modules/answer-sheet/ports/answerSheetAiReaderPort.js";
import type { AnswerSheetImagePort } from "../server/modules/answer-sheet/ports/answerSheetImagePort.js";
import type { AiAnswerSheetResult } from "../server/modules/answer-sheet/domain/answerSheetTypes.js";
import { buildAnswerSheetImage } from "./helpers/answerSheetFixture.js";

function buildSuccessImagePort(): AnswerSheetImagePort & { callCount: number } {
  const port = {
    callCount: 0,
    async readInput(imageBase64: string, contrast: number) {
      port.callCount += 1;
      // Delegate to a real image built by the fixture so the pipeline runs properly.
      const { JimpAnswerSheetImageAdapter } = await import(
        "../server/modules/answer-sheet/adapters/jimp/JimpAnswerSheetImageAdapter.js"
      );
      const realAdapter = new JimpAnswerSheetImageAdapter();
      return realAdapter.readInput(imageBase64, contrast);
    },
    async buildMaskImage(normalizedColorImage: import("../server/modules/answer-sheet/domain/answerSheetTypes.js").BitmapLikeImage, respostas: string[], alternativeCount: number) {
      return "";
    },
  };
  return port;
}

function buildThrowingImagePort(errorToThrow: Error): AnswerSheetImagePort {
  return {
    async readInput() {
      throw errorToThrow;
    },
    async buildMaskImage() {
      return "";
    },
  };
}

function buildCountingAiPort(result: AiAnswerSheetResult): AnswerSheetAiReaderPort & { callCount: number } {
  const port = {
    callCount: 0,
    async readAnswers() {
      port.callCount += 1;
      return result;
    },
  };
  return port;
}

function buildFailingAiPort(errorToThrow: Error): AnswerSheetAiReaderPort {
  return {
    async readAnswers() {
      throw errorToThrow;
    },
  };
}

test("classic pipeline succeeds: AI port is never called", async () => {
  const respostas = ["A", "B", "C", "D"];
  const imageBase64 = await buildAnswerSheetImage(respostas, { alternativeCount: 4 });
  const successPort = buildSuccessImagePort();
  const aiPort = buildCountingAiPort({ respostas: ["Z", "Z", "Z", "Z"], warnings: [] });

  const result = await extractAnswerSheetUseCase(
    imageBase64,
    { expectedQuestionCount: 4, expectedAlternativeCount: 4 },
    successPort,
    aiPort
  );

  assert.equal(aiPort.callCount, 0);
  assert.equal(result.provider, "jimp");
  assert.deepEqual(result.respostas, respostas);
});

test("classic throws AnswerSheetUnreadableError: AI is called, result.provider is openai", async () => {
  const aiRespostas = ["A", "B", "C"];
  const aiPort = buildCountingAiPort({ respostas: aiRespostas, warnings: ["aviso da IA"] });
  const throwingPort = buildThrowingImagePort(
    new AnswerSheetUnreadableError("Gabarito em branco - nenhuma resposta detectada.")
  );

  const result = await extractAnswerSheetUseCase(
    "data:image/png;base64,fake",
    { expectedQuestionCount: 3, expectedAlternativeCount: 4 },
    throwingPort,
    aiPort
  );

  assert.equal(aiPort.callCount, 1);
  assert.equal(result.provider, "openai");
  assert.deepEqual(result.respostas, aiRespostas);
  assert.deepEqual(result.warnings, ["aviso da IA"]);
});

test("classic throws Unreadable and AI also throws AnswerSheetAiFallbackError: error propagates", async () => {
  const aiFallbackError = new AnswerSheetAiFallbackError("OpenAI indisponivel");
  const throwingImagePort = buildThrowingImagePort(
    new AnswerSheetUnreadableError("Gabarito em branco - nenhuma resposta detectada.")
  );
  const failingAiPort = buildFailingAiPort(aiFallbackError);

  await assert.rejects(
    () =>
      extractAnswerSheetUseCase(
        "data:image/png;base64,fake",
        { expectedQuestionCount: 3, expectedAlternativeCount: 4 },
        throwingImagePort,
        failingAiPort
      ),
    (error) => error === aiFallbackError
  );
});

test("classic throws AnswerSheetInvalidInputError: AI is NOT called, error propagates", async () => {
  const invalidInputError = new AnswerSheetInvalidInputError("Imagem invalida para leitura do gabarito.");
  const throwingPort = buildThrowingImagePort(invalidInputError);
  const aiPort = buildCountingAiPort({ respostas: ["A"], warnings: [] });

  await assert.rejects(
    () =>
      extractAnswerSheetUseCase(
        "",
        { expectedQuestionCount: 1, expectedAlternativeCount: 4 },
        throwingPort,
        aiPort
      ),
    (error) => error === invalidInputError
  );

  assert.equal(aiPort.callCount, 0);
});

test("aiReaderPort is null: fallback disabled, Unreadable error propagates", async () => {
  const unreadableError = new AnswerSheetUnreadableError("Gabarito em branco - nenhuma resposta detectada.");
  const throwingPort = buildThrowingImagePort(unreadableError);

  await assert.rejects(
    () =>
      extractAnswerSheetUseCase(
        "data:image/png;base64,fake",
        { expectedQuestionCount: 3, expectedAlternativeCount: 4 },
        throwingPort,
        null
      ),
    (error) => error === unreadableError
  );
});
