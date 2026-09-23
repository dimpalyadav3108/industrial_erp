import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { addReading, createAlert, createDevice, dashboard, listDevices, updateAlert, updateDevice } from "../controllers/iot.controller.js";

export const iotRouter=Router();
iotRouter.use(authenticate);
iotRouter.get("/dashboard",dashboard);
iotRouter.get("/devices",listDevices);
iotRouter.post("/devices",createDevice);
iotRouter.patch("/devices/:id",updateDevice);
iotRouter.post("/devices/:id/readings",addReading);
iotRouter.post("/devices/:id/alerts",createAlert);
iotRouter.patch("/alerts/:id",updateAlert);
