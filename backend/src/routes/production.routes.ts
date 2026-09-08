import { Router } from "express";
import {
  createProductionOrderController,
  getProductionOrderController,
  listProductionOrdersController,
  updateProductionOperationController,
  updateProductionOrderController,
} from "../controllers/production.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const productionRouter = Router();

productionRouter.use(authenticate);

productionRouter.get("/", listProductionOrdersController);
productionRouter.get("/:id", getProductionOrderController);
productionRouter.post("/", createProductionOrderController);
productionRouter.patch("/:id", updateProductionOrderController);
productionRouter.patch(
  "/:id/operations/:operationId",
  updateProductionOperationController
);

