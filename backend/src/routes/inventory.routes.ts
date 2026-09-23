import { Router } from "express";
import {
  createInventoryItemController,
  createStockMovementController,
  getInventoryItemController,
  listInventoryItemsController,
  listStoreLocationsController,
  getStoreTraceabilityController,
  createStoreTraceabilityController,
  createStockReservationController,
  createMaterialReturnController,
  updateInventoryItemController,
} from "../controllers/inventory.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const inventoryRouter = Router();

inventoryRouter.use(authenticate);

inventoryRouter.get("/", listInventoryItemsController);
inventoryRouter.get("/stores/locations", listStoreLocationsController);
inventoryRouter.get("/stores/traceability", getStoreTraceabilityController);
inventoryRouter.post("/stores/traceability", createStoreTraceabilityController);
inventoryRouter.post("/stores/reservations", createStockReservationController);
inventoryRouter.post("/stores/returns", createMaterialReturnController);
inventoryRouter.get("/:id", getInventoryItemController);
inventoryRouter.post("/", createInventoryItemController);
inventoryRouter.patch("/:id", updateInventoryItemController);
inventoryRouter.post("/:id/movements", createStockMovementController);
