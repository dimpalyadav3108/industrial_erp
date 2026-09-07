import { z } from "zod";

const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === ""
      ? undefined
      : value,
  z.string().trim().optional()
);

const optionalEmail = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === ""
      ? undefined
      : value,
  z.string().trim().email("Enter a valid email address").optional()
);

export const createCustomerSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, "Company name must contain at least 2 characters")
    .max(150, "Company name is too long"),

  contactPerson: optionalText,
  email: optionalEmail,
  phone: optionalText,
  gstNumber: optionalText,
  billingAddress: optionalText,
  shippingAddress: optionalText,
  city: optionalText,
  state: optionalText,

  country: z
    .string()
    .trim()
    .min(2, "Country is required")
    .default("India"),

  status: z
    .enum(["PROSPECT", "ACTIVE", "INACTIVE", "BLACKLISTED"])
    .default("PROSPECT"),
});

export type CreateCustomerInput = z.infer<
  typeof createCustomerSchema
>;