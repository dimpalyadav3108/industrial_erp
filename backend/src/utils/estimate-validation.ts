import { z } from "zod";

const numberField = (label: string) =>
  z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? 0
        : Number(value),
    z.number().finite(`${label} must be a number`).nonnegative(`${label} cannot be negative`)
  );

const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().max(3000).optional()
);

const optionalDate = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional()
);

export const estimateItemSchema = z.object({
  itemType: z.enum(["MATERIAL", "LABOUR", "OVERHEAD", "SERVICE"]),
  description: z.string().trim().min(2).max(300),
  quantity: numberField("Quantity").refine((value) => value > 0, {
    message: "Quantity must be greater than zero",
  }),
  unit: z.string().trim().min(1).max(30),
  unitRate: numberField("Unit rate"),
});

export const createEstimateSchema = z.object({
  leadId: z.string().uuid("Please select a valid lead"),
  status: z
    .enum(["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED", "CONVERTED"])
    .default("DRAFT"),
  marginPercent: numberField("Margin").refine((value) => value <= 100, {
    message: "Margin cannot exceed 100%",
  }),
  taxPercent: numberField("Tax").refine((value) => value <= 100, {
    message: "Tax cannot exceed 100%",
  }),
  validUntil: optionalDate,
  notes: optionalText,
  items: z.array(estimateItemSchema).min(1, "Add at least one estimate item").max(100),
});

export const updateEstimateStatusSchema = z.object({
  status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED", "CONVERTED"]),
});

export type CreateEstimateInput = z.infer<typeof createEstimateSchema>;
