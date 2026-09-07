import { Router } from "express";
import {
  createCustomerController,
  listCustomersController,
} from "../controllers/customer.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const customerRouter = Router();

customerRouter.use(authenticate);

customerRouter.get("/", listCustomersController);
customerRouter.post("/", createCustomerController);