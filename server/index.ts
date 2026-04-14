import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import express from "express";

import { serverConfig } from "./config.js";
import { extractAnswerSheetRouter } from "./routes/extractAnswerSheet.js";
import { extractStudentRouter } from "./routes/extractStudent.js";
import { healthRouter } from "./routes/health.js";

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

app.use("/api", healthRouter);
app.use("/api", extractStudentRouter);
app.use("/api", extractAnswerSheetRouter);

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
