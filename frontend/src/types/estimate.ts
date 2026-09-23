export type EstimateStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "CONVERTED";

// Boiler Costing Engine pipeline stage:
// RFQ -> Engineering Validation -> BOM Estimation -> Raw Material Cost ->
// Labour Cost -> Fabrication Cost -> Painting Cost -> Testing Cost ->
// Transportation Cost -> Margin Addition -> Quotation Release
export type EstimateStage =
  | "RFQ" | "ENGINEERING_VALIDATION" | "BOM_ESTIMATION" | "RAW_MATERIAL_COSTING"
  | "LABOUR_COSTING" | "FABRICATION_COSTING" | "PAINTING_COSTING" | "TESTING_COSTING"
  | "TRANSPORTATION_COSTING" | "MARGIN_REVIEW" | "QUOTATION_RELEASE";

export type EngineeringValidationStatus = "PENDING" | "VALIDATED" | "REJECTED";

export type EstimateItemType = "MATERIAL" | "LABOUR" | "FABRICATION" | "PAINTING" | "TESTING" | "TRANSPORTATION" | "OVERHEAD" | "SERVICE";

// Raw Material cost component categories
export type RawMaterialCategory = "MS_PLATE" | "SS_PLATE" | "TUBES" | "PIPES" | "VALVES" | "PUMPS" | "BURNERS" | "REFRACTORY";
// Fabrication / surface-treatment process categories
export type FabricationProcess = "CUTTING" | "ROLLING" | "WELDING" | "MACHINING" | "GRINDING" | "SAND_BLASTING" | "PAINTING" | "INSULATION";
// Testing cost categories
export type TestingType = "HYDRO_TEST" | "NDT" | "RADIOGRAPHY" | "IBR_INSPECTION";
// Transportation / logistics cost categories
export type LogisticsType = "PACKING" | "FREIGHT" | "INSURANCE";

export interface EstimateItem {
  id: string; estimateId: string; itemType: EstimateItemType; description: string;
  quantity: string; unit: string; unitRate: string; amount: string; sortOrder: number;
  category: RawMaterialCategory | null; process: FabricationProcess | null;
  testType: TestingType | null; logisticsType: LogisticsType | null;
}
export interface EstimateLead {
  id: string; leadNumber: string; title: string; status: string;
  customer: { id: string; customerCode: string; companyName: string } | null;
}
export interface EstimateUserRef { id: string; employeeCode: string; firstName: string; lastName: string }
export interface Estimate {
  id: string; estimateNumber: string; leadId: string; version: number; status: EstimateStatus; stage: EstimateStage;

  // Stage 1: RFQ
  rfqNumber: string | null; rfqSource: string | null; rfqReceivedDate: string | null; rfqDueDate: string | null;

  // Stage 2: Engineering Validation
  engineeringValidationStatus: EngineeringValidationStatus;
  engineeringValidationNotes: string | null;
  engineeringValidatedBy: EstimateUserRef | null;
  engineeringValidatedAt: string | null;

  // Stage 3: BOM Estimation
  bomEstimationCompletedAt: string | null;

  // Cost Components: Raw Material / Labour / Fabrication / Painting / Testing / Transportation / Margin
  materialCost: string; labourCost: string; fabricationCost: string; paintingCost: string; testingCost: string;
  packingCost: string; freightCost: string; insuranceCost: string; transportationCost: string; overheadCost: string;
  marginPercent: string;
  subtotal: string; taxPercent: string; taxAmount: string; totalAmount: string;

  // Stage 11: Quotation Release
  quotationReleasedBy: EstimateUserRef | null; quotationReleasedAt: string | null;

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
  category?: RawMaterialCategory; process?: FabricationProcess; testType?: TestingType; logisticsType?: LogisticsType;
}
export interface CreateEstimatePayload {
  leadId: string; status: EstimateStatus; stage?: EstimateStage; marginPercent: number; taxPercent: number;
  validUntil?: string; notes?: string;
  rfqNumber?: string; rfqSource?: string; rfqReceivedDate?: string; rfqDueDate?: string;
  productFamily?: string; productModel?: string; processIndustry?: string;
  fuelType?: string; capacityTph?: number; requiredSteamConsumption?: number; workingPressureBar?: number;
  designPressureBar?: number; steamTemperatureC?: number; feedWaterTemperatureC?: number;
  flueGasTemperatureC?: number; operatingHoursPerDay?: number; operatingDaysPerYear?: number;
  fuelConsumptionPerHour?: number; fuelCalorificValueKcalKg?: number; fuelPricePerUnit?: number;
  existingBoilerEfficiency?: number; proposedBoilerEfficiency?: number; technicalNotes?: string;
  items: CreateEstimateItemPayload[];
}
export interface EstimateListResponse { success: boolean; data: Estimate[]; message?: string }
export interface EstimateResponse { success: boolean; data: Estimate; message?: string }
