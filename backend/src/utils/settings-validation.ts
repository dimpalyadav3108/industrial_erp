import { z } from "zod";

const optionalText = (maximum = 500) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(maximum).nullable().optional()
  );

const prefixSchema = z
  .string()
  .trim()
  .min(2)
  .max(10)
  .regex(/^[A-Za-z0-9-]+$/, "Use only letters, numbers and hyphens")
  .transform((value) => value.toUpperCase());

export const updateCompanySettingsSchema = z.object({
  companyName: z.string().trim().min(2).max(200),
  legalName: optionalText(200),
  gstNumber: optionalText(30),
  panNumber: optionalText(20),
  email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().email().max(200).nullable().optional()
  ),
  phone: optionalText(30),
  website: optionalText(300),
  address: optionalText(1000),
  city: optionalText(100),
  state: optionalText(100),
  country: z.string().trim().min(2).max(100),
  postalCode: optionalText(20),
  currency: z.string().trim().min(3).max(3).transform((value) => value.toUpperCase()),
  timezone: z.string().trim().min(2).max(100),
  financialYearStart: z.coerce.number().int().min(1).max(12),
  defaultTaxPercent: z.coerce.number().min(0).max(100),
  estimatePrefix: prefixSchema,
  quotationPrefix: prefixSchema,
  productionPrefix: prefixSchema,
  dispatchPrefix: prefixSchema,
});
