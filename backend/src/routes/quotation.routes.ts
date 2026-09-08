import { Router } from "express";
import {
  createQuotationController,
  getQuotationController,
  listQuotationsController,
  updateQuotationStatusController,
} from "../controllers/quotation.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const quotationRouter = Router();

quotationRouter.use(authenticate);

quotationRouter.get("/", listQuotationsController);
quotationRouter.get("/:id", getQuotationController);
quotationRouter.post("/", createQuotationController);
quotationRouter.patch("/:id/status", updateQuotationStatusController);
