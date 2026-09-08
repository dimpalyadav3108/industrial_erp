import { z } from "zod";

const optionalText = (maximum = 1000) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(maximum).optional()
  );

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().datetime({ offset: true }).optional()
);

const positiveNumber = (label: string) =>
  z.preprocess(
    (value) => Number(value),
    z.number().finite(`${label} must be a number`).positive(`${label} must be greater than zero`)
  );

const percentage = z.preprocess(
  (value) => Number(value),
  z.number().finite().min(0).max(100)
);

export const productionOrderStatusSchema = z.enum([
  "PLANNED",
  "RELEASED",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
]);

export const productionOperationStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "SKIPPED",
]);

export const productionPrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

const operationSchema = z.object({
  name: z.string().trim().min(2).max(150),
  workCenter: optionalText(100),
  plannedStartDate: optionalDate,
  plannedEndDate: optionalDate,
  notes: optionalText(1000),
});

export const createProductionOrderSchema = z
  .object({
    quotationId: z.string().uuid("Select a valid quotation"),
    title: z.string().trim().min(2).max(200),
    priority: productionPrioritySchema.default("MEDIUM"),
    quantity: positiveNumber("Quantity"),
    unit: z.string().trim().min(1).max(30),
    plannedStartDate: optionalDate,
    plannedEndDate: optionalDate,
    assignedToId: z.string().uuid().optional().nullable(),
    notes: optionalText(2000),
    operations: z.array(operationSchema).min(1).max(30),
  })
  .refine(
    (data) =>
      !data.plannedStartDate ||
      !data.plannedEndDate ||
      new Date(data.plannedEndDate) >= new Date(data.plannedStartDate),
    {
      message: "Planned end date cannot be before the start date",
      path: ["plannedEndDate"],
    }
  );

export const updateProductionOrderSchema = z
  .object({
    status: productionOrderStatusSchema.optional(),
    priority: productionPrioritySchema.optional(),
    progressPercent: percentage.optional(),
    plannedStartDate: optionalDate,
    plannedEndDate: optionalDate,
    assignedToId: z.string().uuid().optional().nullable(),
    notes: optionalText(2000),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one production field must be provided",
  });

export const updateProductionOperationSchema = z.object({
  status: productionOperationStatusSchema,
  notes: optionalText(1000),
});

