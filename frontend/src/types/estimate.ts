export type EstimateStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "CONVERTED";
export type EstimateItemType = "MATERIAL" | "LABOUR" | "OVERHEAD" | "SERVICE";

export interface EstimateItem {
  id: string; estimateId: string; itemType: EstimateItemType; description: string;
  quantity: string; unit: string; unitRate: string; amount: string; sortOrder: number;
}
export interface EstimateLead {
  id: string; leadNumber: string; title: string; status: string;
  customer: { id: string; customerCode: string; companyName: string } | null;
}
export interface Estimate {
  id: string; estimateNumber: string; leadId: string; version: number; status: EstimateStatus;
  materialCost: string; labourCost: string; overheadCost: string; marginPercent: string;
  subtotal: string; taxPercent: string; taxAmount: string; totalAmount: string;
  productFamily: string | null; productModel: string | null; processIndustry: string | null; fuelType: string | null;
  capacityTph: string | null; requiredSteamConsumption: string | null; workingPressureBar: string | null;
  designPressureBar: string | null; steamTemperatureC: string | null; feedWaterTemperatureC: string | null;
  flueGasTemperatureC: string | null; operatingHoursPerDay: string | null; operatingDaysPerYear: number | null;
  fuelConsumptionPerHour: string | null; fuelCalorificValueKcalKg: string | null; fuelPricePerUnit: string | null;
  existingBoilerEfficiency: string | null; proposedBoilerEfficiency: string | null;
  calculatedThermalEfficiency: string | null; calculatedBoilerOutput: string | null;
  estimatedFuelSavingPerHour: string | null; annualFuelSaving: string | null; annualCostSaving: string | null;
  technicalNotes: string | null; notes: string | null; validUntil: string | null;
  createdAt: string; updatedAt: string; lead: EstimateLead; items: EstimateItem[];
}
export interface CreateEstimateItemPayload {
  itemType: EstimateItemType; description: string; quantity: number; unit: string; unitRate: number;
}
export interface CreateEstimatePayload {
  leadId: string; status: EstimateStatus; marginPercent: number; taxPercent: number;
  validUntil?: string; notes?: string; productFamily?: string; productModel?: string; processIndustry?: string;
  fuelType?: string; capacityTph?: number; requiredSteamConsumption?: number; workingPressureBar?: number;
  designPressureBar?: number; steamTemperatureC?: number; feedWaterTemperatureC?: number;
  flueGasTemperatureC?: number; operatingHoursPerDay?: number; operatingDaysPerYear?: number;
  fuelConsumptionPerHour?: number; fuelCalorificValueKcalKg?: number; fuelPricePerUnit?: number;
  existingBoilerEfficiency?: number; proposedBoilerEfficiency?: number; technicalNotes?: string;
  items: CreateEstimateItemPayload[];
}
export interface EstimateListResponse { success: boolean; data: Estimate[]; message?: string }
export interface EstimateResponse { success: boolean; data: Estimate; message?: string }
