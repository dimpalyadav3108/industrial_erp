import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { prisma } from "./config/database.js";

import { authRouter } from "./routes/auth.routes.js";
import { customerRouter } from "./routes/customer.routes.js";
import { dispatchRouter } from "./routes/dispatch.routes.js";
import { estimateRouter } from "./routes/estimate.routes.js";
import { engineeringRouter } from "./routes/engineering.routes.js";
import { inventoryRouter } from "./routes/inventory.routes.js";
import { leadRouter } from "./routes/lead.routes.js";
import { procurementRouter } from "./routes/procurement.routes.js";
import { productionRouter } from "./routes/production.routes.js";
import { qualityRouter } from "./routes/quality.routes.js";
import { quotationRouter } from "./routes/quotation.routes.js";
import { salesRouter } from "./routes/sales.routes.js";
import { projectRouter } from "./routes/project.routes.js";
import { serviceRouter } from "./routes/service.routes.js";
import { installationRouter } from "./routes/installation.routes.js";
import { financeRouter } from "./routes/finance.routes.js";
import { managementDashboardRouter } from "./routes/management-dashboard.routes.js";
import { hrRouter } from "./routes/hr.routes.js";
import { iotRouter } from "./routes/iot.routes.js";
import { settingsRouter } from "./routes/settings.routes.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));
app.use(morgan("dev"));

app.use("/api/auth", authRouter);
app.use("/api/customers", customerRouter);
app.use("/api/leads", leadRouter);
app.use("/api/estimates", estimateRouter);
app.use("/api/engineering", engineeringRouter);
app.use("/api/procurement", procurementRouter);
app.use("/api/sales", salesRouter);
app.use("/api/projects", projectRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/production", productionRouter);
app.use("/api/quality", qualityRouter);
app.use("/api/quotations", quotationRouter);
app.use("/api/dispatches", dispatchRouter);
app.use("/api/service", serviceRouter);
app.use("/api/installations", installationRouter);
app.use("/api/finance", financeRouter);
app.use("/api/management-dashboard", managementDashboardRouter);

/* HR & Payroll */
app.use("/api/hr", hrRouter);

/* IoT & Management Dashboard */
app.use("/api/iot", iotRouter);

app.use("/api/settings", settingsRouter);

app.get("/api/health", async (_r: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "Industrial ERP backend and database are running",
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Database health check failed:", e);

    res.status(503).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.use((_r: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

app.use(
  (error: Error, _r: Request, res: Response, _n: NextFunction) => {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

app.listen(PORT, () =>
  console.log(`Industrial ERP API running at http://localhost:${PORT}`)
);