import cors from "cors";
import express from "express";

import {
  extractStudentFromImageBase64,
  MissingApiKeyError,
  UpstreamRequestError,
} from "./extractStudent";
import { processingReady, serverConfig, serviceMessage } from "./config";

const app = express();

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
      error: "Falha inesperada ao processar a imagem.",
    });
  }
});

app.listen(serverConfig.apiPort, "0.0.0.0", () => {
  console.log(
    `API pronta em http://127.0.0.1:${serverConfig.apiPort} e escutando em 0.0.0.0`
  );
});
