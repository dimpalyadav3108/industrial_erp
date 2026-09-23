import { Router } from "express";

import {
  createDrawingRevisionController,
  createEngineeringBomController,
  createEngineeringBomItemController,
  createEngineeringDrawingController,
  createEngineeringProjectController,
  deleteEngineeringBomItemController,
  getEngineeringBomController,
  getEngineeringBomCostRollupController,
  getEngineeringProjectController,
  listEngineeringBomsController,
  listEngineeringProjectsController,
  updateDrawingRevisionController,
  updateEngineeringBomController,
  updateEngineeringBomItemController,
  advanceEngineeringWorkflowController,
  linkEngineeringSalesOrderController,
  createEngineeringDocumentController,
  listEngineeringDocumentsController,
  updateEngineeringDocumentController,
  createEcrController,
  listEcrController,
  updateEcrController,
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

engineeringRouter.get(
  "/boms/:bomId/cost-rollup",
  getEngineeringBomCostRollupController
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
// MODULE 4 - WORKFLOW / DMS / ECR
// ============================================================
engineeringRouter.post("/:id/workflow", advanceEngineeringWorkflowController);
engineeringRouter.post("/:id/sales-order", linkEngineeringSalesOrderController);
engineeringRouter.get("/documents/list", listEngineeringDocumentsController);
engineeringRouter.post("/documents", createEngineeringDocumentController);
engineeringRouter.patch("/documents/:documentId", updateEngineeringDocumentController);
engineeringRouter.get("/ecr", listEcrController);
engineeringRouter.post("/ecr", createEcrController);
engineeringRouter.patch("/ecr/:ecrId", updateEcrController);

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