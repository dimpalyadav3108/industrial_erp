import { Router } from "express";
import {
  getCurrentUserController,
  loginController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/login", loginController);
authRouter.get("/me", authenticate, getCurrentUserController);