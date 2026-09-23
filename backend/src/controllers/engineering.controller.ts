import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import {
  createDrawingRevisionSchema,
  createEngineeringBomItemSchema,
  createEngineeringBomSchema,
  createEngineeringDrawingSchema,
  createEngineeringProjectSchema,
  updateDrawingRevisionSchema,
  updateEngineeringBomItemSchema,
  updateEngineeringBomSchema,
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

const bomItemInclude = {
  inventoryItem: {
    select: {
      id: true,
      itemCode: true,
      name: true,
      itemType: true,
      unit: true,
    },
  },
} as const;

const bomInclude = {
  createdBy: { select: userSummary },
  approvedBy: { select: userSummary },
  items: {
    include: bomItemInclude,
    orderBy: [{ sortOrder: "asc" as const }, { itemNumber: "asc" as const }],
  },
};

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
  boms: {
    include: bomInclude,
    orderBy: { createdAt: "desc" as const },
  },
  documents: {
    include: { modifiedBy: { select: userSummary }, approvedBy: { select: userSummary } },
    orderBy: { modifiedAt: "desc" as const },
  },
  ecrs: {
    include: { createdBy: { select: userSummary }, approvedBy: { select: userSummary } },
    orderBy: { createdAt: "desc" as const },
  },
};

const asDate = (value?: string) => (value ? new Date(value) : null);
const versionLabelForRevision = (revisionNumber: number) =>
  revisionNumber === 0 ? "V1.0" : revisionNumber === 1 ? "V1.1" : `V${Math.floor(revisionNumber / 2) + 1}.${revisionNumber % 2}`;

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
            versionLabel: "V1.0",
            documentName: data.documentName ?? null,
            documentUrl: data.documentUrl ?? null,
            changeReason: data.changeReason,
            modifiedById: request.auth?.userId ?? null,
            modifiedAt: new Date(),
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
          versionLabel: versionLabelForRevision(revisionNumber),
          documentName: data.documentName ?? null,
          documentUrl: data.documentUrl ?? null,
          changeReason: data.changeReason,
          modifiedById: request.auth?.userId ?? null,
          modifiedAt: new Date(),
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
          modifiedById: request.auth?.userId ?? (existing as any).modifiedById ?? null,
          modifiedAt: now,
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

      if (data.customerApproved === true) {
        await transaction.engineeringProject.update({
          where: { id: existing.drawing.projectId },
          data: { customerApprovedVersion: (updated as any).versionLabel, customerApprovalAt: now, status: "APPROVED", workflowStage: "CUSTOMER_APPROVAL" },
        });
      }

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

const allowedBomTransitions = {
  DRAFT: ["IN_REVIEW", "CANCELLED"],
  IN_REVIEW: ["DRAFT", "APPROVED", "CANCELLED"],
  APPROVED: ["RELEASED", "DRAFT", "CANCELLED"],
  RELEASED: ["SUPERSEDED"],
  SUPERSEDED: [],
  CANCELLED: [],
} as const;

const isAllowedBomTransition = (
  currentStatus: keyof typeof allowedBomTransitions,
  targetStatus: string
) =>
  (allowedBomTransitions[currentStatus] as readonly string[]).includes(
    targetStatus
  );

export const listEngineeringBomsController = async (
  request: Request,
  response: Response
) => {
  try {
    const projectId =
      typeof request.query.projectId === "string"
        ? request.query.projectId.trim()
        : "";

    const boms = await prisma.engineeringBom.findMany({
      ...(projectId ? { where: { projectId } } : {}),
      include: bomInclude,
      orderBy: { createdAt: "desc" },
    });

    response.status(200).json({ success: true, data: boms });
  } catch (error) {
    console.error("Unable to list engineering BOMs:", error);
    response.status(500).json({
      success: false,
      message: "Unable to load engineering BOMs",
    });
  }
};

