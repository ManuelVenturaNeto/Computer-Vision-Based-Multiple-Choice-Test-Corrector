import assert from "node:assert/strict";
import test from "node:test";

import {
  parseModelJson,
  sanitizeStudentName,
  sanitizeStudentRegistration,
} from "../server/extractStudent";

test("sanitizeStudentName removes invalid characters", () => {
  assert.equal(
    sanitizeStudentName("Joao 123 da-Silva!!"),
    "Joao da Silva"
  );
});

test("sanitizeStudentRegistration keeps six digits", () => {
  assert.equal(sanitizeStudentRegistration("AB-123456-99"), "123456");
});

test("parseModelJson reads the expected fields", () => {
  const result = parseModelJson(
    'Resposta final: {"nome":"Maria Clara","matricula":"654321"}'
  );

  assert.deepEqual(result, {
    nome: "Maria Clara",
    matricula: "654321",
  });
});
