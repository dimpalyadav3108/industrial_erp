import { Router } from "express";
import {
  createQuotationController,
  getQuotationController,
  listQuotationsController,
  updateQuotationStatusController,
} from "../controllers/quotation.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { updateQuotationCustomerApprovalController } from "../controllers/sales.controller.js";

export const quotationRouter = Router();

quotationRouter.use(authenticate);

quotationRouter.get("/", listQuotationsController);
quotationRouter.get("/:id", getQuotationController);
quotationRouter.post("/", createQuotationController);
quotationRouter.patch("/:id/status", updateQuotationStatusController);

quotationRouter.patch("/:id/customer-approval", updateQuotationCustomerApprovalController);
