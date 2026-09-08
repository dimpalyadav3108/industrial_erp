import { z } from "zod";

const optionalText = (maximum = 2000) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(maximum).optional()
  );

const optionalDate = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional()
);

export const qualityInspectionTypeSchema = z.enum(["IN_PROCESS", "FINAL"]);

export const qualityInspectionStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "PASSED",
  "FAILED",
  "ON_HOLD",
]);

export const qualityCheckResultSchema = z.enum([
  "PENDING",
  "PASS",
  "FAIL",
  "NOT_APPLICABLE",
]);

const qualityCheckSchema = z.object({
  parameter: z.string().trim().min(2).max(200),
  specification: optionalText(500),
});

export const createQualityInspectionSchema = z.object({
  productionOrderId: z.string().uuid("Select a valid production order"),
  inspectionType: qualityInspectionTypeSchema,
  scheduledDate: optionalDate,
  inspectorId: z.string().uuid().optional().nullable(),
  remarks: optionalText(),
  checks: z.array(qualityCheckSchema).min(1).max(50),
});

export const updateQualityInspectionSchema = z
  .object({
    status: qualityInspectionStatusSchema.optional(),
    scheduledDate: optionalDate,
    inspectorId: z.string().uuid().optional().nullable(),
    remarks: optionalText(),
    failureReason: optionalText(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one inspection field must be provided",
  });

export const updateQualityCheckSchema = z.object({
  result: qualityCheckResultSchema,
  observedValue: optionalText(500),
  remarks: optionalText(1000),
});

