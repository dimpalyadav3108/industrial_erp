import { Router } from "express";

import {
  createDrawingRevisionController,
  createEngineeringBomController,
  createEngineeringBomItemController,
  createEngineeringDrawingController,
  createEngineeringProjectController,
  deleteEngineeringBomItemController,
  getEngineeringBomController,
  getEngineeringProjectController,
  listEngineeringBomsController,
  listEngineeringProjectsController,
  updateDrawingRevisionController,
  updateEngineeringBomController,
  updateEngineeringBomItemController,
  updateEngineeringProjectController,
} from "../controllers/engineering.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

export const engineeringRouter = Router();

engineeringRouter.use(authenticate);

// ============================================================
// ENGINEERING PROJECTS
// ============================================================

engineeringRouter.get("/", listEngineeringProjectsController);

engineeringRouter.get("/:id", getEngineeringProjectController);

engineeringRouter.post("/", createEngineeringProjectController);

engineeringRouter.patch("/:id", updateEngineeringProjectController);

// ============================================================
// ENGINEERING DRAWINGS
// ============================================================

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

// ============================================================
// ENGINEERING BOM
// ============================================================

engineeringRouter.get(
  "/boms/list",
  listEngineeringBomsController
);

engineeringRouter.get(
  "/boms/:bomId",
  getEngineeringBomController
);

engineeringRouter.post(
  "/boms",
  createEngineeringBomController
);

engineeringRouter.patch(
  "/boms/:bomId",
  updateEngineeringBomController
);

// ============================================================
// BOM ITEMS
// ============================================================

engineeringRouter.post(
  "/boms/:bomId/items",
  createEngineeringBomItemController
);

engineeringRouter.patch(
  "/bom-items/:itemId",
  updateEngineeringBomItemController
);

engineeringRouter.delete(
  "/bom-items/:itemId",
  deleteEngineeringBomItemController
);