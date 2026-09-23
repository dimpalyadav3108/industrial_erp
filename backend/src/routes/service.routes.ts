import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createContractController,
  createServiceRequestController,
  listContractsController,
  listServiceRequestsController,
  updateContractStatusController,
  updateServiceRequestController,
  getServiceEngineersController, listService360Controller, assignServiceEngineerController,
  createServiceVisitController, updateServiceVisitController, addServiceFeedbackController,
  addServiceSpareMovementController, createPmPlanController, addWarrantyCoverageController,
} from "../controllers/service.controller.js";

export const serviceRouter = Router();
serviceRouter.use(authenticate);

serviceRouter.get("/contracts", listContractsController);
serviceRouter.post("/contracts", createContractController);
serviceRouter.patch("/contracts/:id/status", updateContractStatusController);
serviceRouter.get("/requests", listServiceRequestsController);
serviceRouter.post("/requests", createServiceRequestController);
serviceRouter.patch("/requests/:id", updateServiceRequestController);

serviceRouter.get("/engineers", getServiceEngineersController);
serviceRouter.get("/requests/:id/360", listService360Controller);
serviceRouter.post("/requests/:id/assign", assignServiceEngineerController);
serviceRouter.post("/requests/:id/visits", createServiceVisitController);
serviceRouter.patch("/visits/:id", updateServiceVisitController);
serviceRouter.post("/requests/:id/feedback", addServiceFeedbackController);
serviceRouter.post("/requests/:id/spares", addServiceSpareMovementController);
serviceRouter.post("/pm-plans", createPmPlanController);
serviceRouter.post("/warranty-coverage", addWarrantyCoverageController);
