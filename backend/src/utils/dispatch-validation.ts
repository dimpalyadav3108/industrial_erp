import { z } from "zod";

const optionalText = (maximum = 1000) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(maximum).optional()
  );

const optionalDate = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional()
);

const optionalNumber = (label: string) =>
  z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? undefined
        : Number(value),
    z.number().finite(`${label} must be a number`).nonnegative().optional()
  );

export const dispatchStatusSchema = z.enum([
  "PLANNED",
  "READY",
  "DISPATCHED",
  "DELIVERED",
  "CANCELLED",
]);

export const transportModeSchema = z.enum([
  "ROAD",
  "AIR",
  "RAIL",
  "COURIER",
  "CUSTOMER_PICKUP",
]);

export const createDispatchSchema = z.object({
  qualityInspectionId: z.string().uuid("Select a valid passed inspection"),
  transportMode: transportModeSchema.default("ROAD"),
  expectedDeliveryDate: optionalDate,
  transporterName: optionalText(150),
  vehicleNumber: optionalText(50),
  trackingNumber: optionalText(100),
  destination: z.string().trim().min(3).max(1000),
  contactPerson: optionalText(150),
  contactPhone: optionalText(30),
  packageCount: z.preprocess(
    (value) => Number(value),
    z.number().int().positive().max(100000)
  ),
  totalWeight: optionalNumber("Total weight"),
  notes: optionalText(2000),
});

export const updateDispatchSchema = z
  .object({
    status: dispatchStatusSchema.optional(),
    transportMode: transportModeSchema.optional(),
    expectedDeliveryDate: optionalDate,
    transporterName: optionalText(150),
    vehicleNumber: optionalText(50),
    trackingNumber: optionalText(100),
    destination: z.string().trim().min(3).max(1000).optional(),
    contactPerson: optionalText(150),
    contactPhone: optionalText(30),
    packageCount: z.preprocess(
      (value) =>
        value === "" || value === null || value === undefined
          ? undefined
          : Number(value),
      z.number().int().positive().max(100000).optional()
    ),
    totalWeight: optionalNumber("Total weight"),
    notes: optionalText(2000),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one dispatch field must be provided",
  });

