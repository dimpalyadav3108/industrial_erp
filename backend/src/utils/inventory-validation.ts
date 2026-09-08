import { z } from "zod";

const numberField = (label: string) =>
  z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? 0
        : Number(value),
    z.number().finite(`${label} must be a number`).nonnegative(`${label} cannot be negative`)
  );

const optionalNumber = (label: string) =>
  z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? undefined
        : Number(value),
    z.number().finite(`${label} must be a number`).nonnegative(`${label} cannot be negative`).optional()
  );

const optionalText = (maximum = 1000) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(maximum).optional()
  );

export const inventoryItemTypeSchema = z.enum([
  "RAW_MATERIAL",
  "COMPONENT",
  "CONSUMABLE",
  "FINISHED_GOOD",
]);

export const stockMovementTypeSchema = z.enum([
  "RECEIPT",
  "ISSUE",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
  "RETURN_IN",
  "RETURN_OUT",
]);

export const createInventoryItemSchema = z.object({
  name: z.string().trim().min(2, "Item name must contain at least 2 characters").max(200),
  description: optionalText(2000),
  itemType: inventoryItemTypeSchema,
  category: optionalText(100),
  unit: z.string().trim().min(1, "Unit is required").max(30),
  openingStock: numberField("Opening stock"),
  reorderLevel: numberField("Reorder level"),
  unitCost: numberField("Unit cost"),
  location: optionalText(100),
});

export const updateInventoryItemSchema = z
  .object({
    name: z.string().trim().min(2).max(200).optional(),
    description: optionalText(2000),
    itemType: inventoryItemTypeSchema.optional(),
    category: optionalText(100),
    unit: z.string().trim().min(1).max(30).optional(),
    reorderLevel: optionalNumber("Reorder level"),
    unitCost: optionalNumber("Unit cost"),
    location: optionalText(100),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one item field must be provided",
  });

export const createStockMovementSchema = z.object({
  movementType: stockMovementTypeSchema,
  quantity: numberField("Quantity").refine((value) => value > 0, {
    message: "Quantity must be greater than zero",
  }),
  unitCost: optionalNumber("Unit cost"),
  referenceType: optionalText(50),
  referenceNumber: optionalText(100),
  notes: optionalText(1000),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;

