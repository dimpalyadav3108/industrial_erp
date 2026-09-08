import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import {
  createEstimateSchema,
  updateEstimateStatusSchema,
  type CreateEstimateInput,
} from "../utils/estimate-validation.js";

type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
  };
};

const estimateInclude = {
  lead: {
    select: {
      id: true,
      leadNumber: true,
      title: true,
      status: true,
      customer: {
        select: {
          id: true,
          customerCode: true,
          companyName: true,
        },
      },
    },
  },
  createdBy: {
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
    },
  },
  items: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
} as const;

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const calculateEstimate = (data: CreateEstimateInput) => {
  const items = data.items.map((item, index) => ({
    ...item,
    amount: roundMoney(item.quantity * item.unitRate),
    sortOrder: index,
  }));

  const materialCost = roundMoney(
    items
      .filter((item) => item.itemType === "MATERIAL")
      .reduce((total, item) => total + item.amount, 0)
  );
  const labourCost = roundMoney(
    items
      .filter((item) => item.itemType === "LABOUR")
      .reduce((total, item) => total + item.amount, 0)
  );
  const overheadCost = roundMoney(
    items
      .filter((item) =>
        item.itemType === "OVERHEAD" || item.itemType === "SERVICE"
      )
      .reduce((total, item) => total + item.amount, 0)
  );
  const baseCost = roundMoney(materialCost + labourCost + overheadCost);
  const marginAmount = roundMoney(baseCost * (data.marginPercent / 100));
  const subtotal = roundMoney(baseCost + marginAmount);
  const taxAmount = roundMoney(subtotal * (data.taxPercent / 100));
  const totalAmount = roundMoney(subtotal + taxAmount);

  return {
    items,
    materialCost,
    labourCost,
    overheadCost,
    subtotal,
    taxAmount,
    totalAmount,
  };
};

export const listEstimatesController = async (
  request: Request,
  response: Response
) => {
  try {
    const search =
      typeof request.query.search === "string" ? request.query.search.trim() : "";

    const estimates = await prisma.estimate.findMany({
      ...(search
        ? {
            where: {
              OR: [
                {
                  estimateNumber: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  lead: {
                    title: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                },
                {
                  lead: {
                    customer: {
                      companyName: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                },
              ],
            },
          }
        : {}),
      include: estimateInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    response.status(200).json({ success: true, data: estimates });
  } catch (error) {
    console.error("Unable to list estimates:", error);
    response.status(500).json({ success: false, message: "Unable to load estimates" });
  }
};

export const getEstimateController = async (
  request: Request,
  response: Response
) => {
  try {
    const estimate = await prisma.estimate.findUnique({
      where: { id: String(request.params.id) },
      include: estimateInclude,
    });

    if (!estimate) {
      response.status(404).json({ success: false, message: "Estimate was not found" });
      return;
    }

    response.status(200).json({ success: true, data: estimate });
  } catch (error) {
    console.error("Unable to load estimate:", error);
    response.status(500).json({ success: false, message: "Unable to load estimate" });
  }
};

export const createEstimateController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = createEstimateSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the estimate fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const data = validation.data;
    const lead = await prisma.lead.findUnique({
      where: { id: data.leadId },
      select: { id: true },
    });

    if (!lead) {
      response.status(404).json({ success: false, message: "Selected lead was not found" });
      return;
    }

    const latestVersion = await prisma.estimate.aggregate({
      where: { leadId: data.leadId },
      _max: { version: true },
    });
    const version = (latestVersion._max.version ?? 0) + 1;
    const totals = calculateEstimate(data);
    const estimateNumber = `EST-${new Date().getFullYear()}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    const estimate = await prisma.$transaction(async (transaction) => {
      const created = await transaction.estimate.create({
        data: {
          estimateNumber,
          leadId: data.leadId,
          version,
          status: data.status,
          marginPercent: data.marginPercent,
          taxPercent: data.taxPercent,
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          notes: data.notes ?? null,
          createdById: request.auth?.userId ?? null,
          materialCost: totals.materialCost,
          labourCost: totals.labourCost,
          overheadCost: totals.overheadCost,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          totalAmount: totals.totalAmount,
          items: {
            create: totals.items,
          },
        },
        include: estimateInclude,
      });

      await transaction.lead.update({
        where: { id: data.leadId },
        data: { status: "ESTIMATION" },
      });

      return created;
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "CREATE",
        entity: "Estimate",
        entityId: estimate.id,
        newValues: {
          estimateNumber: estimate.estimateNumber,
          leadId: estimate.leadId,
          version: estimate.version,
          status: estimate.status,
          totalAmount: estimate.totalAmount.toString(),
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(201).json({
      success: true,
      message: "Estimate created successfully",
      data: estimate,
    });
  } catch (error) {
    console.error("Unable to create estimate:", error);
    response.status(500).json({ success: false, message: "Unable to create estimate" });
  }
};

export const updateEstimateStatusController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = updateEstimateStatusSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({ success: false, message: "Invalid estimate status" });
      return;
    }

    const estimateId = String(request.params.id);
    const existing = await prisma.estimate.findUnique({
      where: { id: estimateId },
      select: { id: true, status: true, leadId: true },
    });

    if (!existing) {
      response.status(404).json({ success: false, message: "Estimate was not found" });
      return;
    }

    const estimate = await prisma.estimate.update({
      where: { id: estimateId },
      data: { status: validation.data.status },
      include: estimateInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "STATUS_UPDATE",
        entity: "Estimate",
        entityId: estimate.id,
        oldValues: { status: existing.status },
        newValues: { status: estimate.status },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(200).json({
      success: true,
      message: "Estimate status updated successfully",
      data: estimate,
    });
  } catch (error) {
    console.error("Unable to update estimate status:", error);
    response.status(500).json({ success: false, message: "Unable to update estimate status" });
  }
};
