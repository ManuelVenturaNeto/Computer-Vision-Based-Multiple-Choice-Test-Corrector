import { Router } from "express";

import { extractAnswerSheetController } from "../modules/answer-sheet/controller/extractAnswerSheetController.js";

export const extractAnswerSheetRouter = Router();

extractAnswerSheetRouter.post("/extract-answer-sheet", extractAnswerSheetController);