export const getEngineeringBomController = async (
  request: Request,
  response: Response
) => {
  try {
    const bom = await prisma.engineeringBom.findUnique({
      where: { id: String(request.params.bomId) },
      include: bomInclude,
    });

    if (!bom) {
      response.status(404).json({
        success: false,
        message: "Engineering BOM was not found",
      });
      return;
    }

    response.status(200).json({ success: true, data: bom });
  } catch (error) {
    console.error("Unable to load engineering BOM:", error);
    response.status(500).json({
      success: false,
      message: "Unable to load engineering BOM",
    });
  }
};

export const createEngineeringBomController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = createEngineeringBomSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the BOM fields",
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
        message: "BOMs cannot be added to a released or cancelled project",
      });
      return;
    }

    const duplicate = await prisma.engineeringBom.findUnique({
      where: { bomNumber: data.bomNumber },
      select: { id: true },
    });

    if (duplicate) {
      response.status(409).json({
        success: false,
        message: "This BOM number already exists",
      });
      return;
    }

    const bom = await prisma.engineeringBom.create({
      data: {
        projectId: data.projectId,
        bomNumber: data.bomNumber,
        name: data.name,
        revision: data.revision ?? 0,
        description: data.description ?? null,
        createdById: request.auth?.userId ?? null,
      },
      include: bomInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "CREATE",
        entity: "EngineeringBom",
        entityId: bom.id,
        newValues: {
          projectId: bom.projectId,
          bomNumber: bom.bomNumber,
          revision: bom.revision,
          status: bom.status,
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(201).json({
      success: true,
      message: "Engineering BOM created successfully",
      data: bom,
    });
  } catch (error) {
    console.error("Unable to create engineering BOM:", error);
    response.status(500).json({
      success: false,
      message: "Unable to create engineering BOM",
    });
  }
};

export const updateEngineeringBomController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = updateEngineeringBomSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the BOM fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const bomId = String(request.params.bomId);
    const existing = await prisma.engineeringBom.findUnique({
      where: { id: bomId },
    });

    if (!existing) {
      response.status(404).json({
        success: false,
        message: "Engineering BOM was not found",
      });
      return;
    }

    const data = validation.data;

    if (
      data.status !== undefined &&
      data.status !== existing.status &&
      !isAllowedBomTransition(existing.status, data.status)
    ) {
      response.status(400).json({
        success: false,
        message: `BOM status cannot change from ${existing.status} to ${data.status}`,
      });
      return;
    }

    const changingContent =
      data.name !== undefined ||
      data.revision !== undefined ||
      data.description !== undefined;

    if (
      changingContent &&
      (existing.status === "RELEASED" ||
        existing.status === "SUPERSEDED" ||
        existing.status === "CANCELLED")
    ) {
      response.status(400).json({
        success: false,
        message: "Released, superseded, or cancelled BOM content cannot be edited",
      });
      return;
    }

    const now = new Date();

    const bom = await prisma.engineeringBom.update({
      where: { id: bomId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.revision !== undefined ? { revision: data.revision } : {}),
        ...(data.description !== undefined
          ? { description: data.description ?? null }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.status === "APPROVED"
          ? {
              approvedAt: now,
              approvedById: request.auth?.userId ?? null,
            }
          : {}),
        ...(data.status === "RELEASED" ? { releasedAt: now } : {}),
        ...(data.status === "DRAFT"
          ? {
              approvedAt: null,
              approvedById: null,
              releasedAt: null,
            }
          : {}),
      },
      include: bomInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "UPDATE",
        entity: "EngineeringBom",
        entityId: bom.id,
        oldValues: {
          name: existing.name,
          revision: existing.revision,
          status: existing.status,
        },
        newValues: {
          name: bom.name,
          revision: bom.revision,
          status: bom.status,
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(200).json({
      success: true,
      message: "Engineering BOM updated successfully",
      data: bom,
    });
  } catch (error) {
    console.error("Unable to update engineering BOM:", error);
    response.status(500).json({
      success: false,
      message: "Unable to update engineering BOM",
    });
  }
};

export const createEngineeringBomItemController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = createEngineeringBomItemSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the BOM item fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const bomId = String(request.params.bomId);
    const bom = await prisma.engineeringBom.findUnique({
      where: { id: bomId },
      select: { id: true, status: true },
    });

    if (!bom) {
      response.status(404).json({
        success: false,
        message: "Engineering BOM was not found",
      });
      return;
    }

    if (bom.status !== "DRAFT") {
      response.status(400).json({
        success: false,
        message: "BOM items can only be added while the BOM is in DRAFT status",
      });
      return;
    }

    const data = validation.data;

    if (data.parentItemId) {
      const parent = await prisma.engineeringBomItem.findUnique({
        where: { id: data.parentItemId },
        select: { id: true, bomId: true },
      });

      if (!parent || parent.bomId !== bomId) {
        response.status(400).json({
          success: false,
          message: "Parent item must belong to the same BOM",
        });
        return;
      }
    }

    if (data.inventoryItemId) {
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { id: data.inventoryItemId },
        select: { id: true, isActive: true },
      });

      if (!inventoryItem || !inventoryItem.isActive) {
        response.status(400).json({
          success: false,
          message: "Select a valid active inventory item",
        });
        return;
      }
    }

    const duplicateItemNumber = await prisma.engineeringBomItem.findUnique({
      where: {
        bomId_itemNumber: {
          bomId,
          itemNumber: data.itemNumber,
        },
      },
      select: { id: true },
    });

    if (duplicateItemNumber) {
      response.status(409).json({
        success: false,
        message: "This item number already exists in the BOM",
      });
      return;
    }

    const item = await prisma.engineeringBomItem.create({
      data: {
        bomId,
        parentItemId: data.parentItemId ?? null,
        inventoryItemId: data.inventoryItemId ?? null,
        itemNumber: data.itemNumber,
        name: data.name,
        description: data.description ?? null,
        quantity: data.quantity,
        unit: data.unit,
        source: data.source,
        materialSpec: data.materialSpec ?? null,
        alternateMaterial: data.alternateMaterial ?? null,
        unitCost: data.unitCost ?? null,
        drawingNumber: data.drawingNumber ?? null,
        remarks: data.remarks ?? null,
        sortOrder: data.sortOrder ?? 0,
      },
      include: bomItemInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "CREATE",
        entity: "EngineeringBomItem",
        entityId: item.id,
        newValues: {
          bomId,
          itemNumber: item.itemNumber,
          name: item.name,
          quantity: item.quantity.toString(),
          source: item.source,
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(201).json({
      success: true,
      message: "BOM item added successfully",
      data: item,
    });
  } catch (error) {
    console.error("Unable to create engineering BOM item:", error);
    response.status(500).json({
      success: false,
      message: "Unable to add BOM item",
    });
  }
};

export const updateEngineeringBomItemController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = updateEngineeringBomItemSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the BOM item fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const itemId = String(request.params.itemId);
    const existing = await prisma.engineeringBomItem.findUnique({
      where: { id: itemId },
      include: {
        bom: { select: { id: true, status: true } },
      },
    });

    if (!existing) {
      response.status(404).json({
        success: false,
        message: "BOM item was not found",
      });
      return;
    }

    if (existing.bom.status !== "DRAFT") {
      response.status(400).json({
        success: false,
        message: "BOM items can only be edited while the BOM is in DRAFT status",
      });
      return;
    }

    const data = validation.data;

    if (data.parentItemId === itemId) {
      response.status(400).json({
        success: false,
        message: "A BOM item cannot be its own parent",
      });
      return;
    }

    if (data.parentItemId) {
      const parent = await prisma.engineeringBomItem.findUnique({
        where: { id: data.parentItemId },
        select: { id: true, bomId: true, parentItemId: true },
      });

      if (!parent || parent.bomId !== existing.bomId) {
        response.status(400).json({
          success: false,
          message: "Parent item must belong to the same BOM",
        });
        return;
      }

      let ancestorId: string | null = parent.parentItemId;
      while (ancestorId) {
        if (ancestorId === itemId) {
          response.status(400).json({
            success: false,
            message: "This parent selection would create a circular BOM hierarchy",
          });
          return;
        }

        const ancestor = await prisma.engineeringBomItem.findUnique({
          where: { id: ancestorId },
          select: { parentItemId: true },
        });

        ancestorId = ancestor?.parentItemId ?? null;
      }
    }

    if (data.inventoryItemId) {
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { id: data.inventoryItemId },
        select: { id: true, isActive: true },
      });

      if (!inventoryItem || !inventoryItem.isActive) {
        response.status(400).json({
          success: false,
          message: "Select a valid active inventory item",
        });
        return;
      }
    }

    if (
      data.itemNumber !== undefined &&
      data.itemNumber !== existing.itemNumber
    ) {
      const duplicate = await prisma.engineeringBomItem.findUnique({
        where: {
          bomId_itemNumber: {
            bomId: existing.bomId,
            itemNumber: data.itemNumber,
          },
        },
        select: { id: true },
      });

      if (duplicate) {
        response.status(409).json({
          success: false,
          message: "This item number already exists in the BOM",
        });
        return;
      }
    }

    const item = await prisma.engineeringBomItem.update({
      where: { id: itemId },
      data: {
        ...(data.parentItemId !== undefined
          ? { parentItemId: data.parentItemId }
          : {}),
        ...(data.inventoryItemId !== undefined
          ? { inventoryItemId: data.inventoryItemId }
          : {}),
        ...(data.itemNumber !== undefined
          ? { itemNumber: data.itemNumber }
          : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description ?? null }
          : {}),
        ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
        ...(data.unit !== undefined ? { unit: data.unit } : {}),
        ...(data.source !== undefined ? { source: data.source } : {}),
        ...(data.materialSpec !== undefined
          ? { materialSpec: data.materialSpec ?? null }
          : {}),
        ...(data.alternateMaterial !== undefined
          ? { alternateMaterial: data.alternateMaterial ?? null }
          : {}),
        ...(data.unitCost !== undefined
          ? { unitCost: data.unitCost }
          : {}),
        ...(data.drawingNumber !== undefined
          ? { drawingNumber: data.drawingNumber ?? null }
          : {}),
        ...(data.remarks !== undefined
          ? { remarks: data.remarks ?? null }
          : {}),
        ...(data.sortOrder !== undefined
          ? { sortOrder: data.sortOrder }
          : {}),
      },
      include: bomItemInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "UPDATE",
        entity: "EngineeringBomItem",
        entityId: item.id,
        oldValues: {
          itemNumber: existing.itemNumber,
          name: existing.name,
          quantity: existing.quantity.toString(),
          source: existing.source,
        },
        newValues: {
          itemNumber: item.itemNumber,
          name: item.name,
          quantity: item.quantity.toString(),
          source: item.source,
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(200).json({
      success: true,
      message: "BOM item updated successfully",
      data: item,
    });
  } catch (error) {
    console.error("Unable to update engineering BOM item:", error);
    response.status(500).json({
      success: false,
      message: "Unable to update BOM item",
    });
  }
};

