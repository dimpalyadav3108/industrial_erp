import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
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

const getLogistics = async (dispatchId: string) => {
  const rows = await prisma.$queryRaw<any[]>`
    SELECT * FROM "DispatchLogistics" WHERE "dispatchId" = ${dispatchId} LIMIT 1
  `;
  const events = await prisma.$queryRaw<any[]>`
    SELECT "id","status","location","remarks","eventAt","createdById","createdAt"
    FROM "DispatchTrackingEvent"
    WHERE "dispatchId" = ${dispatchId}
    ORDER BY "eventAt" DESC
  `;
  return { logistics: rows[0] ?? null, trackingEvents: events };
};

const withLogistics = async <T extends { id: string }>(dispatch: T) => ({
  ...dispatch,
  ...(await getLogistics(dispatch.id)),
});

const syncLogisticsForDispatchStatus = async (dispatchId: string, status: string) => {
  const now = new Date();
  const stage =
    status === "READY" ? "READY_FOR_DISPATCH" :
    status === "DISPATCHED" ? "DISPATCHED" :
    status === "DELIVERED" ? "DELIVERED" : "FG_READY";
  await prisma.$executeRaw`
    INSERT INTO "DispatchLogistics" ("id","dispatchId","stage","fgReadyAt","dispatchedAt","deliveredAt","updatedAt")
    VALUES (${randomUUID()},${dispatchId},${stage},${now},${status === "DISPATCHED" || status === "DELIVERED" ? now : null},${status === "DELIVERED" ? now : null},${now})
    ON CONFLICT ("dispatchId") DO UPDATE SET
      "stage" = EXCLUDED."stage",
      "fgReadyAt" = COALESCE("DispatchLogistics"."fgReadyAt", EXCLUDED."fgReadyAt"),
      "dispatchedAt" = COALESCE("DispatchLogistics"."dispatchedAt", EXCLUDED."dispatchedAt"),
      "deliveredAt" = COALESCE("DispatchLogistics"."deliveredAt", EXCLUDED."deliveredAt"),
      "updatedAt" = EXCLUDED."updatedAt"
  `;
};

