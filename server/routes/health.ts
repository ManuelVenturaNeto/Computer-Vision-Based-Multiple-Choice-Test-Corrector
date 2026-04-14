import { Router } from "express";

import { processingReady, serverConfig, serviceMessage } from "../config.js";

export const healthRouter = Router();

healthRouter.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    processingReady: processingReady(),
    serviceMessage: serviceMessage(),
    provider: "openai",
    model: serverConfig.openAiModel,
  });
});
