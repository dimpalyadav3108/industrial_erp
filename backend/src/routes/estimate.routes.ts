import { Router } from "express";
import {
  createEstimateController,
  getEstimateController,
  listEstimatesController,
  updateEstimateStatusController,
} from "../controllers/estimate.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const estimateRouter = Router();

estimateRouter.use(authenticate);

estimateRouter.get("/", listEstimatesController);
estimateRouter.get("/:id", getEstimateController);
estimateRouter.post("/", createEstimateController);
estimateRouter.patch("/:id/status", updateEstimateStatusController);