export const getEngineeringBomCostRollupController = async (
  request: Request,
  response: Response
) => {
  try {
    const bom = await prisma.engineeringBom.findUnique({
      where: { id: String(request.params.bomId) },
      include: { items: true },
    });
    if (!bom) {
      response.status(404).json({ success: false, message: "Engineering BOM was not found" });
      return;
    }
    const items = bom.items;
    const byParent = new Map<string | null, typeof items>();
    for (const item of items) {
      const list = byParent.get(item.parentItemId) ?? [];
      list.push(item);
      byParent.set(item.parentItemId, list);
    }
    const calculate = (parentId: string | null): number =>
      (byParent.get(parentId) ?? []).reduce((sum, item) => {
        const own = Number(item.quantity) * Number(item.unitCost ?? 0);
        return sum + own + calculate(item.id) * Number(item.quantity);
      }, 0);
    const total = calculate(null);
    response.status(200).json({
      success: true,
      data: {
        bomId: bom.id,
        bomNumber: bom.bomNumber,
        revision: bom.revision,
        currency: "INR",
        totalCost: Number(total.toFixed(2)),
        pricedItems: items.filter((item) => item.unitCost !== null).length,
        unpricedItems: items.filter((item) => item.unitCost === null).length,
      },
    });
  } catch (error) {
    console.error("Unable to calculate BOM cost roll-up:", error);
    response.status(500).json({ success: false, message: "Unable to calculate BOM cost roll-up" });
  }
};

