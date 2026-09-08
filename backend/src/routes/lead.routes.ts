import { Router } from "express";
import {
  createLeadController,
  deleteLeadController,
  getLeadController,
  listLeadsController,
  updateLeadController,
} from "../controllers/lead.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const leadRouter = Router();

leadRouter.use(authenticate);

leadRouter.get("/", listLeadsController);
leadRouter.get("/:id", getLeadController);
leadRouter.post("/", createLeadController);
leadRouter.patch("/:id", updateLeadController);
leadRouter.delete("/:id", deleteLeadController);