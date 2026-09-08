import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import {
  createQuotationSchema,
  updateQuotationStatusSchema,
} from "../utils/quotation-validation.js";

type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
  };
};

const quotationInclude = {
  estimate: {
    include: {
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
              contactPerson: true,
              email: true,
              phone: true,
              billingAddress: true,
              city: true,
              state: true,
              country: true,
              gstNumber: true,
            },
          },
        },
      },
      items: {
        orderBy: {
          sortOrder: "asc" as const,
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
} as const;

export const listQuotationsController = async (
  request: Request,
  response: Response
) => {
  try {
    const search =
      typeof request.query.search === "string" ? request.query.search.trim() : "";

    const quotations = await prisma.quotation.findMany({
      ...(search
        ? {
            where: {
              OR: [
                {
                  quotationNumber: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  estimate: {
                    estimateNumber: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                },
                {
                  estimate: {
                    lead: {
                      title: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                },
                {
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
              ],
            },
          }
        : {}),
      include: quotationInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    response.status(200).json({ success: true, data: quotations });
  } catch (error) {
    console.error("Unable to list quotations:", error);
    response.status(500).json({
      success: false,
      message: "Unable to load quotations",
    });
  }
};

export const getQuotationController = async (
  request: Request,
  response: Response
) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: String(request.params.id) },
      include: quotationInclude,
    });

    if (!quotation) {
      response.status(404).json({
        success: false,
        message: "Quotation was not found",
      });
      return;
    }

    response.status(200).json({ success: true, data: quotation });
  } catch (error) {
    console.error("Unable to load quotation:", error);
    response.status(500).json({
      success: false,
      message: "Unable to load quotation",
    });
  }
};

export const createQuotationController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = createQuotationSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the quotation fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const data = validation.data;
    const estimate = await prisma.estimate.findUnique({
      where: { id: data.estimateId },
      select: {
        id: true,
        leadId: true,
        status: true,
        validUntil: true,
        subtotal: true,
        taxPercent: true,
        taxAmount: true,
        totalAmount: true,
      },
    });

    if (!estimate) {
      response.status(404).json({
        success: false,
        message: "Selected estimate was not found",
      });
      return;
    }

    if (estimate.status !== "APPROVED" && estimate.status !== "CONVERTED") {
      response.status(400).json({
        success: false,
        message: "Only an approved estimate can be converted to a quotation",
      });
      return;
    }

    const latestVersion = await prisma.quotation.aggregate({
      where: { estimateId: estimate.id },
      _max: { version: true },
    });
    const version = (latestVersion._max.version ?? 0) + 1;
    const quotationNumber = `QUO-${new Date().getFullYear()}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    const quotation = await prisma.$transaction(async (transaction) => {
      const created = await transaction.quotation.create({
        data: {
          quotationNumber,
          estimateId: estimate.id,
          version,
          status: data.status,
          validUntil: data.validUntil
            ? new Date(data.validUntil)
            : estimate.validUntil,
          subtotal: estimate.subtotal,
          taxPercent: estimate.taxPercent,
          taxAmount: estimate.taxAmount,
          totalAmount: estimate.totalAmount,
          paymentTerms: data.paymentTerms ?? null,
          deliveryTerms: data.deliveryTerms ?? null,
          termsAndConditions: data.termsAndConditions ?? null,
          notes: data.notes ?? null,
          createdById: request.auth?.userId ?? null,
        },
        include: quotationInclude,
      });

      await transaction.estimate.update({
        where: { id: estimate.id },
        data: { status: "CONVERTED" },
      });

      if (data.status === "SENT") {
        await transaction.lead.update({
          where: { id: estimate.leadId },
          data: { status: "QUOTATION_SENT" },
        });
      }

      return created;
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "CREATE",
        entity: "Quotation",
        entityId: quotation.id,
        newValues: {
          quotationNumber: quotation.quotationNumber,
          estimateId: quotation.estimateId,
          version: quotation.version,
          status: quotation.status,
          totalAmount: quotation.totalAmount.toString(),
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(201).json({
      success: true,
      message: "Quotation created successfully",
      data: quotation,
    });
  } catch (error) {
    console.error("Unable to create quotation:", error);
    response.status(500).json({
      success: false,
      message: "Unable to create quotation",
    });
  }
};

export const updateQuotationStatusController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = updateQuotationStatusSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Invalid quotation status",
      });
      return;
    }

    const quotationId = String(request.params.id);
    const existing = await prisma.quotation.findUnique({
      where: { id: quotationId },
      select: {
        id: true,
        status: true,
        estimate: {
          select: {
            leadId: true,
          },
        },
      },
    });

    if (!existing) {
      response.status(404).json({
        success: false,
        message: "Quotation was not found",
      });
      return;
    }

    const nextStatus = validation.data.status;
    const quotation = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.quotation.update({
        where: { id: quotationId },
        data: { status: nextStatus },
        include: quotationInclude,
      });

      if (nextStatus === "SENT") {
        await transaction.lead.update({
          where: { id: existing.estimate.leadId },
          data: { status: "QUOTATION_SENT" },
        });
      }

      if (nextStatus === "ACCEPTED" || nextStatus === "CONVERTED") {
        await transaction.lead.update({
          where: { id: existing.estimate.leadId },
          data: { status: "WON" },
        });
      }

      if (nextStatus === "REJECTED") {
        await transaction.lead.update({
          where: { id: existing.estimate.leadId },
          data: { status: "LOST" },
        });
      }

      return updated;
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "STATUS_UPDATE",
        entity: "Quotation",
        entityId: quotation.id,
        oldValues: { status: existing.status },
        newValues: { status: quotation.status },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(200).json({
      success: true,
      message: "Quotation status updated successfully",
      data: quotation,
    });
  } catch (error) {
    console.error("Unable to update quotation status:", error);
    response.status(500).json({
      success: false,
      message: "Unable to update quotation status",
    });
  }
};

