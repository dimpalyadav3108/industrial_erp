import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import {
  createQualityInspectionSchema,
  updateQualityCheckSchema,
  updateQualityInspectionSchema,
} from "../utils/quality-validation.js";

type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
  };
};

const qualityInclude = {
  productionOrder: {
    include: {
      quotation: {
        include: {
          estimate: {
            include: {
              lead: {
                include: {
                  customer: true,
                },
              },
            },
          },
        },
      },
    },
  },
  inspector: {
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
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
  checks: {
    orderBy: {
      sequence: "asc" as const,
    },
  },
} as const;

const asDate = (value?: string) => (value ? new Date(value) : null);

export const listQualityInspectionsController = async (
  request: Request,
  response: Response
) => {
  try {
    const search =
      typeof request.query.search === "string" ? request.query.search.trim() : "";

    const inspections = await prisma.qualityInspection.findMany({
      ...(search
        ? {
            where: {
              OR: [
                {
                  inspectionNumber: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  productionOrder: {
                    productionNumber: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                },
                {
                  productionOrder: {
                    title: { contains: search, mode: "insensitive" as const },
                  },
                },
                {
                  productionOrder: {
                    quotation: {
                      estimate: {
                        lead: {
                          customer: {
                            companyName: {
                              contains: search,
                              mode: "insensitive" as const,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              ],
            },
          }
        : {}),
      include: qualityInclude,
      orderBy: { createdAt: "desc" },
    });

    response.status(200).json({ success: true, data: inspections });
  } catch (error) {
    console.error("Unable to list quality inspections:", error);
    response.status(500).json({
      success: false,
      message: "Unable to load quality inspections",
    });
  }
};

export const getQualityInspectionController = async (
  request: Request,
  response: Response
) => {
  try {
    const inspection = await prisma.qualityInspection.findUnique({
      where: { id: String(request.params.id) },
      include: qualityInclude,
    });

    if (!inspection) {
      response.status(404).json({
        success: false,
        message: "Quality inspection was not found",
      });
      return;
    }

    response.status(200).json({ success: true, data: inspection });
  } catch (error) {
    console.error("Unable to load quality inspection:", error);
    response.status(500).json({
      success: false,
      message: "Unable to load quality inspection",
    });
  }
};

export const createQualityInspectionController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = createQualityInspectionSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the quality inspection fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const data = validation.data;
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: data.productionOrderId },
      select: { id: true, status: true },
    });

    if (!productionOrder) {
      response.status(404).json({
        success: false,
        message: "Production order was not found",
      });
      return;
    }

    if (productionOrder.status === "CANCELLED") {
      response.status(400).json({
        success: false,
        message: "A cancelled production order cannot be inspected",
      });
      return;
    }

    const duplicate = await prisma.qualityInspection.findUnique({
      where: {
        productionOrderId_inspectionType: {
          productionOrderId: data.productionOrderId,
          inspectionType: data.inspectionType,
        },
      },
      select: { id: true },
    });

    if (duplicate) {
      response.status(409).json({
        success: false,
        message: "This inspection type already exists for the production order",
      });
      return;
    }

    const inspectionNumber = `QIN-${new Date().getFullYear()}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    const inspection = await prisma.qualityInspection.create({
      data: {
        inspectionNumber,
        productionOrderId: data.productionOrderId,
        inspectionType: data.inspectionType,
        scheduledDate: asDate(data.scheduledDate),
        inspectorId: data.inspectorId ?? null,
        createdById: request.auth?.userId ?? null,
        remarks: data.remarks ?? null,
        checks: {
          create: data.checks.map((check, index) => ({
            sequence: index + 1,
            parameter: check.parameter,
            specification: check.specification ?? null,
          })),
        },
      },
      include: qualityInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "CREATE",
        entity: "QualityInspection",
        entityId: inspection.id,
        newValues: {
          inspectionNumber: inspection.inspectionNumber,
          productionOrderId: inspection.productionOrderId,
          inspectionType: inspection.inspectionType,
          status: inspection.status,
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(201).json({
      success: true,
      message: "Quality inspection created successfully",
      data: inspection,
    });
  } catch (error) {
    console.error("Unable to create quality inspection:", error);
    response.status(500).json({
      success: false,
      message: "Unable to create quality inspection",
    });
  }
};

export const updateQualityInspectionController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = updateQualityInspectionSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the inspection update fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const inspectionId = String(request.params.id);
    const existing = await prisma.qualityInspection.findUnique({
      where: { id: inspectionId },
    });

    if (!existing) {
      response.status(404).json({
        success: false,
        message: "Quality inspection was not found",
      });
      return;
    }

    const data = validation.data;
    const finalStatus =
      data.status === "PASSED" || data.status === "FAILED";
    const inspection = await prisma.qualityInspection.update({
      where: { id: inspectionId },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.scheduledDate !== undefined
          ? { scheduledDate: asDate(data.scheduledDate) }
          : {}),
        ...(data.inspectorId !== undefined
          ? { inspectorId: data.inspectorId }
          : {}),
        ...(data.remarks !== undefined ? { remarks: data.remarks } : {}),
        ...(data.failureReason !== undefined
          ? { failureReason: data.failureReason }
          : {}),
        ...(finalStatus ? { inspectionDate: new Date() } : {}),
      },
      include: qualityInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "UPDATE",
        entity: "QualityInspection",
        entityId: inspection.id,
        oldValues: { status: existing.status },
        newValues: { status: inspection.status },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(200).json({
      success: true,
      message: "Quality inspection updated successfully",
      data: inspection,
    });
  } catch (error) {
    console.error("Unable to update quality inspection:", error);
    response.status(500).json({
      success: false,
      message: "Unable to update quality inspection",
    });
  }
};

export const updateQualityCheckController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = updateQualityCheckSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the checklist result",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const checkId = String(request.params.checkId);
    const existing = await prisma.qualityCheckItem.findUnique({
      where: { id: checkId },
    });

    if (!existing) {
      response.status(404).json({
        success: false,
        message: "Quality checklist item was not found",
      });
      return;
    }

    const data = validation.data;
    await prisma.$transaction(async (transaction) => {
      await transaction.qualityCheckItem.update({
        where: { id: checkId },
        data: {
          result: data.result,
          observedValue: data.observedValue ?? null,
          remarks: data.remarks ?? null,
        },
      });

      const checks = await transaction.qualityCheckItem.findMany({
        where: { qualityInspectionId: existing.qualityInspectionId },
        select: { result: true },
      });
      const hasFailure = checks.some((check) => check.result === "FAIL");
      const allFinished = checks.every((check) =>
        ["PASS", "FAIL", "NOT_APPLICABLE"].includes(check.result)
      );
      const nextStatus = hasFailure
        ? "FAILED"
        : allFinished
          ? "PASSED"
          : "IN_PROGRESS";

      await transaction.qualityInspection.update({
        where: { id: existing.qualityInspectionId },
        data: {
          status: nextStatus,
          ...(allFinished || hasFailure ? { inspectionDate: new Date() } : {}),
        },
      });
    });

    const inspection = await prisma.qualityInspection.findUnique({
      where: { id: existing.qualityInspectionId },
      include: qualityInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "UPDATE_CHECK",
        entity: "QualityInspection",
        entityId: existing.qualityInspectionId,
        oldValues: { checkId, result: existing.result },
        newValues: { checkId, result: data.result },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(200).json({
      success: true,
      message: "Quality checklist updated successfully",
      data: inspection,
    });
  } catch (error) {
    console.error("Unable to update quality checklist:", error);
    response.status(500).json({
      success: false,
      message: "Unable to update quality checklist",
    });
  }
};

