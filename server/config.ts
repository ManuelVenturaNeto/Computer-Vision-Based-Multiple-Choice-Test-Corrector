import path from "node:path";

import { config as loadEnv } from "dotenv";

loadEnv({ path: path.resolve(process.cwd(), ".env") });

function readPort(rawValue: string | undefined, fallback: number) {
  const parsed = Number.parseInt(rawValue ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const serverConfig = {
  apiPort: readPort(process.env.PORT, readPort(process.env.API_PORT, 8787)),
  openAiApiKey: (process.env.OPENAI_API_KEY ?? "").trim(),
  openAiModel: (process.env.OPENAI_MODEL ?? "gpt-4.1-mini").trim(),
} as const;

export function processingReady() {
  return Boolean(serverConfig.openAiApiKey);
}

export function serviceMessage() {
  if (processingReady()) {
    return "Leitura automatica do aluno pronta.";
  }

  return "Leitura automatica indisponivel. Configure OPENAI_API_KEY no arquivo .env.";
}
