import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import {
  createProductionOrderSchema,
  updateProductionOperationSchema,
  updateProductionOrderSchema,
} from "../utils/production-validation.js";

type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
  };
};

const productionInclude = {
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
  assignedTo: {
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
  operations: {
    orderBy: {
      sequence: "asc" as const,
    },
  },
} as const;

const asDate = (value?: string) => (value ? new Date(value) : null);

export const listProductionOrdersController = async (
  request: Request,
  response: Response
) => {
  try {
    const search =
      typeof request.query.search === "string" ? request.query.search.trim() : "";

    const orders = await prisma.productionOrder.findMany({
      ...(search
        ? {
            where: {
              OR: [
                {
                  productionNumber: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                { title: { contains: search, mode: "insensitive" as const } },
                {
                  quotation: {
                    quotationNumber: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                },
                {
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
              ],
            },
          }
        : {}),
      include: productionInclude,
      orderBy: { createdAt: "desc" },
    });

    response.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Unable to list production orders:", error);
    response.status(500).json({
      success: false,
      message: "Unable to load production orders",
    });
  }
};

export const getProductionOrderController = async (
  request: Request,
  response: Response
) => {
  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id: String(request.params.id) },
      include: productionInclude,
    });

    if (!order) {
      response.status(404).json({
        success: false,
        message: "Production order was not found",
      });
      return;
    }

    response.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Unable to load production order:", error);
    response.status(500).json({
      success: false,
      message: "Unable to load production order",
    });
  }
};

export const createProductionOrderController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = createProductionOrderSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the production order fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const data = validation.data;
    const quotation = await prisma.quotation.findUnique({
      where: { id: data.quotationId },
      select: { id: true, status: true },
    });

    if (!quotation) {
      response.status(404).json({
        success: false,
        message: "Quotation was not found",
      });
      return;
    }

    if (quotation.status !== "ACCEPTED" && quotation.status !== "CONVERTED") {
      response.status(400).json({
        success: false,
        message: "Only an accepted quotation can create a production order",
      });
      return;
    }

    const existing = await prisma.productionOrder.findFirst({
      where: { quotationId: quotation.id },
      select: { id: true },
    });

    if (existing) {
      response.status(409).json({
        success: false,
        message: "A production order already exists for this quotation",
      });
      return;
    }

    const productionNumber = `PRO-${new Date().getFullYear()}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    const order = await prisma.$transaction(async (transaction) => {
      const created = await transaction.productionOrder.create({
        data: {
          productionNumber,
          quotationId: data.quotationId,
          title: data.title,
          priority: data.priority,
          quantity: data.quantity,
          unit: data.unit,
          plannedStartDate: asDate(data.plannedStartDate),
          plannedEndDate: asDate(data.plannedEndDate),
          assignedToId: data.assignedToId ?? null,
          createdById: request.auth?.userId ?? null,
          notes: data.notes ?? null,
          operations: {
            create: data.operations.map((operation, index) => ({
              sequence: index + 1,
              name: operation.name,
              workCenter: operation.workCenter ?? null,
              plannedStartDate: asDate(operation.plannedStartDate),
              plannedEndDate: asDate(operation.plannedEndDate),
              notes: operation.notes ?? null,
            })),
          },
        },
        include: productionInclude,
      });

      if (quotation.status === "ACCEPTED") {
        await transaction.quotation.update({
          where: { id: quotation.id },
          data: { status: "CONVERTED" },
        });
      }

      return created;
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "CREATE",
        entity: "ProductionOrder",
        entityId: order.id,
        newValues: {
          productionNumber: order.productionNumber,
          quotationId: order.quotationId,
          status: order.status,
          quantity: order.quantity.toString(),
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(201).json({
      success: true,
      message: "Production order created successfully",
      data: order,
    });
  } catch (error) {
    console.error("Unable to create production order:", error);
    response.status(500).json({
      success: false,
      message: "Unable to create production order",
    });
  }
};

export const updateProductionOrderController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = updateProductionOrderSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the production update fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const orderId = String(request.params.id);
    const existing = await prisma.productionOrder.findUnique({
      where: { id: orderId },
    });

    if (!existing) {
      response.status(404).json({
        success: false,
        message: "Production order was not found",
      });
      return;
    }

    const data = validation.data;
    const now = new Date();
    const statusDates =
      data.status === "IN_PROGRESS" && !existing.actualStartDate
        ? { actualStartDate: now }
        : data.status === "COMPLETED"
          ? {
              actualStartDate: existing.actualStartDate ?? now,
              actualEndDate: now,
              progressPercent: 100,
            }
          : {};

    const order = await prisma.productionOrder.update({
      where: { id: orderId },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.progressPercent !== undefined
          ? { progressPercent: data.progressPercent }
          : {}),
        ...(data.plannedStartDate !== undefined
          ? { plannedStartDate: asDate(data.plannedStartDate) }
          : {}),
        ...(data.plannedEndDate !== undefined
          ? { plannedEndDate: asDate(data.plannedEndDate) }
          : {}),
        ...(data.assignedToId !== undefined
          ? { assignedToId: data.assignedToId }
          : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...statusDates,
      },
      include: productionInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "UPDATE",
        entity: "ProductionOrder",
        entityId: order.id,
        oldValues: {
          status: existing.status,
          priority: existing.priority,
          progressPercent: existing.progressPercent.toString(),
        },
        newValues: {
          status: order.status,
          priority: order.priority,
          progressPercent: order.progressPercent.toString(),
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(200).json({
      success: true,
      message: "Production order updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Unable to update production order:", error);
    response.status(500).json({
      success: false,
      message: "Unable to update production order",
    });
  }
};

export const updateProductionOperationController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = updateProductionOperationSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the operation fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const operationId = String(request.params.operationId);
    const existing = await prisma.productionOperation.findUnique({
      where: { id: operationId },
    });

    if (!existing) {
      response.status(404).json({
        success: false,
        message: "Production operation was not found",
      });
      return;
    }

    const data = validation.data;
    const now = new Date();

    await prisma.$transaction(async (transaction) => {
      await transaction.productionOperation.update({
        where: { id: operationId },
        data: {
          status: data.status,
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
          ...(data.status === "IN_PROGRESS" && !existing.actualStartDate
            ? { actualStartDate: now }
            : {}),
          ...(data.status === "COMPLETED" || data.status === "SKIPPED"
            ? {
                actualStartDate: existing.actualStartDate ?? now,
                actualEndDate: now,
              }
            : {}),
        },
      });

      const operations = await transaction.productionOperation.findMany({
        where: { productionOrderId: existing.productionOrderId },
        select: { status: true },
      });
      const completed = operations.filter(
        (operation) =>
          operation.status === "COMPLETED" || operation.status === "SKIPPED"
      ).length;
      const progressPercent =
        operations.length === 0 ? 0 : Math.round((completed / operations.length) * 100);

      await transaction.productionOrder.update({
        where: { id: existing.productionOrderId },
        data: {
          progressPercent,
          ...(progressPercent === 100
            ? { status: "COMPLETED", actualEndDate: now }
            : {}),
        },
      });
    });

    const order = await prisma.productionOrder.findUnique({
      where: { id: existing.productionOrderId },
      include: productionInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "UPDATE_OPERATION",
        entity: "ProductionOrder",
        entityId: existing.productionOrderId,
        oldValues: { operationId, status: existing.status },
        newValues: { operationId, status: data.status },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(200).json({
      success: true,
      message: "Production operation updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Unable to update production operation:", error);
    response.status(500).json({
      success: false,
      message: "Unable to update production operation",
    });
  }
};

