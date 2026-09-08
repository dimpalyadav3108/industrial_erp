import { Router } from "express";
import {
  createQualityInspectionController,
  getQualityInspectionController,
  listQualityInspectionsController,
  updateQualityCheckController,
  updateQualityInspectionController,
} from "../controllers/quality.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const qualityRouter = Router();

qualityRouter.use(authenticate);

qualityRouter.get("/", listQualityInspectionsController);
qualityRouter.get("/:id", getQualityInspectionController);
qualityRouter.post("/", createQualityInspectionController);
qualityRouter.patch("/:id", updateQualityInspectionController);
qualityRouter.patch("/:id/checks/:checkId", updateQualityCheckController);

