import {
  sanitizeStudentName,
  sanitizeStudentRegistration,
} from "./studentSanitizers.js";

export function parseModelJson(content: string) {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { nome: "", matricula: "" };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      nome?: unknown;
      matricula?: unknown;
      name?: unknown;
      code?: unknown;
    };

    return {
      nome: sanitizeStudentName(parsed.nome ?? parsed.name),
      matricula: sanitizeStudentRegistration(parsed.matricula ?? parsed.code),
    };
  } catch {
    return { nome: "", matricula: "" };
  }
}

export function coerceMessageContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) =>
      part && typeof part === "object" && "text" in part && typeof part.text === "string"
        ? part.text
        : ""
    )
    .join("\n")
    .trim();
}
