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

// ============================================================
// ENGINEERING PROJECT
// ============================================================

export const engineeringProjectStatusSchema = z.enum([
  "DRAFT",
  "DESIGN_IN_PROGRESS",
  "CUSTOMER_REVIEW",
  "APPROVED",
  "RELEASED",
  "ON_HOLD",
  "CANCELLED",
]);

// ============================================================
// DRAWING
// ============================================================

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

// ============================================================
// BOM
// ============================================================

export const bomStatusSchema = z.enum([
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "RELEASED",
  "SUPERSEDED",
  "CANCELLED",
]);

export const bomItemSourceSchema = z.enum([
  "MAKE",
  "BUY",
]);

// ============================================================
// ENGINEERING PROJECT VALIDATION
// ============================================================

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

// ============================================================
// DRAWING VALIDATION
// ============================================================

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

// ============================================================
// BOM VALIDATION
// ============================================================

export const createEngineeringBomSchema = z.object({
  projectId: z.string().uuid("Select a valid engineering project"),

  bomNumber: z
    .string()
    .trim()
    .min(2, "BOM number is required")
    .max(100),

  name: z
    .string()
    .trim()
    .min(2, "BOM name is required")
    .max(200),

  revision: z
    .number()
    .int()
    .min(0)
    .optional(),

  description: optionalText(2000),
});

export const updateEngineeringBomSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(200)
      .optional(),

    revision: z
      .number()
      .int()
      .min(0)
      .optional(),

    status: bomStatusSchema.optional(),

    description: optionalText(2000),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one BOM field must be provided",
  });

// ============================================================
// BOM ITEM VALIDATION
// ============================================================

export const createEngineeringBomItemSchema = z.object({
  parentItemId: z
    .string()
    .uuid("Invalid parent BOM item")
    .nullable()
    .optional(),

  inventoryItemId: z
    .string()
    .uuid("Invalid inventory item")
    .nullable()
    .optional(),

  itemNumber: z
    .number()
    .int()
    .positive("Item number must be greater than zero"),

  name: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(200),

  description: optionalText(2000),

  quantity: z
    .number()
    .positive("Quantity must be greater than zero"),

  unit: z
    .string()
    .trim()
    .min(1, "Unit is required")
    .max(50),

  source: bomItemSourceSchema.default("BUY"),

  materialSpec: optionalText(500),

  drawingNumber: optionalText(100),

  remarks: optionalText(1000),

  sortOrder: z
    .number()
    .int()
    .min(0)
    .optional(),
});

export const updateEngineeringBomItemSchema = z
  .object({
    parentItemId: z
      .string()
      .uuid("Invalid parent BOM item")
      .nullable()
      .optional(),

    inventoryItemId: z
      .string()
      .uuid("Invalid inventory item")
      .nullable()
      .optional(),

    itemNumber: z
      .number()
      .int()
      .positive()
      .optional(),

    name: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .optional(),

    description: optionalText(2000),

    quantity: z
      .number()
      .positive()
      .optional(),

    unit: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .optional(),

    source: bomItemSourceSchema.optional(),

    materialSpec: optionalText(500),

    drawingNumber: optionalText(100),

    remarks: optionalText(1000),

    sortOrder: z
      .number()
      .int()
      .min(0)
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one BOM item field must be provided",
  });