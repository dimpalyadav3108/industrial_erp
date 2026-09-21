import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createContractController,
  createServiceRequestController,
  listContractsController,
  listServiceRequestsController,
  updateContractStatusController,
  updateServiceRequestController,
} from "../controllers/service.controller.js";

export const serviceRouter = Router();
serviceRouter.use(authenticate);

serviceRouter.get("/contracts", listContractsController);
serviceRouter.post("/contracts", createContractController);
serviceRouter.patch("/contracts/:id/status", updateContractStatusController);
serviceRouter.get("/requests", listServiceRequestsController);
serviceRouter.post("/requests", createServiceRequestController);
serviceRouter.patch("/requests/:id", updateServiceRequestController);
