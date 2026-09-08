import { z } from "zod";

const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === ""
      ? undefined
      : value,
  z.string().trim().optional()
);

const optionalAmount = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined
      ? undefined
      : Number(value),
  z
    .number()
    .nonnegative("Estimated value cannot be negative")
    .optional()
);

const optionalDate = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === ""
      ? undefined
      : value,
  z.string().trim().optional()
);

const optionalUserId = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().uuid("Invalid assigned user").optional()
);

export const createLeadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Lead title must contain at least 3 characters")
    .max(200),

  description: optionalText,
  source: optionalText,

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .default("MEDIUM"),

  status: z
    .enum([
      "NEW",
      "QUALIFIED",
      "TECHNICAL_REVIEW",
      "ESTIMATION",
      "QUOTATION_SENT",
      "WON",
      "LOST",
      "ON_HOLD",
    ])
    .default("NEW"),

  estimatedValue: optionalAmount,
  expectedCloseDate: optionalDate,

  customerId: z
    .string()
    .uuid("Please select a valid customer"),

  assignedToId: optionalUserId,
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export const updateLeadSchema = createLeadSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;