import { z } from "zod";

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

export const quotationStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CONVERTED",
]);

export const createQuotationSchema = z.object({
  estimateId: z.string().uuid("Please select a valid approved estimate"),
  status: quotationStatusSchema.default("DRAFT"),
  validUntil: optionalDate,
  paymentTerms: optionalText,
  deliveryTerms: optionalText,
  termsAndConditions: optionalText,
  notes: optionalText,
});

export const updateQuotationStatusSchema = z.object({
  status: quotationStatusSchema,
});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;

