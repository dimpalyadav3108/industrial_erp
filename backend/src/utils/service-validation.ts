import { z } from "zod";

const optionalText = (maximum = 2000) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().max(maximum).optional()
);

const optionalNumber = z.preprocess(
  (value) => value === "" || value === null || value === undefined ? undefined : Number(value),
  z.number().finite().nonnegative().optional()
);

export const contractStatusSchema = z.enum(["DRAFT", "ACTIVE", "EXPIRED", "SUSPENDED", "CANCELLED"]);
export const requestStatusSchema = z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELLED"]);

export const createContractSchema = z.object({
  customerId: z.string().uuid(),
  dispatchId: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(200),
  contractType: z.enum(["WARRANTY", "AMC", "CMC", "ON_CALL"]),
  status: contractStatusSchema.default("ACTIVE"),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  contractValue: optionalNumber,
  visitsIncluded: z.coerce.number().int().nonnegative().max(10000).default(0),
  responseTimeHours: z.coerce.number().int().positive().max(8760).optional(),
  notes: optionalText(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date must be on or after the start date",
  path: ["endDate"],
});

export const createServiceRequestSchema = z.object({
  customerId: z.string().uuid(),
  serviceContractId: z.string().uuid().optional(),
  requestType: z.enum(["BREAKDOWN", "PREVENTIVE_MAINTENANCE", "INSTALLATION", "COMMISSIONING", "INSPECTION", "OTHER"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  subject: z.string().trim().min(3).max(200),
  description: z.string().trim().min(3).max(3000),
  location: optionalText(500),
  scheduledDate: optionalText(100),
});

export const updateServiceRequestSchema = z.object({
  status: requestStatusSchema.optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  scheduledDate: optionalText(100),
  resolutionNotes: optionalText(3000),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one service request field must be provided",
});