export const deleteEngineeringBomItemController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const itemId = String(request.params.itemId);

    const existing = await prisma.engineeringBomItem.findUnique({
      where: { id: itemId },
      include: {
        bom: { select: { status: true } },
        _count: { select: { children: true } },
      },
    });

    if (!existing) {
      response.status(404).json({
        success: false,
        message: "BOM item was not found",
      });
      return;
    }

    if (existing.bom.status !== "DRAFT") {
      response.status(400).json({
        success: false,
        message: "BOM items can only be deleted while the BOM is in DRAFT status",
      });
      return;
    }

    if (existing._count.children > 0) {
      response.status(400).json({
        success: false,
        message: "Remove or move child items before deleting this BOM item",
      });
      return;
    }

    await prisma.engineeringBomItem.delete({
      where: { id: itemId },
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "DELETE",
        entity: "EngineeringBomItem",
        entityId: itemId,
        oldValues: {
          bomId: existing.bomId,
          itemNumber: existing.itemNumber,
          name: existing.name,
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(200).json({
      success: true,
      message: "BOM item deleted successfully",
    });
  } catch (error) {
    console.error("Unable to delete engineering BOM item:", error);
    response.status(500).json({
      success: false,
      message: "Unable to delete BOM item",
    });
  }
};


// ============================================================
// MODULE 4 - ENGINEERING WORKFLOW / DMS / ECR
// ============================================================

export const advanceEngineeringWorkflowController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const projectId = String(request.params.id);
    const stage = String(request.body.stage || "").trim();
    const allowed = [
      "SALES_ORDER",
      "ENGINEERING_RELEASE",
      "DESIGN_CREATION",
      "GA_DRAWING",
      "CUSTOMER_APPROVAL",
      "FABRICATION_DRAWING",
      "BOM_RELEASE",
      "PRODUCTION_RELEASE",
    ];
    if (!allowed.includes(stage)) {
      response.status(400).json({ success: false, message: "Invalid engineering workflow stage" });
      return;
    }
    const project = await prisma.engineeringProject.findUnique({ where: { id: projectId } });
    if (!project) { response.status(404).json({ success: false, message: "Engineering project was not found" }); return; }

    const now = new Date();
    const data: Record<string, unknown> = { workflowStage: stage };
    if (stage === "ENGINEERING_RELEASE") data.engineeringReleasedAt = now;
    if (stage === "DESIGN_CREATION") data.designCreatedAt = now;
    if (stage === "CUSTOMER_APPROVAL") { data.customerApprovalAt = now; data.status = "APPROVED"; }
    if (stage === "FABRICATION_DRAWING") data.fabricationReleasedAt = now;
    if (stage === "BOM_RELEASE") data.bomReleasedAt = now;
    if (stage === "PRODUCTION_RELEASE") { data.productionReleasedAt = now; data.actualReleaseDate = now; data.status = "RELEASED"; }
    if (stage === "ENGINEERING_RELEASE" && project.status === "DRAFT") data.status = "DESIGN_IN_PROGRESS";
    if (stage === "DESIGN_CREATION") data.status = "DESIGN_IN_PROGRESS";
    if (stage === "GA_DRAWING" || stage === "FABRICATION_DRAWING") data.status = "CUSTOMER_REVIEW";

    const updated = await prisma.engineeringProject.update({ where: { id: projectId }, data, include: projectInclude });
    await prisma.auditLog.create({ data: { userId: request.auth?.userId ?? null, action: "WORKFLOW_ADVANCE", entity: "EngineeringProject", entityId: projectId, oldValues: { workflowStage: (project as any).workflowStage }, newValues: { workflowStage: stage }, ipAddress: request.ip ?? null } });
    response.json({ success: true, message: `Engineering workflow moved to ${stage}`, data: updated });
  } catch (error) {
    console.error("Unable to advance engineering workflow:", error);
    response.status(500).json({ success: false, message: "Unable to advance engineering workflow" });
  }
};

