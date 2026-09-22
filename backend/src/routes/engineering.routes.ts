import { Router } from "express";
import {
  createDrawingRevisionController,
  createEngineeringDrawingController,
  createEngineeringProjectController,
  getEngineeringProjectController,
  listEngineeringProjectsController,
  updateDrawingRevisionController,
  updateEngineeringProjectController,
} from "../controllers/engineering.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const engineeringRouter = Router();

engineeringRouter.use(authenticate);

engineeringRouter.get("/", listEngineeringProjectsController);
engineeringRouter.get("/:id", getEngineeringProjectController);
engineeringRouter.post("/", createEngineeringProjectController);
engineeringRouter.patch("/:id", updateEngineeringProjectController);

engineeringRouter.post(
  "/drawings",
  createEngineeringDrawingController
);

engineeringRouter.post(
  "/drawings/:drawingId/revisions",
  createDrawingRevisionController
);

engineeringRouter.patch(
  "/revisions/:revisionId",
  updateDrawingRevisionController
);