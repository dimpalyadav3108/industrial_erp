import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import {
  createLeadSchema,
  updateLeadSchema,
} from "../utils/lead-validation.js";

type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
  };
};

const leadInclude = {
  customer: {
    select: {
      id: true,
      customerCode: true,
      companyName: true,
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
} as const;

export const listLeadsController = async (
  request: Request,
  response: Response
) => {
  try {
    const search =
      typeof request.query.search === "string"
        ? request.query.search.trim()
        : "";

    const leads = await prisma.lead.findMany({
      ...(search
        ? {
            where: {
              OR: [
                {
                  leadNumber: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  title: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  customer: {
                    companyName: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                },
              ],
            },
          }
        : {}),
      include: leadInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    response.status(200).json({
      success: true,
      data: leads,
    });
  } catch (error) {
    console.error("Unable to list leads:", error);

    response.status(500).json({
      success: false,
      message: "Unable to load leads",
    });
  }
};

export const createLeadController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = createLeadSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the highlighted fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const data = validation.data;

    const customer = await prisma.customer.findUnique({
      where: {
        id: data.customerId,
      },
      select: {
        id: true,
      },
    });

    if (!customer) {
      response.status(404).json({
        success: false,
        message: "Selected customer was not found",
      });
      return;
    }

    if (data.assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: {
          id: data.assignedToId,
        },
        select: {
          id: true,
        },
      });

      if (!assignedUser) {
        response.status(404).json({
          success: false,
          message: "Selected assigned user was not found",
        });
        return;
      }
    }

    const leadNumber = `LEAD-${new Date().getFullYear()}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    const lead = await prisma.lead.create({
      data: {
        leadNumber,
        title: data.title,
        description: data.description ?? null,
        source: data.source ?? null,
        priority: data.priority,
        status: data.status,
        estimatedValue: data.estimatedValue ?? null,
        expectedCloseDate: data.expectedCloseDate
          ? new Date(data.expectedCloseDate)
          : null,
        customerId: data.customerId,
        assignedToId: data.assignedToId ?? null,
      },
      include: leadInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "CREATE",
        entity: "Lead",
        entityId: lead.id,
        newValues: {
          leadNumber: lead.leadNumber,
          title: lead.title,
          status: lead.status,
          customerId: lead.customerId,
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Unable to create lead:", error);

    response.status(500).json({
      success: false,
      message: "Unable to create lead",
    });
  }
};

export const updateLeadController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const leadId = String(request.params.id);
    const validation = updateLeadSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the highlighted fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const existingLead = await prisma.lead.findUnique({
      where: {
        id: leadId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        customerId: true,
      },
    });

    if (!existingLead) {
      response.status(404).json({
        success: false,
        message: "Lead was not found",
      });
      return;
    }

    const data = validation.data;

    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: {
          id: data.customerId,
        },
        select: {
          id: true,
        },
      });

      if (!customer) {
        response.status(404).json({
          success: false,
          message: "Selected customer was not found",
        });
        return;
      }
    }

    if (data.assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: {
          id: data.assignedToId,
        },
        select: {
          id: true,
        },
      });

      if (!assignedUser) {
        response.status(404).json({
          success: false,
          message: "Selected assigned user was not found",
        });
        return;
      }
    }

    const lead = await prisma.lead.update({
      where: {
        id: leadId,
      },
      data: {
        ...(data.title !== undefined
          ? { title: data.title }
          : {}),
        ...(data.description !== undefined
          ? { description: data.description ?? null }
          : {}),
        ...(data.source !== undefined
          ? { source: data.source ?? null }
          : {}),
        ...(data.priority !== undefined
          ? { priority: data.priority }
          : {}),
        ...(data.status !== undefined
          ? { status: data.status }
          : {}),
        ...(data.estimatedValue !== undefined
          ? { estimatedValue: data.estimatedValue ?? null }
          : {}),
        ...(data.expectedCloseDate !== undefined
          ? {
              expectedCloseDate: data.expectedCloseDate
                ? new Date(data.expectedCloseDate)
                : null,
            }
          : {}),
        ...(data.customerId !== undefined
          ? { customerId: data.customerId }
          : {}),
        ...(data.assignedToId !== undefined
          ? { assignedToId: data.assignedToId ?? null }
          : {}),
      },
      include: leadInclude,
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "UPDATE",
        entity: "Lead",
        entityId: lead.id,
        oldValues: {
          title: existingLead.title,
          status: existingLead.status,
          priority: existingLead.priority,
          customerId: existingLead.customerId,
        },
        newValues: {
          title: lead.title,
          status: lead.status,
          priority: lead.priority,
          customerId: lead.customerId,
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Unable to update lead:", error);

    response.status(500).json({
      success: false,
      message: "Unable to update lead",
    });
  }
};
export const getLeadController = async (
  request: Request,
  response: Response
) => {
  try {
    const leadId = String(request.params.id);

    const lead = await prisma.lead.findUnique({
      where: {
        id: leadId,
      },
      include: leadInclude,
    });

    if (!lead) {
      response.status(404).json({
        success: false,
        message: "Lead was not found",
      });
      return;
    }

    response.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error("Unable to load lead:", error);

    response.status(500).json({
      success: false,
      message: "Unable to load lead",
    });
  }
};

export const deleteLeadController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const leadId = String(request.params.id);

    const existingLead = await prisma.lead.findUnique({
      where: {
        id: leadId,
      },
      select: {
        id: true,
        leadNumber: true,
        title: true,
        status: true,
      },
    });

    if (!existingLead) {
      response.status(404).json({
        success: false,
        message: "Lead was not found",
      });
      return;
    }

    await prisma.$transaction([
      prisma.lead.delete({
        where: {
          id: leadId,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: request.auth?.userId ?? null,
          action: "DELETE",
          entity: "Lead",
          entityId: existingLead.id,
          oldValues: {
            leadNumber: existingLead.leadNumber,
            title: existingLead.title,
            status: existingLead.status,
          },
          ipAddress: request.ip ?? null,
        },
      }),
    ]);

    response.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Unable to delete lead:", error);

    response.status(500).json({
      success: false,
      message: "Unable to delete lead",
    });
  }
};