export const linkEngineeringSalesOrderController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const projectId = String(request.params.id);
    const salesOrderId = String(request.body.salesOrderId || "");
    if (!salesOrderId) { response.status(400).json({ success: false, message: "Sales Order is required" }); return; }
    const [project, salesOrder] = await Promise.all([
      prisma.engineeringProject.findUnique({ where: { id: projectId } }),
      prisma.salesOrder.findUnique({ where: { id: salesOrderId }, select: { id: true, salesOrderNumber: true } }),
    ]);
    if (!project) { response.status(404).json({ success: false, message: "Engineering project was not found" }); return; }
    if (!salesOrder) { response.status(404).json({ success: false, message: "Sales Order was not found" }); return; }
    const updated = await prisma.engineeringProject.update({ where: { id: projectId }, data: { salesOrderId, workflowStage: "SALES_ORDER" }, include: projectInclude });
    response.json({ success: true, message: `${salesOrder.salesOrderNumber} linked to engineering`, data: updated });
  } catch (error) {
    console.error("Unable to link sales order:", error);
    response.status(500).json({ success: false, message: "Unable to link Sales Order" });
  }
};

export const createEngineeringDocumentController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const { projectId, drawingId, documentNumber, title, category, versionLabel, fileName, fileUrl, modificationReason } = request.body;
    if (!projectId || !documentNumber || !title || !category) { response.status(400).json({ success: false, message: "Project, document number, title and category are required" }); return; }
    const document = await (prisma as any).engineeringDocument.create({ data: { projectId, drawingId: drawingId || null, documentNumber, title, category, versionLabel: versionLabel || "V1.0", fileName: fileName || null, fileUrl: fileUrl || null, modificationReason: modificationReason || "Initial issue", modifiedById: request.auth?.userId ?? null }, include: { modifiedBy: { select: userSummary }, approvedBy: { select: userSummary } } });
    response.status(201).json({ success: true, message: "Engineering document created", data: document });
  } catch (error) {
    console.error("Unable to create engineering document:", error);
    response.status(500).json({ success: false, message: "Unable to create engineering document" });
  }
};

