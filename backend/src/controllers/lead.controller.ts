import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import { createLeadSchema } from "../utils/lead-validation.js";

type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
  };
};

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
      include: {
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
      },
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
      include: {
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
      },
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