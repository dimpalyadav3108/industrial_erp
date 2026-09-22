import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import {
  createDrawingRevisionSchema,
  createEngineeringDrawingSchema,
  createEngineeringProjectSchema,
  updateDrawingRevisionSchema,
  updateEngineeringProjectSchema,
} from "../utils/engineering-validation.js";

type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
  };
};

const userSummary = {
  id: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
} as const;

const revisionInclude = {
  createdBy: { select: userSummary },
  approvedBy: { select: userSummary },
} as const;

const drawingInclude = {
  createdBy: { select: userSummary },
  revisions: {
    include: revisionInclude,
    orderBy: { revisionNumber: "desc" as const },
  },
} as const;

const projectInclude = {
  quotation: {
    include: {
      estimate: {
        include: {
          lead: {
            include: { customer: true },
          },
        },
      },
    },
  },
  createdBy: { select: userSummary },
  drawings: {
    include: drawingInclude,
    orderBy: [{ category: "asc" as const }, { drawingNumber: "asc" as const }],
  },
};

const asDate = (value?: string) => (value ? new Date(value) : null);

export const listEngineeringProjectsController = async (
  request: Request,
  response: Response
) => {
  try {
    const search =
      typeof request.query.search === "string" ? request.query.search.trim() : "";

    const projects = await prisma.engineeringProject.findMany({
      ...(search
        ? {
            where: {
              OR: [
                {
                  engineeringNumber: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                { title: { contains: search, mode: "insensitive" as const } },
                {
                  productFamily: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
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
      include: projectInclude,
      orderBy: { createdAt: "desc" },
    });

    response.status(200).json({ success: true, data: projects });
  } catch (error) {
    console.error("Unable to list engineering projects:", error);
    response.status(500).json({
      success: false,
      message: "Unable to load engineering projects",
    });
  }
};

export const getEngineeringProjectController = async (
  request: Request,
  response: Response
) => {
  try {
    const project = await prisma.engineeringProject.findUnique({
      where: { id: String(request.params.id) },
      include: projectInclude,
    });

    if (!project) {
      response.status(404).json({
        success: false,
        message: "Engineering project was not found",
      });
      return;
    }

    response.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error("Unable to load engineering project:", error);
    response.status(500).json({
      success: false,
      message: "Unable to load engineering project",
    });
  }
};

export const createEngineeringProjectController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = createEngineeringProjectSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the engineering project fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const data = validation.data;
    const quotation = await prisma.quotation.findUnique({
      where: { id: data.quotationId },
      select: { id: true, status: true, engineeringProject: { select: { id: true } } },
    });

    if (!quotation) {
      response.status(404).json({ success: false, message: "Quotation was not found" });
      return;
    }

    if (quotation.status !== "ACCEPTED" && quotation.status !== "CONVERTED") {
      response.status(400).json({
        success: false,
        message: "Only an accepted quotation can create an engineering project",
      });
      return;
    }

    if (quotation.engineeringProject) {
      response.status(409).json({
        success: false,
        message: "An engineering project already exists for this quotation",
      });
      return;
    }

    const engineeringNumber = `ENG-${new Date().getFullYear()}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    const project = await prisma.engineeringProject.create({
      data: {
        engineeringNumber,
        quotationId: data.quotationId,
        title: data.title,
        productFamily: data.productFamily ?? null,
        productModel: data.productModel ?? null,
        plannedStartDate: asDate(data.plannedStartDate),
        plannedReleaseDate: asDate(data.plannedReleaseDate),
        notes: data.notes ?? null,
        createdById: request.auth?.userId ?? null,
      },
      include: projectInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "CREATE",
        entity: "EngineeringProject",
        entityId: project.id,
        newValues: {
          engineeringNumber: project.engineeringNumber,
          quotationId: project.quotationId,
          status: project.status,
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(201).json({
      success: true,
      message: "Engineering project created successfully",
      data: project,
    });
  } catch (error) {
    console.error("Unable to create engineering project:", error);
    response.status(500).json({
      success: false,
      message: "Unable to create engineering project",
    });
  }
};

export const updateEngineeringProjectController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = updateEngineeringProjectSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the engineering project fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const projectId = String(request.params.id);
    const existing = await prisma.engineeringProject.findUnique({
      where: { id: projectId },
    });

    if (!existing) {
      response.status(404).json({
        success: false,
        message: "Engineering project was not found",
      });
      return;
    }

    const data = validation.data;
    const project = await prisma.engineeringProject.update({
      where: { id: projectId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.productFamily !== undefined
          ? { productFamily: data.productFamily ?? null }
          : {}),
        ...(data.productModel !== undefined
          ? { productModel: data.productModel ?? null }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.plannedStartDate !== undefined
          ? { plannedStartDate: asDate(data.plannedStartDate) }
          : {}),
        ...(data.plannedReleaseDate !== undefined
          ? { plannedReleaseDate: asDate(data.plannedReleaseDate) }
          : {}),
        ...(data.notes !== undefined ? { notes: data.notes ?? null } : {}),
        ...(data.status === "RELEASED" && !existing.actualReleaseDate
          ? { actualReleaseDate: new Date() }
          : {}),
      },
      include: projectInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "UPDATE",
        entity: "EngineeringProject",
        entityId: project.id,
        oldValues: { status: existing.status, title: existing.title },
        newValues: { status: project.status, title: project.title },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(200).json({
      success: true,
      message: "Engineering project updated successfully",
      data: project,
    });
  } catch (error) {
    console.error("Unable to update engineering project:", error);
    response.status(500).json({
      success: false,
      message: "Unable to update engineering project",
    });
  }
};

export const createEngineeringDrawingController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = createEngineeringDrawingSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the drawing fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const data = validation.data;
    const project = await prisma.engineeringProject.findUnique({
      where: { id: data.projectId },
      select: { id: true, status: true },
    });

    if (!project) {
      response.status(404).json({
        success: false,
        message: "Engineering project was not found",
      });
      return;
    }

    if (project.status === "RELEASED" || project.status === "CANCELLED") {
      response.status(400).json({
        success: false,
        message: "Drawings cannot be added to a released or cancelled project",
      });
      return;
    }

    const duplicate = await prisma.engineeringDrawing.findUnique({
      where: {
        projectId_drawingNumber: {
          projectId: data.projectId,
          drawingNumber: data.drawingNumber,
        },
      },
      select: { id: true },
    });

    if (duplicate) {
      response.status(409).json({
        success: false,
        message: "This drawing number already exists in the project",
      });
      return;
    }

    const drawing = await prisma.engineeringDrawing.create({
      data: {
        projectId: data.projectId,
        drawingNumber: data.drawingNumber,
        title: data.title,
        category: data.category,
        description: data.description ?? null,
        createdById: request.auth?.userId ?? null,
        revisions: {
          create: {
            revisionNumber: 0,
            documentName: data.documentName ?? null,
            documentUrl: data.documentUrl ?? null,
            changeReason: data.changeReason,
            createdById: request.auth?.userId ?? null,
          },
        },
      },
      include: drawingInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "CREATE",
        entity: "EngineeringDrawing",
        entityId: drawing.id,
        newValues: {
          projectId: drawing.projectId,
          drawingNumber: drawing.drawingNumber,
          category: drawing.category,
          revisionNumber: 0,
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(201).json({
      success: true,
      message: "Engineering drawing created successfully",
      data: drawing,
    });
  } catch (error) {
    console.error("Unable to create engineering drawing:", error);
    response.status(500).json({
      success: false,
      message: "Unable to create engineering drawing",
    });
  }
};

export const createDrawingRevisionController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = createDrawingRevisionSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the drawing revision fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const drawingId = String(request.params.drawingId);
    const drawing = await prisma.engineeringDrawing.findUnique({
      where: { id: drawingId },
      include: { project: { select: { status: true } } },
    });

    if (!drawing) {
      response.status(404).json({ success: false, message: "Drawing was not found" });
      return;
    }

    if (drawing.project.status === "RELEASED" || drawing.project.status === "CANCELLED") {
      response.status(400).json({
        success: false,
        message: "Revisions cannot be added to a released or cancelled project",
      });
      return;
    }

    const revisionNumber = drawing.currentRevision + 1;
    const data = validation.data;

    const revision = await prisma.$transaction(async (transaction) => {
      const created = await transaction.engineeringDrawingRevision.create({
        data: {
          drawingId,
          revisionNumber,
          documentName: data.documentName ?? null,
          documentUrl: data.documentUrl ?? null,
          changeReason: data.changeReason,
          createdById: request.auth?.userId ?? null,
        },
        include: revisionInclude,
      });

      await transaction.engineeringDrawing.update({
        where: { id: drawingId },
        data: { currentRevision: revisionNumber, status: "DRAFT" },
      });

      return created;
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "CREATE_REVISION",
        entity: "EngineeringDrawing",
        entityId: drawingId,
        newValues: { revisionNumber, changeReason: revision.changeReason },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(201).json({
      success: true,
      message: "Drawing revision created successfully",
      data: revision,
    });
  } catch (error) {
    console.error("Unable to create drawing revision:", error);
    response.status(500).json({
      success: false,
      message: "Unable to create drawing revision",
    });
  }
};

export const updateDrawingRevisionController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = updateDrawingRevisionSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the revision approval fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const revisionId = String(request.params.revisionId);
    const existing = await prisma.engineeringDrawingRevision.findUnique({
      where: { id: revisionId },
      include: { drawing: true },
    });

    if (!existing) {
      response.status(404).json({
        success: false,
        message: "Drawing revision was not found",
      });
      return;
    }

    const data = validation.data;
    const targetStatus = data.status ?? existing.status;

    if (data.customerApproved === true && targetStatus !== "APPROVED") {
      response.status(400).json({
        success: false,
        message: "A revision must be internally approved before customer approval",
      });
      return;
    }

    const now = new Date();
    const revision = await prisma.$transaction(async (transaction) => {
      if (data.status === "APPROVED") {
        await transaction.engineeringDrawingRevision.updateMany({
          where: {
            drawingId: existing.drawingId,
            id: { not: existing.id },
            status: "APPROVED",
          },
          data: { status: "SUPERSEDED" },
        });
      }

      const updated = await transaction.engineeringDrawingRevision.update({
        where: { id: revisionId },
        data: {
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.status === "INTERNAL_REVIEW" || data.status === "CUSTOMER_REVIEW"
            ? { submittedAt: existing.submittedAt ?? now }
            : {}),
          ...(data.status === "APPROVED"
            ? {
                approvedAt: now,
                approvedById: request.auth?.userId ?? null,
              }
            : {}),
          ...(data.customerApproved !== undefined
            ? {
                customerApproved: data.customerApproved,
                customerApprovedAt: data.customerApproved ? now : null,
              }
            : {}),
        },
        include: revisionInclude,
      });

      await transaction.engineeringDrawing.update({
        where: { id: existing.drawingId },
        data: {
          status: updated.status,
          currentRevision: Math.max(
            existing.drawing.currentRevision,
            updated.revisionNumber
          ),
        },
      });

      return updated;
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "UPDATE_REVISION",
        entity: "EngineeringDrawing",
        entityId: existing.drawingId,
        oldValues: {
          revisionNumber: existing.revisionNumber,
          status: existing.status,
          customerApproved: existing.customerApproved,
        },
        newValues: {
          revisionNumber: revision.revisionNumber,
          status: revision.status,
          customerApproved: revision.customerApproved,
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(200).json({
      success: true,
      message: "Drawing revision updated successfully",
      data: revision,
    });
  } catch (error) {
    console.error("Unable to update drawing revision:", error);
    response.status(500).json({
      success: false,
      message: "Unable to update drawing revision",
    });
  }
};
