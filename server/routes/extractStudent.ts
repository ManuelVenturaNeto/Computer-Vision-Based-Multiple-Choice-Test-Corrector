import { Router } from "express";

import { extractStudentController } from "../modules/student/controller/extractStudentController.js";

export const extractStudentRouter = Router();

extractStudentRouter.post("/extract-student", extractStudentController);
