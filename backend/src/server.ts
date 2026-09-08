import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { prisma } from "./config/database.js";
import { authRouter } from "./routes/auth.routes.js";
import { customerRouter } from "./routes/customer.routes.js";
import { estimateRouter } from "./routes/estimate.routes.js";
import { inventoryRouter } from "./routes/inventory.routes.js";
import { leadRouter } from "./routes/lead.routes.js";
import { productionRouter } from "./routes/production.routes.js";
import { qualityRouter } from "./routes/quality.routes.js";
import { quotationRouter } from "./routes/quotation.routes.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/api/auth", authRouter);
app.use("/api/customers", customerRouter);
app.use("/api/leads", leadRouter);
app.use("/api/estimates", estimateRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/production", productionRouter);
app.use("/api/quality", qualityRouter);
app.use("/api/quotations", quotationRouter);

app.get("/api/health", async (_request: Request, response: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    response.status(200).json({
      success: true,
      message: "Industrial ERP backend and database are running",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    response.status(503).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.use((_request: Request, response: Response) => {
  response.status(404).json({
    success: false,
    message: "API route not found",
  });
});

app.use(
  (
    error: Error,
    _request: Request,
    response: Response,
    _next: NextFunction
  ) => {
    console.error(error);

    response.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

app.listen(PORT, () => {
  console.log(`Industrial ERP API running at http://localhost:${PORT}`);
});
