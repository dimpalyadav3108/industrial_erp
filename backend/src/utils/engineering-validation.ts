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

export const engineeringProjectStatusSchema = z.enum([
  "DRAFT",
  "DESIGN_IN_PROGRESS",
  "CUSTOMER_REVIEW",
  "APPROVED",
  "RELEASED",
  "ON_HOLD",
  "CANCELLED",
]);

export const drawingCategorySchema = z.enum([
  "GENERAL_ARRANGEMENT",
  "PID",
  "FABRICATION",
  "TUBE_LAYOUT",
  "ELECTRICAL",
  "INSTRUMENTATION",
  "FOUNDATION",
  "OTHER",
]);

export const drawingRevisionStatusSchema = z.enum([
  "DRAFT",
  "INTERNAL_REVIEW",
  "CUSTOMER_REVIEW",
  "APPROVED",
  "REJECTED",
  "SUPERSEDED",
]);

export const createEngineeringProjectSchema = z
  .object({
    quotationId: z.string().uuid("Select a valid quotation"),
    title: z.string().trim().min(2).max(200),
    productFamily: optionalText(150),
    productModel: optionalText(150),
    plannedStartDate: optionalDate,
    plannedReleaseDate: optionalDate,
    notes: optionalText(2000),
  })
  .refine(
    (data) =>
      !data.plannedStartDate ||
      !data.plannedReleaseDate ||
      new Date(data.plannedReleaseDate) >=
        new Date(data.plannedStartDate),
    {
      message: "Planned release date cannot be before the start date",
      path: ["plannedReleaseDate"],
    }
  );

export const updateEngineeringProjectSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),
    productFamily: optionalText(150),
    productModel: optionalText(150),
    status: engineeringProjectStatusSchema.optional(),
    plannedStartDate: optionalDate,
    plannedReleaseDate: optionalDate,
    notes: optionalText(2000),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one engineering project field must be provided",
  });

export const createEngineeringDrawingSchema = z.object({
  projectId: z.string().uuid("Select a valid engineering project"),
  drawingNumber: z.string().trim().min(2).max(100),
  title: z.string().trim().min(2).max(200),
  category: drawingCategorySchema,
  description: optionalText(2000),
  documentName: optionalText(255),
  documentUrl: optionalText(1000),
  changeReason: z.string().trim().min(2).max(1000),
});

export const createDrawingRevisionSchema = z.object({
  documentName: optionalText(255),
  documentUrl: optionalText(1000),
  changeReason: z.string().trim().min(2).max(1000),
});

export const updateDrawingRevisionSchema = z
  .object({
    status: drawingRevisionStatusSchema.optional(),
    customerApproved: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide a revision status or customer approval",
  });