export const listEngineeringDocumentsController = async (request: Request, response: Response) => {
  try {
    const projectId = String(request.query.projectId || "");
    const documents = await (prisma as any).engineeringDocument.findMany({ where: projectId ? { projectId } : undefined, include: { modifiedBy: { select: userSummary }, approvedBy: { select: userSummary } }, orderBy: [{ documentNumber: "asc" }, { modifiedAt: "desc" }] });
    response.json({ success: true, data: documents });
  } catch (error) {
    console.error("Unable to list engineering documents:", error);
    response.status(500).json({ success: false, message: "Unable to load engineering documents" });
  }
};

export const updateEngineeringDocumentController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const id = String(request.params.documentId);
    const { status, customerApproved, customerApprovedVersion, modificationReason, fileName, fileUrl } = request.body;
    const existing = await (prisma as any).engineeringDocument.findUnique({ where: { id } });
    if (!existing) { response.status(404).json({ success: false, message: "Engineering document was not found" }); return; }
    const updated = await (prisma as any).engineeringDocument.update({ where: { id }, data: { ...(status ? { status } : {}), ...(fileName !== undefined ? { fileName } : {}), ...(fileUrl !== undefined ? { fileUrl } : {}), ...(modificationReason !== undefined ? { modificationReason, modifiedById: request.auth?.userId ?? null, modifiedAt: new Date() } : {}), ...(customerApproved !== undefined ? { customerApproved, customerApprovedAt: customerApproved ? new Date() : null, customerApprovedVersion: customerApproved ? (customerApprovedVersion || existing.versionLabel) : null, approvedById: customerApproved ? (request.auth?.userId ?? null) : null, approvedAt: customerApproved ? new Date() : null, status: customerApproved ? "APPROVED" : (status || existing.status) } : {}) }, include: { modifiedBy: { select: userSummary }, approvedBy: { select: userSummary } } });
    response.json({ success: true, message: "Engineering document updated", data: updated });
  } catch (error) {
    console.error("Unable to update engineering document:", error);
    response.status(500).json({ success: false, message: "Unable to update engineering document" });
  }
};

