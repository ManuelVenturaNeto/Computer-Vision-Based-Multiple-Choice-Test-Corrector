import assert from "node:assert/strict";
import test from "node:test";

import { parseAiAnswerSheetResponse } from "../server/modules/answer-sheet/domain/parseAiAnswerSheetResponse.js";

test("parseAiAnswerSheetResponse parses valid payload with 3 questions and 4 alternatives", () => {
  const content = JSON.stringify({ respostas: ["A", "C", "B"] });
  const result = parseAiAnswerSheetResponse(content, 3, 4);

  assert.deepEqual(result.respostas, ["A", "C", "B"]);
  assert.deepEqual(result.warnings, []);
});

test("parseAiAnswerSheetResponse fills with empty strings when array is shorter than questionCount", () => {
  const content = JSON.stringify({ respostas: ["A"] });
  const result = parseAiAnswerSheetResponse(content, 3, 4);

  assert.deepEqual(result.respostas, ["A", "", ""]);
  assert.equal(result.warnings.length, 2);
  assert.match(result.warnings[0] ?? "", /Questao 2/);
  assert.match(result.warnings[1] ?? "", /Questao 3/);
});

test("parseAiAnswerSheetResponse turns out-of-range letter into empty string with warning", () => {
  const content = JSON.stringify({ respostas: ["A", "E", "B"] });
  // only A-D valid for alternativeCount=4
  const result = parseAiAnswerSheetResponse(content, 3, 4);

  assert.equal(result.respostas[1], "");
  assert.equal(result.warnings.length, 1);
  assert.match(result.warnings[0] ?? "", /Questao 2/);
  assert.match(result.warnings[0] ?? "", /E/);
});

test("parseAiAnswerSheetResponse truncates array longer than questionCount", () => {
  const content = JSON.stringify({ respostas: ["A", "B", "C", "D", "E"] });
  const result = parseAiAnswerSheetResponse(content, 3, 5);

  assert.deepEqual(result.respostas, ["A", "B", "C"]);
  assert.equal(result.respostas.length, 3);
});

test("parseAiAnswerSheetResponse returns all empty strings and warnings for invalid JSON", () => {
  const result = parseAiAnswerSheetResponse("not json at all", 3, 4);

  assert.deepEqual(result.respostas, ["", "", ""]);
  assert.equal(result.warnings.length, 3);
  result.warnings.forEach((warning) => assert.match(warning, /JSON invalido/));
});

test("parseAiAnswerSheetResponse normalizes lowercase letters to uppercase", () => {
  const content = JSON.stringify({ respostas: ["a", "c", "b"] });
  const result = parseAiAnswerSheetResponse(content, 3, 4);

  assert.deepEqual(result.respostas, ["A", "C", "B"]);
  assert.deepEqual(result.warnings, []);
});

test("parseAiAnswerSheetResponse handles empty string entries without warning", () => {
  const content = JSON.stringify({ respostas: ["A", "", "C"] });
  const result = parseAiAnswerSheetResponse(content, 3, 4);

  assert.deepEqual(result.respostas, ["A", "", "C"]);
  assert.deepEqual(result.warnings, []);
});
