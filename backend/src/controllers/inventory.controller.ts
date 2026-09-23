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


export const listStoreLocationsController = async (_request: Request, response: Response) => {
  try {
    const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT "id", "code", "name", "locationType", "isActive"
      FROM "InventoryLocation" WHERE "isActive" = true ORDER BY "locationType", "name"
    `;
    response.json({ success: true, data: rows });
  } catch (error) {
    console.error("Unable to list store locations:", error);
    response.status(500).json({ success: false, message: "Unable to load store locations" });
  }
};

export const getStoreTraceabilityController = async (request: Request, response: Response) => {
  try {
    const search = String(request.query.search ?? "").trim();
    const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT su."id", su."inventoryItemId", i."itemCode", i."name", i."itemType",
             su."stockType", su."batchNumber", su."lotNumber", su."serialNumber",
             su."boilerSerialNumber", su."quantity", su."reservedQuantity", su."status",
             l."code" AS "locationCode", l."name" AS "locationName"
      FROM "InventoryStockUnit" su
      JOIN "InventoryItem" i ON i."id" = su."inventoryItemId"
      LEFT JOIN "InventoryLocation" l ON l."id" = su."locationId"
      WHERE (${search} = '' OR i."itemCode" ILIKE ${`%${search}%`} OR i."name" ILIKE ${`%${search}%`} OR
             su."batchNumber" ILIKE ${`%${search}%`} OR su."serialNumber" ILIKE ${`%${search}%`} OR
             su."boilerSerialNumber" ILIKE ${`%${search}%`})
      ORDER BY su."updatedAt" DESC LIMIT 250
    `;
    response.json({ success: true, data: rows });
  } catch (error) {
    console.error("Unable to load stock traceability:", error);
    response.status(500).json({ success: false, message: "Unable to load stock traceability" });
  }
};

export const createStoreTraceabilityController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const { inventoryItemId, locationId, stockType, quantity, batchNumber, lotNumber, serialNumber, boilerSerialNumber } = request.body ?? {};
    if (!inventoryItemId || !stockType || !quantity || Number(quantity) <= 0) {
      response.status(400).json({ success: false, message: "Item, stock type and positive quantity are required" });
      return;
    }
    const id = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "InventoryStockUnit" ("id","inventoryItemId","locationId","stockType","batchNumber","lotNumber","serialNumber","boilerSerialNumber","quantity","updatedAt")
      VALUES (${id},${String(inventoryItemId)},${locationId ? String(locationId) : null},${String(stockType)},${batchNumber || null},${lotNumber || null},${serialNumber || null},${boilerSerialNumber || null},${Number(quantity)},CURRENT_TIMESTAMP)
    `;
    response.status(201).json({ success: true, data: { id }, message: "Traceable stock recorded successfully" });
  } catch (error) {
    console.error("Unable to create traceable stock:", error);
    response.status(500).json({ success: false, message: "Unable to record traceable stock" });
  }
};

export const createStockReservationController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const { inventoryItemId, stockUnitId, quantity, referenceType, referenceNumber } = request.body ?? {};
    const qty = Number(quantity);
    if (!inventoryItemId || !qty || qty <= 0 || !referenceType || !referenceNumber) {
      response.status(400).json({ success: false, message: "Item, quantity and reference are required" });
      return;
    }
    const id = randomUUID();
    await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ available: string }>>`
        SELECT ("currentStock" - COALESCE((SELECT SUM("quantity") FROM "InventoryReservation" r WHERE r."inventoryItemId" = i."id" AND r."status" = 'RESERVED'),0))::text AS available
        FROM "InventoryItem" i WHERE i."id" = ${String(inventoryItemId)} FOR UPDATE
      `;
      if (!rows.length) throw new Error("ITEM_NOT_FOUND");
      if (!rows[0] || Number(rows[0].available) < qty) throw new Error("INSUFFICIENT");
      await tx.$executeRaw`
        INSERT INTO "InventoryReservation" ("id","inventoryItemId","stockUnitId","quantity","referenceType","referenceNumber","reservedById")
        VALUES (${id},${String(inventoryItemId)},${stockUnitId ? String(stockUnitId) : null},${qty},${String(referenceType)},${String(referenceNumber)},${request.auth?.userId ?? null})
      `;
      if (stockUnitId) await tx.$executeRaw`UPDATE "InventoryStockUnit" SET "reservedQuantity" = "reservedQuantity" + ${qty}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${String(stockUnitId)}`;
    });
    response.status(201).json({ success: true, data: { id }, message: "Stock reserved successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "ITEM_NOT_FOUND") return response.status(404).json({ success: false, message: "Inventory item was not found" });
    if (message === "INSUFFICIENT") return response.status(400).json({ success: false, message: "Insufficient available stock for reservation" });
    console.error("Unable to reserve stock:", error);
    response.status(500).json({ success: false, message: "Unable to reserve stock" });
  }
};

export const createMaterialReturnController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const { inventoryItemId, locationId, quantity, returnType, reason, sourceReference, batchNumber, serialNumber } = request.body ?? {};
    const qty = Number(quantity);
    if (!inventoryItemId || !qty || qty <= 0 || !returnType || !reason) {
      response.status(400).json({ success: false, message: "Item, quantity, return type and reason are required" });
      return;
    }
    const item = await prisma.inventoryItem.findUnique({ where: { id: String(inventoryItemId) }, select: { currentStock: true, isActive: true } });
    if (!item) return response.status(404).json({ success: false, message: "Inventory item was not found" });
    if (!item.isActive) return response.status(400).json({ success: false, message: "Inactive item cannot receive a return" });
    const returnNumber = `RET-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const id = randomUUID();
    await prisma.$transaction(async (tx) => {
      const next = Number(item.currentStock) + qty;
      await tx.inventoryItem.update({ where: { id: String(inventoryItemId) }, data: { currentStock: next } });
      await tx.stockMovement.create({ data: { inventoryItemId: String(inventoryItemId), movementType: "RETURN_IN", quantity: qty, balanceAfter: next, referenceType: "MATERIAL_RETURN", referenceNumber: returnNumber, notes: reason, createdById: request.auth?.userId ?? null } });
      await tx.$executeRaw`
        INSERT INTO "InventoryMaterialReturn" ("id","returnNumber","inventoryItemId","locationId","quantity","returnType","reason","sourceReference","batchNumber","serialNumber","createdById")
        VALUES (${id},${returnNumber},${String(inventoryItemId)},${locationId ? String(locationId) : null},${qty},${String(returnType)},${String(reason)},${sourceReference || null},${batchNumber || null},${serialNumber || null},${request.auth?.userId ?? null})
      `;
    });
    response.status(201).json({ success: true, data: { id, returnNumber }, message: "Material return posted successfully" });
  } catch (error) {
    console.error("Unable to post material return:", error);
    response.status(500).json({ success: false, message: "Unable to post material return" });
  }
};
