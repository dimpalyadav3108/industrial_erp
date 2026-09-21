import { Router } from "express";
import {
  createDispatchController,
  getDispatchController,
  listDispatchesController,
  updateDispatchController,
} from "../controllers/dispatch.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const dispatchRouter = Router();

dispatchRouter.use(authenticate);

dispatchRouter.get("/", listDispatchesController);
dispatchRouter.get("/:id", getDispatchController);
dispatchRouter.post("/", createDispatchController);
dispatchRouter.patch("/:id", updateDispatchController);

