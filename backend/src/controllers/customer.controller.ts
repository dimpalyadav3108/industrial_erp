import { randomUUID } from "node:crypto";
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { prisma } from "../config/database.js";
import { createCustomerSchema } from "../utils/customer-validation.js";

function generateCustomerCode(): string {
  const year = new Date().getFullYear();
  const suffix = randomUUID()
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase();

  return `CUS-${year}-${suffix}`;
}

export async function listCustomersController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const search =
      typeof request.query.search === "string"
        ? request.query.search.trim()
        : "";

    const customers = await prisma.customer.findMany({
      ...(search
        ? {
            where: {
              OR: [
                {
                  companyName: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  customerCode: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  contactPerson: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            },
          }
        : {}),
      include: {
        _count: {
          select: {
            leads: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    response.status(200).json({
      success: true,
      data: customers,
      count: customers.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCustomerController(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validation = createCustomerSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Invalid customer details",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const input = validation.data;

    const customer = await prisma.customer.create({
      data: {
        customerCode: generateCustomerCode(),
        companyName: input.companyName,
        contactPerson: input.contactPerson ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        gstNumber: input.gstNumber ?? null,
        billingAddress: input.billingAddress ?? null,
        shippingAddress: input.shippingAddress ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        country: input.country,
        status: input.status,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "CREATE",
        entity: "Customer",
        entityId: customer.id,
        newValues: {
          customerCode: customer.customerCode,
          companyName: customer.companyName,
          status: customer.status,
        },
      },
    });

    response.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      response.status(409).json({
        success: false,
        message: "A customer with this GST number already exists",
      });
      return;
    }

    next(error);
  }
}