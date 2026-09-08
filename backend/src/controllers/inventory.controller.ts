import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import {
  createInventoryItemSchema,
  createStockMovementSchema,
  updateInventoryItemSchema,
} from "../utils/inventory-validation.js";

type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
  };
};

const itemInclude = {
  movements: {
    orderBy: {
      createdAt: "desc" as const,
    },
    take: 50,
    include: {
      createdBy: {
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  },
} as const;

const inboundMovementTypes = new Set([
  "RECEIPT",
  "ADJUSTMENT_IN",
  "RETURN_IN",
]);

export const listInventoryItemsController = async (
  request: Request,
  response: Response
) => {
  try {
    const search =
      typeof request.query.search === "string" ? request.query.search.trim() : "";

    const items = await prisma.inventoryItem.findMany({
      ...(search
        ? {
            where: {
              OR: [
                { itemCode: { contains: search, mode: "insensitive" as const } },
                { name: { contains: search, mode: "insensitive" as const } },
                { category: { contains: search, mode: "insensitive" as const } },
                { location: { contains: search, mode: "insensitive" as const } },
              ],
            },
          }
        : {}),
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });

    response.status(200).json({ success: true, data: items });
  } catch (error) {
    console.error("Unable to list inventory items:", error);
    response.status(500).json({
      success: false,
      message: "Unable to load inventory items",
    });
  }
};

export const getInventoryItemController = async (
  request: Request,
  response: Response
) => {
  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: String(request.params.id) },
      include: itemInclude,
    });

    if (!item) {
      response.status(404).json({
        success: false,
        message: "Inventory item was not found",
      });
      return;
    }

    response.status(200).json({ success: true, data: item });
  } catch (error) {
    console.error("Unable to load inventory item:", error);
    response.status(500).json({
      success: false,
      message: "Unable to load inventory item",
    });
  }
};

export const createInventoryItemController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = createInventoryItemSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the inventory item fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const data = validation.data;
    const itemCode = `ITM-${new Date().getFullYear()}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    const item = await prisma.$transaction(async (transaction) => {
      const created = await transaction.inventoryItem.create({
        data: {
          itemCode,
          name: data.name,
          description: data.description ?? null,
          itemType: data.itemType,
          category: data.category ?? null,
          unit: data.unit,
          currentStock: data.openingStock,
          reorderLevel: data.reorderLevel,
          unitCost: data.unitCost,
          location: data.location ?? null,
        },
      });

      if (data.openingStock > 0) {
        await transaction.stockMovement.create({
          data: {
            inventoryItemId: created.id,
            movementType: "ADJUSTMENT_IN",
            quantity: data.openingStock,
            balanceAfter: data.openingStock,
            unitCost: data.unitCost,
            referenceType: "OPENING_STOCK",
            notes: "Opening stock recorded during item creation",
            createdById: request.auth?.userId ?? null,
          },
        });
      }

      return created;
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "CREATE",
        entity: "InventoryItem",
        entityId: item.id,
        newValues: {
          itemCode: item.itemCode,
          name: item.name,
          itemType: item.itemType,
          currentStock: item.currentStock.toString(),
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      data: item,
    });
  } catch (error) {
    console.error("Unable to create inventory item:", error);
    response.status(500).json({
      success: false,
      message: "Unable to create inventory item",
    });
  }
};

export const updateInventoryItemController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = updateInventoryItemSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the inventory item fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const itemId = String(request.params.id);
    const existing = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!existing) {
      response.status(404).json({
        success: false,
        message: "Inventory item was not found",
      });
      return;
    }

    const data = validation.data;
    const item = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.itemType !== undefined ? { itemType: data.itemType } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.unit !== undefined ? { unit: data.unit } : {}),
        ...(data.reorderLevel !== undefined
          ? { reorderLevel: data.reorderLevel }
          : {}),
        ...(data.unitCost !== undefined ? { unitCost: data.unitCost } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "UPDATE",
        entity: "InventoryItem",
        entityId: item.id,
        oldValues: {
          name: existing.name,
          itemType: existing.itemType,
          reorderLevel: existing.reorderLevel.toString(),
          unitCost: existing.unitCost.toString(),
          isActive: existing.isActive,
        },
        newValues: {
          name: item.name,
          itemType: item.itemType,
          reorderLevel: item.reorderLevel.toString(),
          unitCost: item.unitCost.toString(),
          isActive: item.isActive,
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(200).json({
      success: true,
      message: "Inventory item updated successfully",
      data: item,
    });
  } catch (error) {
    console.error("Unable to update inventory item:", error);
    response.status(500).json({
      success: false,
      message: "Unable to update inventory item",
    });
  }
};

export const createStockMovementController = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const validation = createStockMovementSchema.safeParse(request.body);

    if (!validation.success) {
      response.status(400).json({
        success: false,
        message: "Please correct the stock movement fields",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const itemId = String(request.params.id);
    const data = validation.data;
    const result = await prisma.$transaction(async (transaction) => {
      const item = await transaction.inventoryItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        return { kind: "NOT_FOUND" as const };
      }

      if (!item.isActive) {
        return { kind: "INACTIVE" as const };
      }

      const currentStock = Number(item.currentStock);
      const direction = inboundMovementTypes.has(data.movementType) ? 1 : -1;
      const nextStock = currentStock + direction * data.quantity;

      if (nextStock < 0) {
        return {
          kind: "INSUFFICIENT" as const,
          currentStock,
        };
      }

      const updatedItem = await transaction.inventoryItem.update({
        where: { id: itemId },
        data: {
          currentStock: nextStock,
          ...(data.unitCost !== undefined ? { unitCost: data.unitCost } : {}),
        },
      });

      const movement = await transaction.stockMovement.create({
        data: {
          inventoryItemId: itemId,
          movementType: data.movementType,
          quantity: data.quantity,
          balanceAfter: nextStock,
          unitCost: data.unitCost ?? null,
          referenceType: data.referenceType ?? null,
          referenceNumber: data.referenceNumber ?? null,
          notes: data.notes ?? null,
          createdById: request.auth?.userId ?? null,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return { kind: "SUCCESS" as const, item: updatedItem, movement };
    });

    if (result.kind === "NOT_FOUND") {
      response.status(404).json({
        success: false,
        message: "Inventory item was not found",
      });
      return;
    }

    if (result.kind === "INACTIVE") {
      response.status(400).json({
        success: false,
        message: "Stock cannot be changed for an inactive item",
      });
      return;
    }

    if (result.kind === "INSUFFICIENT") {
      response.status(400).json({
        success: false,
        message: `Insufficient stock. Available quantity is ${result.currentStock}`,
      });
      return;
    }

    await prisma.auditLog.create({
      data: {
        userId: request.auth?.userId ?? null,
        action: "STOCK_MOVEMENT",
        entity: "InventoryItem",
        entityId: result.item.id,
        newValues: {
          movementType: result.movement.movementType,
          quantity: result.movement.quantity.toString(),
          balanceAfter: result.movement.balanceAfter.toString(),
          referenceNumber: result.movement.referenceNumber,
        },
        ipAddress: request.ip ?? null,
      },
    });

    response.status(201).json({
      success: true,
      message: "Stock movement recorded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Unable to record stock movement:", error);
    response.status(500).json({
      success: false,
      message: "Unable to record stock movement",
    });
  }
};

