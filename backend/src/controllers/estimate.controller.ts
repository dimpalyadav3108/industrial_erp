import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import {
  createEstimateSchema,
  updateEstimateStatusSchema,
  updateEstimateStageSchema,
  updateEngineeringValidationSchema,
  ESTIMATE_STAGES,
  type CreateEstimateInput,
} from "../utils/estimate-validation.js";

type AuthenticatedRequest = Request & { auth?: { userId: string } };

const estimateInclude = {
  lead: {
    select: {
      id: true, leadNumber: true, title: true, status: true,
      customer: { select: { id: true, customerCode: true, companyName: true } },
    },
  },
  createdBy: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
  engineeringValidatedBy: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
  quotationReleasedBy: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
  items: { orderBy: { sortOrder: "asc" as const } },
} as const;

const roundMoney = (value: number) => Math.round(value * 100) / 100;
const round3 = (value: number) => Math.round(value * 1000) / 1000;

// Boiler Costing Engine pipeline order:
// RFQ -> Engineering Validation -> BOM Estimation -> Raw Material Cost ->
// Labour Cost -> Fabrication Cost -> Painting Cost -> Testing Cost ->
// Transportation Cost -> Margin Addition -> Quotation Release
const stageIndex = (stage: string) => ESTIMATE_STAGES.indexOf(stage as (typeof ESTIMATE_STAGES)[number]);

// Cost Components, per the Estimation & Costing PRD:
//   Raw Material   -> MS Plate, SS Plate, Tubes, Pipes, Valves, Pumps, Burners, Refractory
//   Fabrication    -> Cutting, Rolling, Welding, Machining, Grinding, Sand Blasting
//   Painting       -> Painting, Insulation (surface treatment)
//   Testing        -> Hydro Test, NDT, Radiography, IBR Inspection
//   Transportation -> Packing, Freight, Insurance
const calculateEstimate = (data: CreateEstimateInput) => {
  const items = data.items.map((item, index) => ({
    ...item, amount: roundMoney(item.quantity * item.unitRate), sortOrder: index,
  }));

  const sumBy = (type: string) => roundMoney(items.filter((i) => i.itemType === type).reduce((t, i) => t + i.amount, 0));
  const sumLogistics = (logisticsType: string) =>
    roundMoney(items.filter((i) => i.itemType === "TRANSPORTATION" && i.logisticsType === logisticsType).reduce((t, i) => t + i.amount, 0));

  const materialCost = sumBy("MATERIAL");
  const labourCost = sumBy("LABOUR");
  const fabricationCost = sumBy("FABRICATION");
  const paintingCost = sumBy("PAINTING");
  const testingCost = sumBy("TESTING");
  const packingCost = sumLogistics("PACKING");
  const freightCost = sumLogistics("FREIGHT");
  const insuranceCost = sumLogistics("INSURANCE");
  const transportationCost = roundMoney(packingCost + freightCost + insuranceCost);
  const overheadCost = roundMoney(items.filter((i) => i.itemType === "OVERHEAD" || i.itemType === "SERVICE").reduce((t, i) => t + i.amount, 0));

  const baseCost = roundMoney(
    materialCost + labourCost + fabricationCost + paintingCost + testingCost + transportationCost + overheadCost
  );
  const marginAmount = roundMoney(baseCost * data.marginPercent / 100);
  const subtotal = roundMoney(baseCost + marginAmount);
  const taxAmount = roundMoney(subtotal * data.taxPercent / 100);

  return {
    items, materialCost, labourCost, fabricationCost, paintingCost, testingCost,
    packingCost, freightCost, insuranceCost, transportationCost, overheadCost,
    subtotal, taxAmount, totalAmount: roundMoney(subtotal + taxAmount),
  };
};

