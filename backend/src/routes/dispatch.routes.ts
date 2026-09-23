import { Router } from "express";
import {
  createDispatchController,
  getDispatchController,
  listDispatchesController,
  updateDispatchController,
  getDispatchLogisticsController,
  updateDispatchLogisticsController,
  addDispatchTrackingEventController,
  uploadDispatchDocumentController,
} from "../controllers/dispatch.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const dispatchRouter = Router();

dispatchRouter.use(authenticate);

dispatchRouter.get("/", listDispatchesController);
dispatchRouter.get("/:id", getDispatchController);
dispatchRouter.post("/", createDispatchController);
dispatchRouter.patch("/:id", updateDispatchController);


dispatchRouter.get("/:id/logistics", getDispatchLogisticsController);
dispatchRouter.patch("/:id/logistics", updateDispatchLogisticsController);
dispatchRouter.post("/:id/tracking-events", addDispatchTrackingEventController);
dispatchRouter.post("/:id/documents", uploadDispatchDocumentController);
