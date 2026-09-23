import { Router } from "express";
import {
  createLeadController,
  deleteLeadController,
  getLeadController,
  listLeadsController,
  updateLeadController,
  getLeadCrmDetailsController,
  saveLeadTechnicalController,
  createLeadActivityController,
  createLeadCompetitorController,
  saveLeadSurveyController,
  createLeadTenderController,
  createLeadOutcomeController,
} from "../controllers/lead.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const leadRouter = Router();

leadRouter.use(authenticate);

leadRouter.get("/", listLeadsController);
leadRouter.get("/:id", getLeadController);
leadRouter.get("/:id/crm", getLeadCrmDetailsController);
leadRouter.put("/:id/technical", saveLeadTechnicalController);
leadRouter.post("/:id/activities", createLeadActivityController);
leadRouter.post("/:id/competitors", createLeadCompetitorController);
leadRouter.post("/:id/surveys", saveLeadSurveyController);
leadRouter.post("/:id/tenders", createLeadTenderController);
leadRouter.post("/:id/outcomes", createLeadOutcomeController);
leadRouter.post("/", createLeadController);
leadRouter.patch("/:id", updateLeadController);
leadRouter.delete("/:id", deleteLeadController);