import { z } from "zod";

const numberField = (label: string) =>
  z.preprocess(
    (value) => value === "" || value === null || value === undefined ? 0 : Number(value),
    z.number().finite(`${label} must be a number`).nonnegative(`${label} cannot be negative`)
  );

const optionalNumber = (label: string, max?: number) =>
  z.preprocess(
    (value) => value === "" || value === null || value === undefined ? undefined : Number(value),
    z.number().finite(`${label} must be a number`).nonnegative(`${label} cannot be negative`)
      .refine((value) => max === undefined || value <= max, { message: `${label} cannot exceed ${max}` })
      .optional()
  );

const optionalInteger = (label: string, max?: number) =>
  z.preprocess(
    (value) => value === "" || value === null || value === undefined ? undefined : Number(value),
    z.number().int(`${label} must be a whole number`).nonnegative(`${label} cannot be negative`)
      .refine((value) => max === undefined || value <= max, { message: `${label} cannot exceed ${max}` })
      .optional()
  );

const optionalText = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().max(3000).optional()
);

const optionalShortText = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().max(200).optional()
);

const optionalDate = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional()
);

export const estimateItemSchema = z.object({
  itemType: z.enum(["MATERIAL", "LABOUR", "OVERHEAD", "SERVICE"]),
  description: z.string().trim().min(2).max(300),
  quantity: numberField("Quantity").refine((value) => value > 0, { message: "Quantity must be greater than zero" }),
  unit: z.string().trim().min(1).max(30),
  unitRate: numberField("Unit rate"),
});

export const createEstimateSchema = z.object({
  leadId: z.string().uuid("Please select a valid lead"),
  status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED", "CONVERTED"]).default("DRAFT"),
  marginPercent: numberField("Margin").refine((value) => value <= 100, { message: "Margin cannot exceed 100%" }),
  taxPercent: numberField("Tax").refine((value) => value <= 100, { message: "Tax cannot exceed 100%" }),
  validUntil: optionalDate,
  notes: optionalText,

  productFamily: optionalShortText,
  productModel: optionalShortText,
  processIndustry: optionalShortText,
  fuelType: optionalShortText,
  capacityTph: optionalNumber("Capacity"),
  requiredSteamConsumption: optionalNumber("Required steam consumption"),
  workingPressureBar: optionalNumber("Working pressure"),
  designPressureBar: optionalNumber("Design pressure"),
  steamTemperatureC: optionalNumber("Steam temperature"),
  feedWaterTemperatureC: optionalNumber("Feed water temperature"),
  flueGasTemperatureC: optionalNumber("Flue gas temperature"),
  operatingHoursPerDay: optionalNumber("Operating hours", 24),
  operatingDaysPerYear: optionalInteger("Operating days", 366),
  fuelConsumptionPerHour: optionalNumber("Fuel consumption"),
  fuelCalorificValueKcalKg: optionalNumber("Fuel calorific value"),
  fuelPricePerUnit: optionalNumber("Fuel price"),
  existingBoilerEfficiency: optionalNumber("Existing boiler efficiency", 100),
  proposedBoilerEfficiency: optionalNumber("Proposed boiler efficiency", 100),
  technicalNotes: optionalText,

  items: z.array(estimateItemSchema).min(1, "Add at least one estimate item").max(100),
}).superRefine((data, ctx) => {
  if (data.designPressureBar !== undefined && data.workingPressureBar !== undefined &&
      data.designPressureBar < data.workingPressureBar) {
    ctx.addIssue({ code: "custom", path: ["designPressureBar"], message: "Design pressure should be at least the working pressure" });
  }
});

export const updateEstimateStatusSchema = z.object({
  status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED", "CONVERTED"]),
});

export type CreateEstimateInput = z.infer<typeof createEstimateSchema>;
