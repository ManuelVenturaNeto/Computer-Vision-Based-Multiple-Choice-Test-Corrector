import type { RequestHandler } from "express";

import { MissingApiKeyError, UpstreamRequestError } from "../domain/studentErrors.js";
import { extractStudentFromImageBase64 } from "../../../services/extractStudent.js";

export const extractStudentController: RequestHandler = async (request, response) => {
  const imageBase64 = String(request.body?.imageBase64 ?? "").trim();

  if (!imageBase64) {
    response.status(400).json({ error: "Envie imageBase64 com a foto capturada." });
    return;
  }

  try {
    response.json(await extractStudentFromImageBase64(imageBase64));
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
      error: error instanceof Error ? error.message : "Falha inesperada ao processar a imagem.",
    });
  }
};