export const createEcrController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const { projectId, title, description, reason, impactAnalysis, impactedDocuments, impactedBomItems, productionImpact, bomUpdateRequired, productionUpdateRequired } = request.body;
    if (!projectId || !title || !description || !reason) { response.status(400).json({ success: false, message: "Project, title, description and reason are required" }); return; }
    const count = await (prisma as any).engineeringChangeRequest.count();
    const ecrNumber = `ECR-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const ecr = await (prisma as any).engineeringChangeRequest.create({ data: { ecrNumber, projectId, title, description, reason, impactAnalysis: impactAnalysis || null, impactedDocuments: impactedDocuments || null, impactedBomItems: impactedBomItems || null, productionImpact: productionImpact || null, bomUpdateRequired: Boolean(bomUpdateRequired), productionUpdateRequired: Boolean(productionUpdateRequired), createdById: request.auth?.userId ?? null }, include: { createdBy: { select: userSummary }, approvedBy: { select: userSummary } } });
    response.status(201).json({ success: true, message: `${ecrNumber} created`, data: ecr });
  } catch (error) {
    console.error("Unable to create ECR:", error);
    response.status(500).json({ success: false, message: "Unable to create ECR" });
  }
};

export const listEcrController = async (request: Request, response: Response) => {
  try {
    const projectId = String(request.query.projectId || "");
    const ecrs = await (prisma as any).engineeringChangeRequest.findMany({ where: projectId ? { projectId } : undefined, include: { createdBy: { select: userSummary }, approvedBy: { select: userSummary } }, orderBy: { createdAt: "desc" } });
    response.json({ success: true, data: ecrs });
  } catch (error) {
    console.error("Unable to list ECRs:", error);
    response.status(500).json({ success: false, message: "Unable to load ECRs" });
  }
};

export const updateEcrController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const id = String(request.params.ecrId);
    const { status, impactAnalysis, bomUpdateRequired, productionUpdateRequired } = request.body;
    const existing = await (prisma as any).engineeringChangeRequest.findUnique({ where: { id } });
    if (!existing) { response.status(404).json({ success: false, message: "ECR was not found" }); return; }
    const data: Record<string, unknown> = { ...(status ? { status } : {}), ...(impactAnalysis !== undefined ? { impactAnalysis } : {}), ...(bomUpdateRequired !== undefined ? { bomUpdateRequired: Boolean(bomUpdateRequired) } : {}), ...(productionUpdateRequired !== undefined ? { productionUpdateRequired: Boolean(productionUpdateRequired) } : {}) };
    if (status === "APPROVED") { data.approvedById = request.auth?.userId ?? null; data.approvedAt = new Date(); }
    if (status === "IMPLEMENTED") { data.implementedAt = new Date(); if (existing.bomUpdateRequired) data.bomUpdatedAt = new Date(); if (existing.productionUpdateRequired) data.productionUpdatedAt = new Date(); }
    const ecr = await (prisma as any).engineeringChangeRequest.update({ where: { id }, data, include: { createdBy: { select: userSummary }, approvedBy: { select: userSummary } } });
    response.json({ success: true, message: "ECR updated", data: ecr });
  } catch (error) {
    console.error("Unable to update ECR:", error);
    response.status(500).json({ success: false, message: "Unable to update ECR" });
  }
};