const calculateEngineering = (data: CreateEstimateInput) => {
  const proposed = data.proposedBoilerEfficiency;
  const existing = data.existingBoilerEfficiency;
  const fuel = data.fuelConsumptionPerHour;
  const hours = data.operatingHoursPerDay;
  const days = data.operatingDaysPerYear;
  const fuelPrice = data.fuelPricePerUnit;
  const cv = data.fuelCalorificValueKcalKg;

  const calculatedThermalEfficiency = proposed ?? null;
  const calculatedBoilerOutput =
    fuel !== undefined && cv !== undefined && proposed !== undefined
      ? round3((fuel * cv * (proposed / 100)) / 539000)
      : data.capacityTph ?? null;

  const estimatedFuelSavingPerHour =
    fuel !== undefined && existing !== undefined && proposed !== undefined && proposed > 0 && proposed > existing
      ? round3(fuel * (1 - existing / proposed))
      : 0;

  const annualFuelSaving =
    estimatedFuelSavingPerHour > 0 && hours !== undefined && days !== undefined
      ? round3(estimatedFuelSavingPerHour * hours * days)
      : 0;

  const annualCostSaving =
    annualFuelSaving > 0 && fuelPrice !== undefined ? roundMoney(annualFuelSaving * fuelPrice) : 0;

  return { calculatedThermalEfficiency, calculatedBoilerOutput, estimatedFuelSavingPerHour, annualFuelSaving, annualCostSaving };
};

export const listEstimatesController = async (request: Request, response: Response) => {
  try {
    const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
    const stage = typeof request.query.stage === "string" ? request.query.stage.trim() : "";
    const estimates = await prisma.estimate.findMany({
      where: {
        ...(search ? { OR: [
          { estimateNumber: { contains: search, mode: "insensitive" as const } },
          { rfqNumber: { contains: search, mode: "insensitive" as const } },
          { productFamily: { contains: search, mode: "insensitive" as const } },
          { productModel: { contains: search, mode: "insensitive" as const } },
          { lead: { title: { contains: search, mode: "insensitive" as const } } },
          { lead: { customer: { companyName: { contains: search, mode: "insensitive" as const } } } },
        ] } : {}),
        ...(stage ? { stage: stage as (typeof ESTIMATE_STAGES)[number] } : {}),
      },
      include: estimateInclude, orderBy: { createdAt: "desc" },
    });
    response.status(200).json({ success: true, data: estimates });
  } catch (error) {
    console.error("Unable to list estimates:", error);
    response.status(500).json({ success: false, message: "Unable to load estimates" });
  }
};

export const getEstimateController = async (request: Request, response: Response) => {
  try {
    const estimate = await prisma.estimate.findUnique({ where: { id: String(request.params.id) }, include: estimateInclude });
    if (!estimate) { response.status(404).json({ success: false, message: "Estimate was not found" }); return; }
    response.status(200).json({ success: true, data: estimate });
  } catch (error) {
    console.error("Unable to load estimate:", error);
    response.status(500).json({ success: false, message: "Unable to load estimate" });
  }
};

