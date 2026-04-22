import assert from "node:assert/strict";
import test from "node:test";

import { extractAnswerSheetFromImageBase64 } from "../server/services/extractAnswerSheet.js";
import { buildAnswerSheetImage } from "./helpers/answerSheetFixture.js";

test("extractAnswerSheetFromImageBase64 rejects blank answer sheets", async () => {
  const imageBase64 = await buildAnswerSheetImage(
    ["A", "C", "B", "D", "E", "A", "B", "C", "D", "E"],
    { leaveBlank: true }
  );

  await assert.rejects(
    () => extractAnswerSheetFromImageBase64(imageBase64),
    /Gabarito em branco/
  );
});
