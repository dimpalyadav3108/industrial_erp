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

// Boiler Costing Engine pipeline stage:
// RFQ -> Engineering Validation -> BOM Estimation -> Raw Material Cost ->
// Labour Cost -> Fabrication Cost -> Painting Cost -> Testing Cost ->
// Transportation Cost -> Margin Addition -> Quotation Release
export const ESTIMATE_STAGES = [
  "RFQ",
  "ENGINEERING_VALIDATION",
  "BOM_ESTIMATION",
  "RAW_MATERIAL_COSTING",
  "LABOUR_COSTING",
  "FABRICATION_COSTING",
  "PAINTING_COSTING",
  "TESTING_COSTING",
  "TRANSPORTATION_COSTING",
  "MARGIN_REVIEW",
  "QUOTATION_RELEASE",
] as const;

export const ENGINEERING_VALIDATION_STATUSES = ["PENDING", "VALIDATED", "REJECTED"] as const;

// Raw Material cost component categories
export const RAW_MATERIAL_CATEGORIES = [
  "MS_PLATE", "SS_PLATE", "TUBES", "PIPES", "VALVES", "PUMPS", "BURNERS", "REFRACTORY",
] as const;

// Fabrication / surface-treatment process categories
export const FABRICATION_PROCESSES = [
  "CUTTING", "ROLLING", "WELDING", "MACHINING", "GRINDING", "SAND_BLASTING", "PAINTING", "INSULATION",
] as const;

// Testing cost categories
export const TESTING_TYPES = ["HYDRO_TEST", "NDT", "RADIOGRAPHY", "IBR_INSPECTION"] as const;

// Transportation / logistics cost categories
export const LOGISTICS_TYPES = ["PACKING", "FREIGHT", "INSURANCE"] as const;

export const estimateItemSchema = z.object({
  itemType: z.enum(["MATERIAL", "LABOUR", "FABRICATION", "PAINTING", "TESTING", "TRANSPORTATION", "OVERHEAD", "SERVICE"]),
  description: z.string().trim().min(2).max(300),
  quantity: numberField("Quantity").refine((value) => value > 0, { message: "Quantity must be greater than zero" }),
  unit: z.string().trim().min(1).max(30),
  unitRate: numberField("Unit rate"),
  category: z.enum(RAW_MATERIAL_CATEGORIES).optional(),
  process: z.enum(FABRICATION_PROCESSES).optional(),
  testType: z.enum(TESTING_TYPES).optional(),
  logisticsType: z.enum(LOGISTICS_TYPES).optional(),
}).superRefine((item, ctx) => {
  if (item.itemType === "MATERIAL" && !item.category) {
    ctx.addIssue({ code: "custom", path: ["category"], message: "Select a raw material category (MS Plate, SS Plate, Tubes, Pipes, Valves, Pumps, Burners, Refractory)" });
  }
  if ((item.itemType === "FABRICATION" || item.itemType === "PAINTING") && !item.process) {
    ctx.addIssue({ code: "custom", path: ["process"], message: "Select a process (Cutting, Rolling, Welding, Machining, Grinding, Sand Blasting, Painting, Insulation)" });
  }
  if (item.itemType === "TESTING" && !item.testType) {
    ctx.addIssue({ code: "custom", path: ["testType"], message: "Select a testing type (Hydro Test, NDT, Radiography, IBR Inspection)" });
  }
  if (item.itemType === "TRANSPORTATION" && !item.logisticsType) {
    ctx.addIssue({ code: "custom", path: ["logisticsType"], message: "Select a logistics type (Packing, Freight, Insurance)" });
  }
});

export const createEstimateSchema = z.object({
  leadId: z.string().uuid("Please select a valid lead"),
  status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED", "CONVERTED"]).default("DRAFT"),
  stage: z.enum(ESTIMATE_STAGES).default("RFQ"),

  // Stage 1: Sales Team Creates RFQ
  rfqNumber: optionalShortText,
  rfqSource: optionalShortText,
  rfqReceivedDate: optionalDate,
  rfqDueDate: optionalDate,

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

  items: z.array(estimateItemSchema).min(1, "Add at least one estimate item").max(200),
}).superRefine((data, ctx) => {
  if (data.designPressureBar !== undefined && data.workingPressureBar !== undefined &&
      data.designPressureBar < data.workingPressureBar) {
    ctx.addIssue({ code: "custom", path: ["designPressureBar"], message: "Design pressure should be at least the working pressure" });
  }
  if (data.rfqDueDate && data.rfqReceivedDate && new Date(data.rfqDueDate) < new Date(data.rfqReceivedDate)) {
    ctx.addIssue({ code: "custom", path: ["rfqDueDate"], message: "RFQ due date cannot be before the RFQ received date" });
  }
});

export const updateEstimateStatusSchema = z.object({
  status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED", "CONVERTED"]),
});

// Boiler Costing Engine stage transition: the controller only allows moving
// to the next pipeline stage (or a backward correction), and blocks forward
// progress past Engineering Validation until validation is complete.
export const updateEstimateStageSchema = z.object({
  stage: z.enum(ESTIMATE_STAGES),
});

export const updateEngineeringValidationSchema = z.object({
  engineeringValidationStatus: z.enum(ENGINEERING_VALIDATION_STATUSES),
  engineeringValidationNotes: optionalText,
});

export type CreateEstimateInput = z.infer<typeof createEstimateSchema>;
export type EstimateStageInput = z.infer<typeof updateEstimateStageSchema>;
export type EngineeringValidationInput = z.infer<typeof updateEngineeringValidationSchema>;
