import assert from "node:assert/strict";
import test from "node:test";

import { extractAnswerSheetUseCase } from "../server/modules/answer-sheet/application/extractAnswerSheetUseCase.js";
import { JimpAnswerSheetImageAdapter } from "../server/modules/answer-sheet/adapters/jimp/JimpAnswerSheetImageAdapter.js";
import { buildAnswerSheetImage } from "./helpers/answerSheetFixture.js";

// The classic pipeline (no AI fallback) must reject blank answer sheets.
// With AI fallback disabled (aiReaderPort = null), the use case propagates
// the AnswerSheetUnreadableError thrown by the classification step.
test("extractAnswerSheetUseCase rejects blank answer sheets when AI fallback is disabled", async () => {
  const imageBase64 = await buildAnswerSheetImage(
    ["A", "C", "B", "D", "E", "A", "B", "C", "D", "E"],
    { leaveBlank: true }
  );

  await assert.rejects(
    () =>
      extractAnswerSheetUseCase(
        imageBase64,
        {},
        new JimpAnswerSheetImageAdapter(),
        null
      ),
    /Gabarito em branco/
  );
});
