import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import express from "express";

import {
  AnswerSheetReadError,
  extractAnswerSheetFromImageBase64,
} from "./extractAnswerSheet.js";
import {
  extractStudentFromImageBase64,
  MissingApiKeyError,
  UpstreamRequestError,
} from "./extractStudent.js";
import { processingReady, serverConfig, serviceMessage } from "./config.js";

const app = express();
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const frontendDistCandidates = [
  path.resolve(currentDirPath, "../dist"),
  path.resolve(currentDirPath, "../../dist"),
];
const frontendDistPath =
  frontendDistCandidates.find((candidate) =>
    fs.existsSync(path.join(candidate, "index.html"))
  ) ?? frontendDistCandidates[0];
const frontendIndexPath = path.join(frontendDistPath, "index.html");
const hasFrontendBuild = fs.existsSync(frontendIndexPath);

app.use(cors());
app.use(express.json({ limit: "12mb" }));

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    processingReady: processingReady(),
    serviceMessage: serviceMessage(),
    provider: "openai",
    model: serverConfig.openAiModel,
  });
});

app.post("/api/extract-student", async (request, response) => {
  const imageBase64 = String(request.body?.imageBase64 ?? "").trim();

  if (!imageBase64) {
    response.status(400).json({
      error: "Envie imageBase64 com a foto capturada.",
    });
    return;
  }

  try {
    const result = await extractStudentFromImageBase64(imageBase64);
    response.json(result);
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      response.status(503).json({ error: error.message });
      return;
    }

    if (error instanceof UpstreamRequestError) {
      response.status(502).json({ error: error.message });
      return;
    }

    response.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Falha inesperada ao processar a imagem.",
    });
  }
});

app.post("/api/extract-answer-sheet", async (request, response) => {
  const imageBase64 = String(request.body?.imageBase64 ?? "").trim();
  const expectedQuestionCount = request.body?.expectedQuestionCount;

  if (!imageBase64) {
    response.status(400).json({
      error: "Envie imageBase64 com a foto do gabarito.",
    });
    return;
  }

  try {
    const result = await extractAnswerSheetFromImageBase64(imageBase64, {
      expectedQuestionCount:
        typeof expectedQuestionCount === "number" ? expectedQuestionCount : undefined,
    });
    response.json(result);
  } catch (error) {
    if (error instanceof AnswerSheetReadError) {
      response.status(422).json({ error: error.message });
      return;
    }

    response.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Falha inesperada ao ler o gabarito.",
    });
  }
});

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));

  app.get(/^\/(?!api(?:\/|$)).*/, (_request, response) => {
    response.sendFile(frontendIndexPath);
  });
}

app.listen(serverConfig.apiPort, "0.0.0.0", () => {
  console.log(
    `API pronta em http://127.0.0.1:${serverConfig.apiPort} e escutando em 0.0.0.0`
  );
});