export const listDispatchesController = async (
  request: Request,
  response: Response
) => {
  try {
    const search =
      typeof request.query.search === "string" ? request.query.search.trim() : "";

    const logisticsMatches = search
      ? await prisma.$queryRaw<{ dispatchId: string }[]>`
          SELECT "dispatchId" FROM "DispatchLogistics"
          WHERE "lrNumber" ILIKE ${"%" + search + "%"}
             OR "ewayBillNumber" ILIKE ${"%" + search + "%"}
             OR "eInvoiceNumber" ILIKE ${"%" + search + "%"}
        `
      : [];
    const logisticsIds = logisticsMatches.map((row) => row.dispatchId);

    const dispatches = await prisma.dispatch.findMany({
      ...(search
        ? {
            where: {
              OR: [
                ...(logisticsIds.length ? [{ id: { in: logisticsIds } }] : []),
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

    response.status(200).json({ success: true, data: await Promise.all(dispatches.map(withLogistics)) });
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

    response.status(200).json({ success: true, data: await withLogistics(dispatch) });
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

    await syncLogisticsForDispatchStatus(dispatch.id, dispatch.status);

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
      data: await withLogistics(dispatch),
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

    if (data.status) await syncLogisticsForDispatchStatus(dispatch.id, data.status);

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
      data: await withLogistics(dispatch),
    });
  } catch (error) {
    console.error("Unable to update dispatch:", error);
    response.status(500).json({
      success: false,
      message: "Unable to update dispatch",
    });
  }
};



export const getDispatchLogisticsController = async (request: Request, response: Response) => {
  try {
    const dispatchId = String(request.params.id);
    const dispatch = await prisma.dispatch.findUnique({ where: { id: dispatchId }, select: { id: true } });
    if (!dispatch) return response.status(404).json({ success: false, message: "Dispatch was not found" });
    response.json({ success: true, data: await getLogistics(dispatchId) });
  } catch (error) {
    console.error("Unable to load dispatch logistics:", error);
    response.status(500).json({ success: false, message: "Unable to load dispatch logistics" });
  }
};

export const updateDispatchLogisticsController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const dispatchId = String(request.params.id);
    const dispatch = await prisma.dispatch.findUnique({ where: { id: dispatchId }, select: { id: true } });
    if (!dispatch) return response.status(404).json({ success: false, message: "Dispatch was not found" });

    const body = request.body as Record<string, unknown>;
    const allowedStages = ["FG_READY","PACKING","LOADING","DISPATCHED","DELIVERED"];
    const stage = typeof body.stage === "string" && allowedStages.includes(body.stage) ? body.stage : undefined;
    const deliveryStatus = typeof body.deliveryStatus === "string" ? body.deliveryStatus : undefined;
    const now = new Date();
    const logistics = await getLogistics(dispatchId);
    const current = logistics.logistics;

    const dateForStage = (s?: string) =>
      s === "FG_READY" ? { fgReadyAt: now } :
      s === "PACKING" ? { packedAt: now } :
      s === "LOADING" ? { loadedAt: now } :
      s === "DISPATCHED" ? { dispatchedAt: now } :
      s === "DELIVERED" ? { deliveredAt: now } : {};

    const dates = dateForStage(stage);
    await prisma.$executeRaw`
      INSERT INTO "DispatchLogistics"
      ("id","dispatchId","stage","deliveryStatus","fgReadyAt","packedAt","loadedAt","dispatchedAt","deliveredAt",
       "ewayBillNumber","ewayBillDate","eInvoiceNumber","eInvoiceDate","lrNumber","lrDate",
       "vehicleTrackingUrl","vehicleTrackingNote","packingListUrl","lrCopyUrl","podUrl","podReceivedAt","notes","updatedAt")
      VALUES
      (${current?.id ?? randomUUID()},${dispatchId},${stage ?? current?.stage ?? "FG_READY"},${deliveryStatus ?? current?.deliveryStatus ?? "PENDING"},
       ${dates.fgReadyAt ?? current?.fgReadyAt ?? null},${dates.packedAt ?? current?.packedAt ?? null},
       ${dates.loadedAt ?? current?.loadedAt ?? null},${dates.dispatchedAt ?? current?.dispatchedAt ?? null},
       ${dates.deliveredAt ?? current?.deliveredAt ?? null},
       ${typeof body.ewayBillNumber === "string" ? body.ewayBillNumber : current?.ewayBillNumber ?? null},
       ${body.ewayBillDate ? new Date(String(body.ewayBillDate)) : current?.ewayBillDate ?? null},
       ${typeof body.eInvoiceNumber === "string" ? body.eInvoiceNumber : current?.eInvoiceNumber ?? null},
       ${body.eInvoiceDate ? new Date(String(body.eInvoiceDate)) : current?.eInvoiceDate ?? null},
       ${typeof body.lrNumber === "string" ? body.lrNumber : current?.lrNumber ?? null},
       ${body.lrDate ? new Date(String(body.lrDate)) : current?.lrDate ?? null},
       ${typeof body.vehicleTrackingUrl === "string" ? body.vehicleTrackingUrl : current?.vehicleTrackingUrl ?? null},
       ${typeof body.vehicleTrackingNote === "string" ? body.vehicleTrackingNote : current?.vehicleTrackingNote ?? null},
       ${typeof body.packingListUrl === "string" ? body.packingListUrl : current?.packingListUrl ?? null},
       ${typeof body.lrCopyUrl === "string" ? body.lrCopyUrl : current?.lrCopyUrl ?? null},
       ${typeof body.podUrl === "string" ? body.podUrl : current?.podUrl ?? null},
       ${body.podReceivedAt ? new Date(String(body.podReceivedAt)) : current?.podReceivedAt ?? null},
       ${typeof body.notes === "string" ? body.notes : current?.notes ?? null},
       ${now})
      ON CONFLICT ("dispatchId") DO UPDATE SET
       "stage"=EXCLUDED."stage","deliveryStatus"=EXCLUDED."deliveryStatus",
       "fgReadyAt"=EXCLUDED."fgReadyAt","packedAt"=EXCLUDED."packedAt","loadedAt"=EXCLUDED."loadedAt",
       "dispatchedAt"=EXCLUDED."dispatchedAt","deliveredAt"=EXCLUDED."deliveredAt",
       "ewayBillNumber"=EXCLUDED."ewayBillNumber","ewayBillDate"=EXCLUDED."ewayBillDate",
       "eInvoiceNumber"=EXCLUDED."eInvoiceNumber","eInvoiceDate"=EXCLUDED."eInvoiceDate",
       "lrNumber"=EXCLUDED."lrNumber","lrDate"=EXCLUDED."lrDate",
       "vehicleTrackingUrl"=EXCLUDED."vehicleTrackingUrl","vehicleTrackingNote"=EXCLUDED."vehicleTrackingNote",
       "packingListUrl"=EXCLUDED."packingListUrl","lrCopyUrl"=EXCLUDED."lrCopyUrl",
       "podUrl"=EXCLUDED."podUrl","podReceivedAt"=EXCLUDED."podReceivedAt",
       "notes"=EXCLUDED."notes","updatedAt"=EXCLUDED."updatedAt"
    `;

    if (stage) {
      await prisma.$executeRaw`
        INSERT INTO "DispatchTrackingEvent" ("id","dispatchId","status","remarks","createdById")
        VALUES (${randomUUID()},${dispatchId},${stage},${typeof body.trackingRemarks === "string" ? body.trackingRemarks : null},${request.auth?.userId ?? null})
      `;
    }
    response.json({ success: true, message: "Dispatch logistics updated", data: await getLogistics(dispatchId) });
  } catch (error) {
    console.error("Unable to update dispatch logistics:", error);
    response.status(500).json({ success: false, message: "Unable to update dispatch logistics" });
  }
};

export const addDispatchTrackingEventController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const dispatchId = String(request.params.id);
    const { status, location, remarks, eventAt } = request.body as Record<string, unknown>;
    if (typeof status !== "string" || !status.trim()) return response.status(400).json({ success: false, message: "Tracking status is required" });
    const dispatch = await prisma.dispatch.findUnique({ where: { id: dispatchId }, select: { id: true } });
    if (!dispatch) return response.status(404).json({ success: false, message: "Dispatch was not found" });
    await prisma.$executeRaw`
      INSERT INTO "DispatchTrackingEvent" ("id","dispatchId","status","location","remarks","eventAt","createdById")
      VALUES (${randomUUID()},${dispatchId},${status.trim()},${typeof location === "string" ? location.trim() : null},${typeof remarks === "string" ? remarks.trim() : null},${eventAt ? new Date(String(eventAt)) : new Date()},${request.auth?.userId ?? null})
    `;
    response.status(201).json({ success: true, message: "Tracking event added", data: await getLogistics(dispatchId) });
  } catch (error) {
    console.error("Unable to add tracking event:", error);
    response.status(500).json({ success: false, message: "Unable to add tracking event" });
  }
};