export const createEstimateController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = createEstimateSchema.safeParse(request.body);
    if (!validation.success) {
      response.status(400).json({ success: false, message: "Please correct the estimate fields", errors: validation.error.flatten().fieldErrors });
      return;
    }
    const data = validation.data;
    const lead = await prisma.lead.findUnique({ where: { id: data.leadId }, select: { id: true } });
    if (!lead) { response.status(404).json({ success: false, message: "Selected lead was not found" }); return; }

    const latestVersion = await prisma.estimate.aggregate({ where: { leadId: data.leadId }, _max: { version: true } });
    const version = (latestVersion._max.version ?? 0) + 1;
    const totals = calculateEstimate(data);
    const engineering = calculateEngineering(data);
    const estimateNumber = `EST-${new Date().getFullYear()}-${randomUUID().slice(0,8).toUpperCase()}`;

    const estimate = await prisma.$transaction(async (transaction) => {
      const created = await transaction.estimate.create({
        data: {
          estimateNumber, leadId: data.leadId, version, status: data.status, stage: data.stage,
          marginPercent: data.marginPercent, taxPercent: data.taxPercent,
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          notes: data.notes ?? null,
          createdById: request.auth?.userId ?? null,

          // Stage 1: RFQ
          rfqNumber: data.rfqNumber ?? null,
          rfqSource: data.rfqSource ?? null,
          rfqReceivedDate: data.rfqReceivedDate ? new Date(data.rfqReceivedDate) : null,
          rfqDueDate: data.rfqDueDate ? new Date(data.rfqDueDate) : null,

          // Cost Components roll-up (Raw Material / Labour / Fabrication / Painting / Testing / Transportation)
          materialCost: totals.materialCost, labourCost: totals.labourCost,
          fabricationCost: totals.fabricationCost, paintingCost: totals.paintingCost,
          testingCost: totals.testingCost, packingCost: totals.packingCost,
          freightCost: totals.freightCost, insuranceCost: totals.insuranceCost,
          transportationCost: totals.transportationCost, overheadCost: totals.overheadCost,
          subtotal: totals.subtotal, taxAmount: totals.taxAmount, totalAmount: totals.totalAmount,

          productFamily: data.productFamily ?? null,
          productModel: data.productModel ?? null,
          processIndustry: data.processIndustry ?? null,
          fuelType: data.fuelType ?? null,
          capacityTph: data.capacityTph ?? null,
          requiredSteamConsumption: data.requiredSteamConsumption ?? null,
          workingPressureBar: data.workingPressureBar ?? null,
          designPressureBar: data.designPressureBar ?? null,
          steamTemperatureC: data.steamTemperatureC ?? null,
          feedWaterTemperatureC: data.feedWaterTemperatureC ?? null,
          flueGasTemperatureC: data.flueGasTemperatureC ?? null,
          operatingHoursPerDay: data.operatingHoursPerDay ?? null,
          operatingDaysPerYear: data.operatingDaysPerYear ?? null,
          fuelConsumptionPerHour: data.fuelConsumptionPerHour ?? null,
          fuelCalorificValueKcalKg: data.fuelCalorificValueKcalKg ?? null,
          fuelPricePerUnit: data.fuelPricePerUnit ?? null,
          existingBoilerEfficiency: data.existingBoilerEfficiency ?? null,
          proposedBoilerEfficiency: data.proposedBoilerEfficiency ?? null,
          calculatedThermalEfficiency: engineering.calculatedThermalEfficiency,
          calculatedBoilerOutput: engineering.calculatedBoilerOutput,
          estimatedFuelSavingPerHour: engineering.estimatedFuelSavingPerHour,
          annualFuelSaving: engineering.annualFuelSaving,
          annualCostSaving: engineering.annualCostSaving,
          technicalNotes: data.technicalNotes ?? null,
          items: {
            create: totals.items.map((item) => ({
              itemType: item.itemType, description: item.description, quantity: item.quantity,
              unit: item.unit, unitRate: item.unitRate, amount: item.amount, sortOrder: item.sortOrder,
              category: item.category ?? null, process: item.process ?? null,
              testType: item.testType ?? null, logisticsType: item.logisticsType ?? null,
            })),
          },
        },
        include: estimateInclude,
      });
      await transaction.lead.update({ where: { id: data.leadId }, data: { status: "ESTIMATION" } });
      return created;
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null, action: "CREATE", entity: "Estimate", entityId: estimate.id,
        newValues: {
          estimateNumber: estimate.estimateNumber, leadId: estimate.leadId, version: estimate.version,
          status: estimate.status, stage: estimate.stage, rfqNumber: estimate.rfqNumber,
          totalAmount: estimate.totalAmount.toString(),
          productFamily: estimate.productFamily, productModel: estimate.productModel,
        },
        ipAddress: request.ip ?? null,
      },
    });
    response.status(201).json({ success: true, message: "Estimate created successfully", data: estimate });
  } catch (error) {
    console.error("Unable to create estimate:", error);
    response.status(500).json({ success: false, message: "Unable to create estimate" });
  }
};

export const updateEstimateStatusController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = updateEstimateStatusSchema.safeParse(request.body);
    if (!validation.success) { response.status(400).json({ success: false, message: "Invalid estimate status" }); return; }
    const estimateId = String(request.params.id);
    const existing = await prisma.estimate.findUnique({ where: { id: estimateId }, select: { id: true, status: true, leadId: true } });
    if (!existing) { response.status(404).json({ success: false, message: "Estimate was not found" }); return; }
    const estimate = await prisma.estimate.update({ where: { id: estimateId }, data: { status: validation.data.status }, include: estimateInclude });
    await prisma.auditLog.create({
      data: { userId: request.auth?.userId ?? null, action: "STATUS_UPDATE", entity: "Estimate", entityId: estimate.id,
        oldValues: { status: existing.status }, newValues: { status: estimate.status }, ipAddress: request.ip ?? null },
    });
    response.status(200).json({ success: true, message: "Estimate status updated successfully", data: estimate });
  } catch (error) {
    console.error("Unable to update estimate status:", error);
    response.status(500).json({ success: false, message: "Unable to update estimate status" });
  }
};

