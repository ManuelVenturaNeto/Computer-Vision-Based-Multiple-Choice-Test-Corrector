import { serverConfig } from "./config.js";

const EXTRACTION_PROMPT = `Analise esta imagem de um documento de aluno universitario.
Extraia:
1. O NOME do aluno: encontra-se proximo ao texto "Nome:" na imagem. O nome e composto somente por letras e espacos.
2. A MATRICULA do aluno: encontra-se proximo ao texto "Matricula:" ou "Matricula". Ela tem exatamente 6 digitos numericos.

Retorne APENAS um JSON valido no formato: {"nome": "...", "matricula": "..."}
Se nao encontrar algum campo, deixe como string vazia "".`;

export interface StudentExtraction {
  nome: string;
  matricula: string;
  provider: "openai";
  model: string;
}

export class MissingApiKeyError extends Error {}

export class UpstreamRequestError extends Error {}

export function sanitizeStudentName(value: unknown) {
  return String(value ?? "")
    .replace(/[^a-zA-ZÀ-ÿ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeStudentRegistration(value: unknown) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 6);
}

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
      matricula: sanitizeStudentRegistration(
        parsed.matricula ?? parsed.code
      ),
    };
  } catch {
    return { nome: "", matricula: "" };
  }
}

function coerceMessageContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (
          part &&
          typeof part === "object" &&
          "text" in part &&
          typeof part.text === "string"
        ) {
          return part.text;
        }

        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
}

export async function extractStudentFromImageBase64(
  imageBase64: string
): Promise<StudentExtraction> {
  if (!serverConfig.openAiApiKey) {
    throw new MissingApiKeyError(
      "OPENAI_API_KEY ausente. Configure o arquivo .env antes de usar a leitura automatica."
    );
  }

  const normalizedImage = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serverConfig.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: serverConfig.openAiModel,
      messages: [
        {
          role: "system",
          content:
            "Voce extrai dados estruturados de documentos estudantis e responde com JSON valido apenas.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: EXTRACTION_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: normalizedImage,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 150,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new UpstreamRequestError(
      `OpenAI respondeu com status ${response.status}. ${details}`.trim()
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: unknown;
      };
    }>;
  };

  const content = coerceMessageContent(data.choices?.[0]?.message?.content);
  const parsed = parseModelJson(content);

  return {
    ...parsed,
    provider: "openai",
    model: serverConfig.openAiModel,
  };
}