export const uploadDispatchDocumentController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const dispatchId = String(request.params.id);
    const { documentType, fileName, data } = request.body as Record<string, unknown>;
    const validTypes = ["POD", "PACKING_LIST", "LR_COPY", "EWAY_BILL", "EINVOICE"];
    if (typeof documentType !== "string" || !validTypes.includes(documentType) ||
        typeof fileName !== "string" || typeof data !== "string" || !data.startsWith("data:")) {
      return response.status(400).json({ success: false, message: "documentType, fileName and a data URL are required" });
    }
    const dispatch = await prisma.dispatch.findUnique({ where: { id: dispatchId }, select: { id: true } });
    if (!dispatch) return response.status(404).json({ success: false, message: "Dispatch was not found" });

    const match = data.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return response.status(400).json({ success: false, message: "Invalid file data" });
    const mime = match[1];
    const buffer = Buffer.from(match[2]!, "base64");
    if (buffer.length > 10 * 1024 * 1024) return response.status(400).json({ success: false, message: "File must be 10 MB or smaller" });
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uploadDir = path.resolve(process.cwd(), "uploads", "dispatch");
    await fs.mkdir(uploadDir, { recursive: true });
    const storedName = `${randomUUID()}-${safeName}`;
    await fs.writeFile(path.join(uploadDir, storedName), buffer);
    const publicUrl = `/uploads/dispatch/${storedName}`;

    const field = documentType === "POD" ? "podUrl" :
      documentType === "PACKING_LIST" ? "packingListUrl" :
      documentType === "LR_COPY" ? "lrCopyUrl" : null;
    if (field) {
      await prisma.$executeRawUnsafe(`UPDATE "DispatchLogistics" SET "${field}" = $1, "updatedAt" = NOW() WHERE "dispatchId" = $2`, publicUrl, dispatchId);
    }
    response.status(201).json({ success: true, message: `${documentType} uploaded`, data: { url: publicUrl, fileName: safeName, mimeType: mime } });
  } catch (error) {
    console.error("Unable to upload dispatch document:", error);
    response.status(500).json({ success: false, message: "Unable to upload dispatch document" });
  }
};