// Moves an estimate along the Boiler Costing Engine pipeline:
// RFQ -> Engineering Validation -> BOM Estimation -> Raw Material Cost ->
// Labour Cost -> Fabrication Cost -> Painting Cost -> Testing Cost ->
// Transportation Cost -> Margin Addition -> Quotation Release.
// Forward progress past Engineering Validation is blocked until that stage
// has been marked VALIDATED, and moving into Quotation Release stamps the
// releasing user and timestamp.
export const updateEstimateStageController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = updateEstimateStageSchema.safeParse(request.body);
    if (!validation.success) { response.status(400).json({ success: false, message: "Invalid estimate stage" }); return; }
    const estimateId = String(request.params.id);
    const existing = await prisma.estimate.findUnique({
      where: { id: estimateId },
      select: { id: true, stage: true, engineeringValidationStatus: true, bomEstimationCompletedAt: true },
    });
    if (!existing) { response.status(404).json({ success: false, message: "Estimate was not found" }); return; }

    const nextStage = validation.data.stage;
    const isMovingForward = stageIndex(nextStage) > stageIndex(existing.stage);

    if (isMovingForward && stageIndex(nextStage) >= stageIndex("BOM_ESTIMATION") && existing.engineeringValidationStatus !== "VALIDATED") {
      response.status(409).json({ success: false, message: "Engineering Validation must be completed (VALIDATED) before the estimate can move past that stage" });
      return;
    }

    const data: { stage: typeof nextStage; bomEstimationCompletedAt?: Date; quotationReleasedAt?: Date; quotationReleasedById?: string | null } = { stage: nextStage };
    if (nextStage === "RAW_MATERIAL_COSTING" && !existing.bomEstimationCompletedAt) {
      data.bomEstimationCompletedAt = new Date();
    }
    if (nextStage === "QUOTATION_RELEASE") {
      data.quotationReleasedAt = new Date();
      data.quotationReleasedById = request.auth?.userId ?? null;
    }

    const estimate = await prisma.estimate.update({ where: { id: estimateId }, data, include: estimateInclude });
    await prisma.auditLog.create({
      data: { userId: request.auth?.userId ?? null, action: "STAGE_UPDATE", entity: "Estimate", entityId: estimate.id,
        oldValues: { stage: existing.stage }, newValues: { stage: estimate.stage }, ipAddress: request.ip ?? null },
    });
    response.status(200).json({ success: true, message: "Estimate stage updated successfully", data: estimate });
  } catch (error) {
    console.error("Unable to update estimate stage:", error);
    response.status(500).json({ success: false, message: "Unable to update estimate stage" });
  }
};

// Stage 2: Engineering Validation of the RFQ before BOM Estimation begins.
export const updateEngineeringValidationController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = updateEngineeringValidationSchema.safeParse(request.body);
    if (!validation.success) {
      response.status(400).json({ success: false, message: "Please correct the engineering validation fields", errors: validation.error.flatten().fieldErrors });
      return;
    }
    const estimateId = String(request.params.id);
    const existing = await prisma.estimate.findUnique({ where: { id: estimateId }, select: { id: true, stage: true, engineeringValidationStatus: true } });
    if (!existing) { response.status(404).json({ success: false, message: "Estimate was not found" }); return; }

    const { engineeringValidationStatus, engineeringValidationNotes } = validation.data;
    const estimate = await prisma.estimate.update({
      where: { id: estimateId },
      data: {
        engineeringValidationStatus,
        engineeringValidationNotes: engineeringValidationNotes ?? null,
        engineeringValidatedById: request.auth?.userId ?? null,
        engineeringValidatedAt: new Date(),
        // Auto-advance from RFQ into Engineering Validation once it is actioned,
        // and on to BOM Estimation once validated.
        stage: engineeringValidationStatus === "VALIDATED" && stageIndex(existing.stage) < stageIndex("BOM_ESTIMATION")
          ? "BOM_ESTIMATION"
          : stageIndex(existing.stage) < stageIndex("ENGINEERING_VALIDATION")
            ? "ENGINEERING_VALIDATION"
            : existing.stage,
      },
      include: estimateInclude,
    });

    await prisma.auditLog.create({
      data: { userId: request.auth?.userId ?? null, action: "ENGINEERING_VALIDATION", entity: "Estimate", entityId: estimate.id,
        oldValues: { engineeringValidationStatus: existing.engineeringValidationStatus },
        newValues: { engineeringValidationStatus: estimate.engineeringValidationStatus, stage: estimate.stage },
        ipAddress: request.ip ?? null },
    });
    response.status(200).json({ success: true, message: "Engineering validation updated successfully", data: estimate });
  } catch (error) {
    console.error("Unable to update engineering validation:", error);
    response.status(500).json({ success: false, message: "Unable to update engineering validation" });
  }
};
