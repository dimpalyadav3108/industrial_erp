import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { getManagementDashboard } from "../controllers/management-dashboard.controller.js";

export const managementDashboardRouter = Router();
managementDashboardRouter.use(authenticate);
managementDashboardRouter.get("/", getManagementDashboard);
