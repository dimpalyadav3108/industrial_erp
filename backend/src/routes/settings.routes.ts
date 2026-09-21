import { Router } from "express";
import {
  getCompanySettingsController,
  updateCompanySettingsController,
} from "../controllers/settings.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const settingsRouter = Router();

settingsRouter.use(authenticate);
settingsRouter.get("/company", getCompanySettingsController);
settingsRouter.put("/company", updateCompanySettingsController);
