import { serverConfig } from "../../../../config.js";
import { MissingApiKeyError, UpstreamRequestError } from "../../domain/studentErrors.js";
import {
  coerceMessageContent,
  parseModelJson,
} from "../../domain/parseStudentModelJson.js";
import type { StudentDocumentVisionPort } from "../../ports/studentDocumentVisionPort.js";
import { OPENAI_STUDENT_EXTRACTION_PROMPT } from "./openAiStudentPrompt.js";

export class OpenAiStudentDocumentVisionAdapter implements StudentDocumentVisionPort {
  async extractStudent(imageBase64: string) {
    if (!serverConfig.openAiApiKey) {
      throw new MissingApiKeyError(
        "OPENAI_API_KEY ausente. Configure o arquivo .env antes de usar a leitura automatica."
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serverConfig.openAiApiKey}`,
      },
      body: JSON.stringify({
        model: serverConfig.openAiModel,
        messages: buildMessages(normalizeImage(imageBase64)),
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new UpstreamRequestError(
        `OpenAI respondeu com status ${response.status}. ${await response.text()}`.trim()
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };

    return parseModelJson(coerceMessageContent(data.choices?.[0]?.message?.content));
  }
}

function normalizeImage(imageBase64: string) {
  return imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;
}

function buildMessages(normalizedImage: string) {
  return [
    {
      role: "system",
      content: "Voce extrai dados estruturados de documentos estudantis e responde com JSON valido apenas.",
    },
    {
      role: "user",
      content: [
        { type: "text", text: OPENAI_STUDENT_EXTRACTION_PROMPT },
        { type: "image_url", image_url: { url: normalizedImage, detail: "high" } },
      ],
    },
  ];
}
