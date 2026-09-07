import { Router } from "express";
import {
  createLeadController,
  listLeadsController,
} from "../controllers/lead.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const leadRouter = Router();

leadRouter.use(authenticate);

leadRouter.get("/", listLeadsController);
leadRouter.post("/", createLeadController);