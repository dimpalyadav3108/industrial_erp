import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import {
  createDispatchSchema,
  updateDispatchSchema,
} from "../utils/dispatch-validation.js";

type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
  };
};

const dispatchInclude = {
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
  qualityInspection: {
    select: {
      id: true,
      inspectionNumber: true,
      inspectionType: true,
      status: true,
      inspectionDate: true,
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
} as const;

const asDate = (value?: string) => (value ? new Date(value) : null);

export const listDispatchesController = async (
  request: Request,
  response: Response
) => {
  try {
    const search =
      typeof request.query.search === "string" ? request.query.search.trim() : "";

    const dispatches = await prisma.dispatch.findMany({
      ...(search
        ? {
            where: {
              OR: [
                {
                  dispatchNumber: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  trackingNumber: {
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
      include: dispatchInclude,
      orderBy: { createdAt: "desc" },
    });

    response.status(200).json({ success: true, data: dispatches });
  } catch (error) {
    console.error("Unable to list dispatches:", error);
    response.status(500).json({
      success: false,
      message: "Unable to load dispatches",
    });
  }
};

export const getDispatchController = async (
  request: Request,
  response: Response
) => {
  try {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: String(request.params.id) },
      include: dispatchInclude,
    });

    if (!dispatch) {
      response.status(404).json({
        success: false,
        message: "Dispatch was not found",
      });
      return;
    }

    response.status(200).json({ success: true, data: dispatch });
  } catch (error) {
    console.error("Unable to load dispatch:", error);
    response.status(500).json({
      success: false,
      message: "Unable to load dispatch",
    });
  }
};

export const createDispatchController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = createDispatchSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the dispatch fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const data = validation.data;
    const inspection = await prisma.qualityInspection.findUnique({
      where: { id: data.qualityInspectionId },
      select: {
        id: true,
        productionOrderId: true,
        inspectionType: true,
        status: true,
      },
    });

    if (!inspection) {
      response.status(404).json({
        success: false,
        message: "Quality inspection was not found",
      });
      return;
    }

    if (inspection.inspectionType !== "FINAL" || inspection.status !== "PASSED") {
      response.status(400).json({
        success: false,
        message: "Dispatch requires a passed final quality inspection",
      });
      return;
    }

    const existing = await prisma.dispatch.findFirst({
      where: {
        OR: [
          { productionOrderId: inspection.productionOrderId },
          { qualityInspectionId: inspection.id },
        ],
      },
      select: { id: true },
    });

    if (existing) {
      response.status(409).json({
        success: false,
        message: "A dispatch already exists for this production order",
      });
      return;
    }

    const dispatchNumber = `DSP-${new Date().getFullYear()}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    const dispatch = await prisma.dispatch.create({
      data: {
        dispatchNumber,
        productionOrderId: inspection.productionOrderId,
        qualityInspectionId: inspection.id,
        transportMode: data.transportMode,
        expectedDeliveryDate: asDate(data.expectedDeliveryDate),
        transporterName: data.transporterName ?? null,
        vehicleNumber: data.vehicleNumber ?? null,
        trackingNumber: data.trackingNumber ?? null,
        destination: data.destination,
        contactPerson: data.contactPerson ?? null,
        contactPhone: data.contactPhone ?? null,
        packageCount: data.packageCount,
        totalWeight: data.totalWeight ?? null,
        notes: data.notes ?? null,
        createdById: request.auth?.userId ?? null,
      },
      include: dispatchInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "CREATE",
        entity: "Dispatch",
        entityId: dispatch.id,
        newValues: {
          dispatchNumber: dispatch.dispatchNumber,
          productionOrderId: dispatch.productionOrderId,
          status: dispatch.status,
          transportMode: dispatch.transportMode,
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(201).json({
      success: true,
      message: "Dispatch created successfully",
      data: dispatch,
    });
  } catch (error) {
    console.error("Unable to create dispatch:", error);
    response.status(500).json({
      success: false,
      message: "Unable to create dispatch",
    });
  }
};

export const updateDispatchController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = updateDispatchSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the dispatch update fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const dispatchId = String(request.params.id);
    const existing = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!existing) {
      response.status(404).json({
        success: false,
        message: "Dispatch was not found",
      });
      return;
    }

    const data = validation.data;
    const now = new Date();
    const statusDates =
      data.status === "DISPATCHED"
        ? { dispatchDate: existing.dispatchDate ?? now }
        : data.status === "DELIVERED"
          ? {
              dispatchDate: existing.dispatchDate ?? now,
              actualDeliveryDate: now,
            }
          : {};

    const dispatch = await prisma.dispatch.update({
      where: { id: dispatchId },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.transportMode !== undefined
          ? { transportMode: data.transportMode }
          : {}),
        ...(data.expectedDeliveryDate !== undefined
          ? { expectedDeliveryDate: asDate(data.expectedDeliveryDate) }
          : {}),
        ...(data.transporterName !== undefined
          ? { transporterName: data.transporterName }
          : {}),
        ...(data.vehicleNumber !== undefined
          ? { vehicleNumber: data.vehicleNumber }
          : {}),
        ...(data.trackingNumber !== undefined
          ? { trackingNumber: data.trackingNumber }
          : {}),
        ...(data.destination !== undefined
          ? { destination: data.destination }
          : {}),
        ...(data.contactPerson !== undefined
          ? { contactPerson: data.contactPerson }
          : {}),
        ...(data.contactPhone !== undefined
          ? { contactPhone: data.contactPhone }
          : {}),
        ...(data.packageCount !== undefined
          ? { packageCount: data.packageCount }
          : {}),
        ...(data.totalWeight !== undefined
          ? { totalWeight: data.totalWeight }
          : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...statusDates,
      },
      include: dispatchInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "UPDATE",
        entity: "Dispatch",
        entityId: dispatch.id,
        oldValues: { status: existing.status },
        newValues: { status: dispatch.status },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(200).json({
      success: true,
      message: "Dispatch updated successfully",
      data: dispatch,
    });
  } catch (error) {
    console.error("Unable to update dispatch:", error);
    response.status(500).json({
      success: false,
      message: "Unable to update dispatch",
    });
  }
};

