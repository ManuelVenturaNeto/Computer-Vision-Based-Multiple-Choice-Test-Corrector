import { serverConfig } from "../../../../config.js";
import { ALL_ANSWER_OPTIONS } from "../../domain/answerSheetConfig.js";
import { AnswerSheetAiFallbackError } from "../../domain/answerSheetError.js";
import { parseAiAnswerSheetResponse } from "../../domain/parseAiAnswerSheetResponse.js";
import type { AnswerSheetAiReaderPort } from "../../ports/answerSheetAiReaderPort.js";
import { buildAnswerSheetPrompt } from "./openAiAnswerSheetPrompt.js";

const AI_MAX_TOKENS = 300;

export class OpenAiAnswerSheetVisionAdapter implements AnswerSheetAiReaderPort {
  async readAnswers(
    imageBase64: string,
    questionCount: number,
    alternativeCount: number
  ) {
    if (!serverConfig.openAiApiKey) {
      throw new AnswerSheetAiFallbackError(
        "OPENAI_API_KEY ausente. Configure o arquivo .env para usar o fallback de IA."
      );
    }

    const validOptions = ALL_ANSWER_OPTIONS.slice(0, alternativeCount);
    const prompt = buildAnswerSheetPrompt(questionCount, alternativeCount, validOptions);
    const normalizedImage = normalizeImage(imageBase64);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serverConfig.openAiApiKey}`,
      },
      body: JSON.stringify({
        model: serverConfig.openAiModel,
        messages: buildMessages(prompt, normalizedImage),
        max_tokens: AI_MAX_TOKENS,
      }),
    });

    if (!response.ok) {
      throw new AnswerSheetAiFallbackError(
        `OpenAI respondeu com status ${response.status}. ${await response.text()}`.trim()
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };

    const content = coerceContent(data.choices?.[0]?.message?.content);
    return parseAiAnswerSheetResponse(content, questionCount, alternativeCount);
  }
}

function normalizeImage(imageBase64: string) {
  return imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;
}

function coerceContent(content: unknown): string {
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

function buildMessages(prompt: string, normalizedImage: string) {
  return [
    {
      role: "system",
      content:
        "Voce le gabaritos de provas e responde com JSON valido apenas.",
    },
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: normalizedImage, detail: "high" } },
      ],
    },
  ];
}
