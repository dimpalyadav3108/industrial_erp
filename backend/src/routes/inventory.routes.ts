import { Router } from "express";
import {
  createInventoryItemController,
  createStockMovementController,
  getInventoryItemController,
  listInventoryItemsController,
  updateInventoryItemController,
} from "../controllers/inventory.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const inventoryRouter = Router();

inventoryRouter.use(authenticate);

inventoryRouter.get("/", listInventoryItemsController);
inventoryRouter.get("/:id", getInventoryItemController);
inventoryRouter.post("/", createInventoryItemController);
inventoryRouter.patch("/:id", updateInventoryItemController);
inventoryRouter.post("/:id/movements", createStockMovementController);
