import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import type { Prisma } from "../generated/prisma/client.js";

import { prisma } from "../config/database.js";
import {
  createGoodsReceiptNoteSchema,
  createProcurementRfqSchema,
  createPurchaseOrderSchema,
  createPurchaseRequisitionSchema,
  createVendorQuotationSchema,
  createVendorSchema,
  updateGoodsReceiptNoteSchema,
  updateProcurementRfqSchema,
  updatePurchaseOrderSchema,
  updatePurchaseRequisitionSchema,
  updateVendorQuotationSchema,
  updateVendorSchema,
} from "../utils/procurement-validation.js";

type AuthenticatedRequest = Request & {
  auth?: { userId: string };
};

const code = (prefix: string) =>
  `${prefix}-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;

const audit = async (
  request: AuthenticatedRequest,
  action: string,
  entity: string,
  entityId: string,
  oldValues?: Prisma.InputJsonValue,
  newValues?: Prisma.InputJsonValue
) => {
  await prisma.auditLog.create({
    data: {
      userId: request.auth?.userId ?? null,
      action,
      entity,
      entityId,
      ...(oldValues !== undefined ? { oldValues } : {}),
      ...(newValues !== undefined ? { newValues } : {}),
      ipAddress: request.ip ?? null,
    },
  });
};

const badValidation = (response: Response, validation: { error: { flatten(): { fieldErrors: unknown } } }, message: string) => {
  response.status(400).json({
    success: false,
    message,
    errors: validation.error.flatten().fieldErrors,
  });
};

const vendorInclude = {
  _count: { select: { quotations: true, purchaseOrders: true, goodsReceipts: true } },
} as const;

const requisitionInclude = {
  requestedBy: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
  approvedBy: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
  items: { include: { inventoryItem: true }, orderBy: { lineNumber: "asc" as const } },
} as const;

const rfqInclude = {
  purchaseRequisition: true,
  createdBy: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
  items: { include: { inventoryItem: true }, orderBy: { lineNumber: "asc" as const } },
  vendors: { include: { vendor: true } },
  quotations: { include: { vendor: true } },
} as const;

const quotationInclude = {
  vendor: true,
  rfq: true,
  items: { include: { rfqItem: true } },
} as const;

const poInclude = {
  vendor: true,
  vendorQuotation: true,
  purchaseRequisition: true,
  createdBy: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
  approvedBy: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
  items: { include: { inventoryItem: true }, orderBy: { lineNumber: "asc" as const } },
  goodsReceipts: true,
} as const;

const grnInclude = {
  vendor: true,
  purchaseOrder: true,
  receivedBy: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
  items: {
    include: { inventoryItem: true, purchaseOrderItem: true },
  },
} as const;

// ============================================================
// VENDORS
// ============================================================

export const listVendorsController = async (request: Request, response: Response) => {
  try {
    const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
    const vendors = await prisma.vendor.findMany({
      ...(search
        ? {
            where: {
              OR: [
                { vendorCode: { contains: search, mode: "insensitive" as const } },
                { name: { contains: search, mode: "insensitive" as const } },
                { contactPerson: { contains: search, mode: "insensitive" as const } },
                { gstNumber: { contains: search, mode: "insensitive" as const } },
              ],
            },
          }
        : {}),
      include: vendorInclude,
      orderBy: { createdAt: "desc" },
    });
    response.status(200).json({ success: true, data: vendors });
  } catch (error) {
    console.error("Unable to list vendors:", error);
    response.status(500).json({ success: false, message: "Unable to load vendors" });
  }
};

export const getVendorController = async (request: Request, response: Response) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: String(request.params.id) },
      include: vendorInclude,
    });
    if (!vendor) {
      response.status(404).json({ success: false, message: "Vendor was not found" });
      return;
    }
    response.status(200).json({ success: true, data: vendor });
  } catch (error) {
    console.error("Unable to load vendor:", error);
    response.status(500).json({ success: false, message: "Unable to load vendor" });
  }
};

export const createVendorController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = createVendorSchema.safeParse(request.body);
    if (!validation.success) {
      badValidation(response, validation, "Please correct the vendor fields");
      return;
    }
    const data = validation.data;
    const vendor = await prisma.vendor.create({
      data: {
        vendorCode: code("VEN"),
        name: data.name,
        contactPerson: data.contactPerson ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        alternatePhone: data.alternatePhone ?? null,
        gstNumber: data.gstNumber ?? null,
        panNumber: data.panNumber ?? null,
        address: data.address ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        country: data.country,
        postalCode: data.postalCode ?? null,
        paymentTerms: data.paymentTerms ?? null,
        deliveryTerms: data.deliveryTerms ?? null,
        rating: data.rating ?? null,
        notes: data.notes ?? null,
      },
    });
    await audit(request, "CREATE", "Vendor", vendor.id, undefined, {
      vendorCode: vendor.vendorCode,
      name: vendor.name,
      status: vendor.status,
    });
    response.status(201).json({ success: true, message: "Vendor created successfully", data: vendor });
  } catch (error) {
    console.error("Unable to create vendor:", error);
    response.status(500).json({ success: false, message: "Unable to create vendor" });
  }
};

export const updateVendorController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = updateVendorSchema.safeParse(request.body);
    if (!validation.success) {
      badValidation(response, validation, "Please correct the vendor fields");
      return;
    }
    const id = String(request.params.id);
    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing) {
      response.status(404).json({ success: false, message: "Vendor was not found" });
      return;
    }
    const data = validation.data;
    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.contactPerson !== undefined ? { contactPerson: data.contactPerson } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.alternatePhone !== undefined ? { alternatePhone: data.alternatePhone } : {}),
        ...(data.gstNumber !== undefined ? { gstNumber: data.gstNumber } : {}),
        ...(data.panNumber !== undefined ? { panNumber: data.panNumber } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.city !== undefined ? { city: data.city } : {}),
        ...(data.state !== undefined ? { state: data.state } : {}),
        ...(data.country !== undefined ? { country: data.country } : {}),
        ...(data.postalCode !== undefined ? { postalCode: data.postalCode } : {}),
        ...(data.paymentTerms !== undefined ? { paymentTerms: data.paymentTerms } : {}),
        ...(data.deliveryTerms !== undefined ? { deliveryTerms: data.deliveryTerms } : {}),
        ...(data.rating !== undefined ? { rating: data.rating } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });
    await audit(request, "UPDATE", "Vendor", id, { name: existing.name, status: existing.status }, { name: vendor.name, status: vendor.status });
    response.status(200).json({ success: true, message: "Vendor updated successfully", data: vendor });
  } catch (error) {
    console.error("Unable to update vendor:", error);
    response.status(500).json({ success: false, message: "Unable to update vendor" });
  }
};

// ============================================================
// PURCHASE REQUISITIONS
// ============================================================

export const listPurchaseRequisitionsController = async (_request: Request, response: Response) => {
  try {
    const rows = await prisma.purchaseRequisition.findMany({
      include: requisitionInclude,
      orderBy: { createdAt: "desc" },
    });
    response.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Unable to list purchase requisitions:", error);
    response.status(500).json({ success: false, message: "Unable to load purchase requisitions" });
  }
};

export const getPurchaseRequisitionController = async (request: Request, response: Response) => {
  try {
    const row = await prisma.purchaseRequisition.findUnique({
      where: { id: String(request.params.id) },
      include: requisitionInclude,
    });
    if (!row) {
      response.status(404).json({ success: false, message: "Purchase requisition was not found" });
      return;
    }
    response.status(200).json({ success: true, data: row });
  } catch (error) {
    console.error("Unable to load purchase requisition:", error);
    response.status(500).json({ success: false, message: "Unable to load purchase requisition" });
  }
};

export const createPurchaseRequisitionController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = createPurchaseRequisitionSchema.safeParse(request.body);
    if (!validation.success) {
      badValidation(response, validation, "Please correct the purchase requisition fields");
      return;
    }
    const data = validation.data;
    const row = await prisma.purchaseRequisition.create({
      data: {
        requisitionNumber: code("PR"),
        title: data.title,
        priority: data.priority,
        requiredDate: data.requiredDate ?? null,
        notes: data.notes ?? null,
        requestedById: request.auth?.userId ?? null,
        items: {
          create: data.items.map((item) => ({
            inventoryItemId: item.inventoryItemId ?? null,
            lineNumber: item.lineNumber,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            estimatedUnitPrice: item.estimatedUnitPrice ?? null,
            remarks: item.remarks ?? null,
          })),
        },
      },
      include: requisitionInclude,
    });
    await audit(request, "CREATE", "PurchaseRequisition", row.id, undefined, {
      requisitionNumber: row.requisitionNumber,
      title: row.title,
      status: row.status,
    });
    response.status(201).json({ success: true, message: "Purchase requisition created successfully", data: row });
  } catch (error) {
    console.error("Unable to create purchase requisition:", error);
    response.status(500).json({ success: false, message: "Unable to create purchase requisition" });
  }
};

const prTransitions = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["RFQ_CREATED", "CLOSED", "CANCELLED"],
  REJECTED: ["DRAFT", "CANCELLED"],
  RFQ_CREATED: ["CLOSED", "CANCELLED"],
  CLOSED: [],
  CANCELLED: [],
} as const;

export const updatePurchaseRequisitionController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = updatePurchaseRequisitionSchema.safeParse(request.body);
    if (!validation.success) {
      badValidation(response, validation, "Please correct the purchase requisition fields");
      return;
    }
    const id = String(request.params.id);
    const existing = await prisma.purchaseRequisition.findUnique({ where: { id } });
    if (!existing) {
      response.status(404).json({ success: false, message: "Purchase requisition was not found" });
      return;
    }
    const data = validation.data;
    if (data.status && data.status !== existing.status) {
      const allowed = prTransitions[existing.status];
      if (!(allowed as readonly string[]).includes(data.status)) {
        response.status(400).json({ success: false, message: `Purchase requisition cannot move from ${existing.status} to ${data.status}` });
        return;
      }
      if (data.status === "REJECTED" && !data.rejectionReason) {
        response.status(400).json({ success: false, message: "Rejection reason is required" });
        return;
      }
    }
    const row = await prisma.purchaseRequisition.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.requiredDate !== undefined ? { requiredDate: data.requiredDate } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.rejectionReason !== undefined ? { rejectionReason: data.rejectionReason } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.status === "SUBMITTED" ? { submittedAt: new Date() } : {}),
        ...(data.status === "APPROVED" ? { approvedAt: new Date(), approvedById: request.auth?.userId ?? null } : {}),
        ...(data.status === "REJECTED" ? { rejectedAt: new Date() } : {}),
        ...(data.status === "DRAFT" ? { rejectedAt: null, rejectionReason: null } : {}),
      },
      include: requisitionInclude,
    });
    await audit(request, "UPDATE", "PurchaseRequisition", id, { status: existing.status }, { status: row.status });
    response.status(200).json({ success: true, message: "Purchase requisition updated successfully", data: row });
  } catch (error) {
    console.error("Unable to update purchase requisition:", error);
    response.status(500).json({ success: false, message: "Unable to update purchase requisition" });
  }
};

// ============================================================
// RFQ
// ============================================================

export const listProcurementRfqsController = async (_request: Request, response: Response) => {
  try {
    const rows = await prisma.procurementRfq.findMany({ include: rfqInclude, orderBy: { createdAt: "desc" } });
    response.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Unable to list RFQs:", error);
    response.status(500).json({ success: false, message: "Unable to load RFQs" });
  }
};

export const getProcurementRfqController = async (request: Request, response: Response) => {
  try {
    const row = await prisma.procurementRfq.findUnique({ where: { id: String(request.params.id) }, include: rfqInclude });
    if (!row) {
      response.status(404).json({ success: false, message: "RFQ was not found" });
      return;
    }
    response.status(200).json({ success: true, data: row });
  } catch (error) {
    console.error("Unable to load RFQ:", error);
    response.status(500).json({ success: false, message: "Unable to load RFQ" });
  }
};

export const createProcurementRfqController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = createProcurementRfqSchema.safeParse(request.body);
    if (!validation.success) {
      badValidation(response, validation, "Please correct the RFQ fields");
      return;
    }
    const data = validation.data;
    const requisition = await prisma.purchaseRequisition.findUnique({ where: { id: data.purchaseRequisitionId } });
    if (!requisition) {
      response.status(404).json({ success: false, message: "Purchase requisition was not found" });
      return;
    }
    if (!["APPROVED", "RFQ_CREATED"].includes(requisition.status)) {
      response.status(400).json({ success: false, message: "Only an approved purchase requisition can be used for an RFQ" });
      return;
    }
    const vendors = await prisma.vendor.findMany({ where: { id: { in: data.vendorIds } } });
    if (vendors.length !== new Set(data.vendorIds).size || vendors.some((v) => v.status !== "ACTIVE")) {
      response.status(400).json({ success: false, message: "Every selected vendor must exist and be active" });
      return;
    }
    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.procurementRfq.create({
        data: {
          rfqNumber: code("RFQ"),
          purchaseRequisitionId: data.purchaseRequisitionId,
          issueDate: data.issueDate ?? null,
          dueDate: data.dueDate ?? null,
          notes: data.notes ?? null,
          createdById: request.auth?.userId ?? null,
          vendors: { create: [...new Set(data.vendorIds)].map((vendorId) => ({ vendorId })) },
          items: {
            create: data.items.map((item) => ({
              purchaseRequisitionItemId: item.purchaseRequisitionItemId ?? null,
              inventoryItemId: item.inventoryItemId ?? null,
              lineNumber: item.lineNumber,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              specification: item.specification ?? null,
              remarks: item.remarks ?? null,
            })),
          },
        },
        include: rfqInclude,
      });
      if (requisition.status === "APPROVED") {
        await tx.purchaseRequisition.update({
          where: { id: requisition.id },
          data: { status: "RFQ_CREATED" },
        });
      }
      return created;
    });
    await audit(request, "CREATE", "ProcurementRfq", row.id, undefined, { rfqNumber: row.rfqNumber, status: row.status });
    response.status(201).json({ success: true, message: "RFQ created successfully", data: row });
  } catch (error) {
    console.error("Unable to create RFQ:", error);
    response.status(500).json({ success: false, message: "Unable to create RFQ" });
  }
};

const rfqTransitions = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["QUOTES_RECEIVED", "CANCELLED"],
  QUOTES_RECEIVED: ["EVALUATED", "CANCELLED"],
  EVALUATED: ["AWARDED", "CANCELLED"],
  AWARDED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
} as const;

export const updateProcurementRfqController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = updateProcurementRfqSchema.safeParse(request.body);
    if (!validation.success) {
      badValidation(response, validation, "Please correct the RFQ fields");
      return;
    }
    const id = String(request.params.id);
    const existing = await prisma.procurementRfq.findUnique({ where: { id } });
    if (!existing) {
      response.status(404).json({ success: false, message: "RFQ was not found" });
      return;
    }
    const data = validation.data;
    if (data.status && data.status !== existing.status) {
      if (!(rfqTransitions[existing.status] as readonly string[]).includes(data.status)) {
        response.status(400).json({ success: false, message: `RFQ cannot move from ${existing.status} to ${data.status}` });
        return;
      }
    }
    const row = await prisma.procurementRfq.update({
      where: { id },
      data: {
        ...(data.issueDate !== undefined ? { issueDate: data.issueDate } : {}),
        ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
      include: rfqInclude,
    });
    await audit(request, "UPDATE", "ProcurementRfq", id, { status: existing.status }, { status: row.status });
    response.status(200).json({ success: true, message: "RFQ updated successfully", data: row });
  } catch (error) {
    console.error("Unable to update RFQ:", error);
    response.status(500).json({ success: false, message: "Unable to update RFQ" });
  }
};

// ============================================================
// VENDOR QUOTATIONS
// ============================================================

export const listVendorQuotationsController = async (_request: Request, response: Response) => {
  try {
    const rows = await prisma.vendorQuotation.findMany({ include: quotationInclude, orderBy: { createdAt: "desc" } });
    response.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Unable to list vendor quotations:", error);
    response.status(500).json({ success: false, message: "Unable to load vendor quotations" });
  }
};

export const createVendorQuotationController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = createVendorQuotationSchema.safeParse(request.body);
    if (!validation.success) {
      badValidation(response, validation, "Please correct the vendor quotation fields");
      return;
    }
    const data = validation.data;
    const rfq = await prisma.procurementRfq.findUnique({
      where: { id: data.rfqId },
      include: { vendors: true, items: true },
    });
    if (!rfq) {
      response.status(404).json({ success: false, message: "RFQ was not found" });
      return;
    }
    if (!rfq.vendors.some((v) => v.vendorId === data.vendorId)) {
      response.status(400).json({ success: false, message: "This vendor was not invited to the RFQ" });
      return;
    }
    const rfqItemIds = new Set(rfq.items.map((i) => i.id));
    if (data.items.some((i) => !rfqItemIds.has(i.rfqItemId))) {
      response.status(400).json({ success: false, message: "Quotation contains an item that does not belong to this RFQ" });
      return;
    }
    const calculated = data.items.map((item) => {
      const base = item.quantity * item.unitPrice;
      const taxAmount = base * item.taxPercent / 100;
      return { ...item, taxAmount, lineTotal: base + taxAmount };
    });
    const subtotal = calculated.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = calculated.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + taxAmount + data.freightAmount;

    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.vendorQuotation.create({
        data: {
          quotationNumber: data.quotationNumber,
          rfqId: data.rfqId,
          vendorId: data.vendorId,
          quotationDate: data.quotationDate ?? new Date(),
          validUntil: data.validUntil ?? null,
          currency: data.currency,
          subtotal,
          taxAmount,
          freightAmount: data.freightAmount,
          totalAmount,
          deliveryDays: data.deliveryDays ?? null,
          paymentTerms: data.paymentTerms ?? null,
          deliveryTerms: data.deliveryTerms ?? null,
          notes: data.notes ?? null,
          items: {
            create: calculated.map((item) => ({
              rfqItemId: item.rfqItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxPercent: item.taxPercent,
              taxAmount: item.taxAmount,
              lineTotal: item.lineTotal,
              deliveryDays: item.deliveryDays ?? null,
              remarks: item.remarks ?? null,
            })),
          },
        },
        include: quotationInclude,
      });
      if (rfq.status === "SENT") {
        await tx.procurementRfq.update({ where: { id: rfq.id }, data: { status: "QUOTES_RECEIVED" } });
      }
      await tx.procurementRfqVendor.update({
        where: { rfqId_vendorId: { rfqId: rfq.id, vendorId: data.vendorId } },
        data: { respondedAt: new Date() },
      });
      return created;
    });
    await audit(request, "CREATE", "VendorQuotation", row.id, undefined, {
      quotationNumber: row.quotationNumber,
      totalAmount: row.totalAmount.toString(),
    });
    response.status(201).json({ success: true, message: "Vendor quotation recorded successfully", data: row });
  } catch (error) {
    console.error("Unable to create vendor quotation:", error);
    response.status(500).json({ success: false, message: "Unable to create vendor quotation" });
  }
};

export const updateVendorQuotationController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = updateVendorQuotationSchema.safeParse(request.body);
    if (!validation.success) {
      badValidation(response, validation, "Please correct the vendor quotation fields");
      return;
    }
    const id = String(request.params.id);
    const existing = await prisma.vendorQuotation.findUnique({ where: { id } });
    if (!existing) {
      response.status(404).json({ success: false, message: "Vendor quotation was not found" });
      return;
    }
    const data = validation.data;
    if (data.status === "SELECTED") {
      const vendor = await prisma.vendor.findUnique({ where: { id: existing.vendorId } });
      if (!vendor || vendor.status !== "ACTIVE") {
        response.status(400).json({ success: false, message: "Only an active vendor quotation can be selected" });
        return;
      }
    }
    const row = await prisma.$transaction(async (tx) => {
      if (data.status === "SELECTED") {
        await tx.vendorQuotation.updateMany({
          where: { rfqId: existing.rfqId, id: { not: id }, status: { in: ["RECEIVED", "UNDER_REVIEW", "SELECTED"] } },
          data: { status: "REJECTED", selectedAt: null },
        });
      }
      const updated = await tx.vendorQuotation.update({
        where: { id },
        data: {
          ...(data.quotationDate !== undefined ? { quotationDate: data.quotationDate } : {}),
          ...(data.validUntil !== undefined ? { validUntil: data.validUntil } : {}),
          ...(data.currency !== undefined ? { currency: data.currency } : {}),
          ...(data.freightAmount !== undefined
            ? { freightAmount: data.freightAmount, totalAmount: Number(existing.subtotal) + Number(existing.taxAmount) + data.freightAmount }
            : {}),
          ...(data.deliveryDays !== undefined ? { deliveryDays: data.deliveryDays } : {}),
          ...(data.paymentTerms !== undefined ? { paymentTerms: data.paymentTerms } : {}),
          ...(data.deliveryTerms !== undefined ? { deliveryTerms: data.deliveryTerms } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.status === "SELECTED" ? { selectedAt: new Date() } : {}),
        },
        include: quotationInclude,
      });
      if (data.status === "SELECTED") {
        await tx.procurementRfq.update({ where: { id: existing.rfqId }, data: { status: "AWARDED" } });
      }
      return updated;
    });
    await audit(request, "UPDATE", "VendorQuotation", id, { status: existing.status }, { status: row.status });
    response.status(200).json({ success: true, message: "Vendor quotation updated successfully", data: row });
  } catch (error) {
    console.error("Unable to update vendor quotation:", error);
    response.status(500).json({ success: false, message: "Unable to update vendor quotation" });
  }
};

// ============================================================
// PURCHASE ORDERS
// ============================================================

export const listPurchaseOrdersController = async (_request: Request, response: Response) => {
  try {
    const rows = await prisma.purchaseOrder.findMany({ include: poInclude, orderBy: { createdAt: "desc" } });
    response.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Unable to list purchase orders:", error);
    response.status(500).json({ success: false, message: "Unable to load purchase orders" });
  }
};

export const getPurchaseOrderController = async (request: Request, response: Response) => {
  try {
    const row = await prisma.purchaseOrder.findUnique({ where: { id: String(request.params.id) }, include: poInclude });
    if (!row) {
      response.status(404).json({ success: false, message: "Purchase order was not found" });
      return;
    }
    response.status(200).json({ success: true, data: row });
  } catch (error) {
    console.error("Unable to load purchase order:", error);
    response.status(500).json({ success: false, message: "Unable to load purchase order" });
  }
};

export const createPurchaseOrderController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = createPurchaseOrderSchema.safeParse(request.body);
    if (!validation.success) {
      badValidation(response, validation, "Please correct the purchase order fields");
      return;
    }
    const data = validation.data;
    const vendor = await prisma.vendor.findUnique({ where: { id: data.vendorId } });
    if (!vendor || vendor.status !== "ACTIVE") {
      response.status(400).json({ success: false, message: "Purchase orders can only be created for an active vendor" });
      return;
    }
    if (data.vendorQuotationId) {
      const quotation = await prisma.vendorQuotation.findUnique({ where: { id: data.vendorQuotationId } });
      if (!quotation || quotation.vendorId !== data.vendorId || quotation.status !== "SELECTED") {
        response.status(400).json({ success: false, message: "Purchase order quotation must be selected and belong to the same vendor" });
        return;
      }
    }
    const calculated = data.items.map((item) => {
      const base = item.quantity * item.unitPrice;
      const taxAmount = base * item.taxPercent / 100;
      return { ...item, taxAmount, lineTotal: base + taxAmount };
    });
    const subtotal = calculated.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = calculated.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + taxAmount + data.freightAmount;
    const row = await prisma.purchaseOrder.create({
      data: {
        poNumber: code("PO"),
        vendorId: data.vendorId,
        vendorQuotationId: data.vendorQuotationId ?? null,
        purchaseRequisitionId: data.purchaseRequisitionId ?? null,
        orderDate: data.orderDate ?? new Date(),
        expectedDeliveryDate: data.expectedDeliveryDate ?? null,
        currency: data.currency,
        subtotal,
        taxAmount,
        freightAmount: data.freightAmount,
        totalAmount,
        paymentTerms: data.paymentTerms ?? null,
        deliveryTerms: data.deliveryTerms ?? null,
        notes: data.notes ?? null,
        createdById: request.auth?.userId ?? null,
        items: {
          create: calculated.map((item) => ({
            purchaseRequisitionItemId: item.purchaseRequisitionItemId ?? null,
            inventoryItemId: item.inventoryItemId ?? null,
            lineNumber: item.lineNumber,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            taxPercent: item.taxPercent,
            taxAmount: item.taxAmount,
            lineTotal: item.lineTotal,
            remarks: item.remarks ?? null,
          })),
        },
      },
      include: poInclude,
    });
    await audit(request, "CREATE", "PurchaseOrder", row.id, undefined, {
      poNumber: row.poNumber,
      totalAmount: row.totalAmount.toString(),
      status: row.status,
    });
    response.status(201).json({ success: true, message: "Purchase order created successfully", data: row });
  } catch (error) {
    console.error("Unable to create purchase order:", error);
    response.status(500).json({ success: false, message: "Unable to create purchase order" });
  }
};

const poTransitions = {
  DRAFT: ["APPROVED", "CANCELLED"],
  APPROVED: ["SENT", "CANCELLED"],
  SENT: ["PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"],
  PARTIALLY_RECEIVED: ["RECEIVED", "CLOSED"],
  RECEIVED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
} as const;

export const updatePurchaseOrderController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = updatePurchaseOrderSchema.safeParse(request.body);
    if (!validation.success) {
      badValidation(response, validation, "Please correct the purchase order fields");
      return;
    }
    const id = String(request.params.id);
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) {
      response.status(404).json({ success: false, message: "Purchase order was not found" });
      return;
    }
    const data = validation.data;
    if (data.status && data.status !== existing.status) {
      if (!(poTransitions[existing.status] as readonly string[]).includes(data.status)) {
        response.status(400).json({ success: false, message: `Purchase order cannot move from ${existing.status} to ${data.status}` });
        return;
      }
    }
    const row = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...(data.expectedDeliveryDate !== undefined ? { expectedDeliveryDate: data.expectedDeliveryDate } : {}),
        ...(data.freightAmount !== undefined
          ? { freightAmount: data.freightAmount, totalAmount: Number(existing.subtotal) + Number(existing.taxAmount) + data.freightAmount }
          : {}),
        ...(data.paymentTerms !== undefined ? { paymentTerms: data.paymentTerms } : {}),
        ...(data.deliveryTerms !== undefined ? { deliveryTerms: data.deliveryTerms } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.status === "APPROVED" ? { approvedAt: new Date(), approvedById: request.auth?.userId ?? null } : {}),
        ...(data.status === "SENT" ? { sentAt: new Date() } : {}),
      },
      include: poInclude,
    });
    await audit(request, "UPDATE", "PurchaseOrder", id, { status: existing.status }, { status: row.status });
    response.status(200).json({ success: true, message: "Purchase order updated successfully", data: row });
  } catch (error) {
    console.error("Unable to update purchase order:", error);
    response.status(500).json({ success: false, message: "Unable to update purchase order" });
  }
};

// ============================================================
// GOODS RECEIPT NOTES
// ============================================================

export const listGoodsReceiptNotesController = async (_request: Request, response: Response) => {
  try {
    const rows = await prisma.goodsReceiptNote.findMany({ include: grnInclude, orderBy: { createdAt: "desc" } });
    response.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Unable to list GRNs:", error);
    response.status(500).json({ success: false, message: "Unable to load goods receipt notes" });
  }
};

export const getGoodsReceiptNoteController = async (request: Request, response: Response) => {
  try {
    const row = await prisma.goodsReceiptNote.findUnique({ where: { id: String(request.params.id) }, include: grnInclude });
    if (!row) {
      response.status(404).json({ success: false, message: "Goods receipt note was not found" });
      return;
    }
    response.status(200).json({ success: true, data: row });
  } catch (error) {
    console.error("Unable to load GRN:", error);
    response.status(500).json({ success: false, message: "Unable to load goods receipt note" });
  }
};

export const createGoodsReceiptNoteController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = createGoodsReceiptNoteSchema.safeParse(request.body);
    if (!validation.success) {
      badValidation(response, validation, "Please correct the GRN fields");
      return;
    }
    const data = validation.data;
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: data.purchaseOrderId },
      include: { items: true },
    });
    if (!po) {
      response.status(404).json({ success: false, message: "Purchase order was not found" });
      return;
    }
    if (!["SENT", "PARTIALLY_RECEIVED"].includes(po.status)) {
      response.status(400).json({ success: false, message: "Goods can only be received against a sent purchase order" });
      return;
    }
    const poItems = new Map(po.items.map((item) => [item.id, item]));
    for (const item of data.items) {
      const poItem = poItems.get(item.purchaseOrderItemId);
      if (!poItem) {
        response.status(400).json({ success: false, message: "A GRN item does not belong to this purchase order" });
        return;
      }
      if (!poItem.inventoryItemId || poItem.inventoryItemId !== item.inventoryItemId) {
        response.status(400).json({ success: false, message: "Every GRN line must use the inventory item assigned to its purchase order line" });
        return;
      }
      const remaining = Number(poItem.quantity) - Number(poItem.receivedQuantity);
      if (item.receivedQuantity > remaining) {
        response.status(400).json({ success: false, message: `Received quantity exceeds the remaining PO quantity for line ${poItem.lineNumber}` });
        return;
      }
    }
    const row = await prisma.goodsReceiptNote.create({
      data: {
        grnNumber: code("GRN"),
        purchaseOrderId: po.id,
        vendorId: po.vendorId,
        receiptDate: data.receiptDate ?? new Date(),
        challanNumber: data.challanNumber ?? null,
        invoiceNumber: data.invoiceNumber ?? null,
        notes: data.notes ?? null,
        receivedById: request.auth?.userId ?? null,
        items: {
          create: data.items.map((item) => ({
            purchaseOrderItemId: item.purchaseOrderItemId,
            inventoryItemId: item.inventoryItemId,
            receivedQuantity: item.receivedQuantity,
            acceptedQuantity: item.acceptedQuantity,
            rejectedQuantity: item.rejectedQuantity,
            unitCost: item.unitCost,
            remarks: item.remarks ?? null,
          })),
        },
      },
      include: grnInclude,
    });
    await audit(request, "CREATE", "GoodsReceiptNote", row.id, undefined, { grnNumber: row.grnNumber, status: row.status });
    response.status(201).json({ success: true, message: "Goods receipt note created successfully", data: row });
  } catch (error) {
    console.error("Unable to create GRN:", error);
    response.status(500).json({ success: false, message: "Unable to create goods receipt note" });
  }
};

const grnTransitions = {
  DRAFT: ["RECEIVED"],
  RECEIVED: ["INSPECTED"],
  INSPECTED: ["ACCEPTED", "REJECTED", "PARTIALLY_ACCEPTED"],
  ACCEPTED: [],
  REJECTED: [],
  PARTIALLY_ACCEPTED: [],
} as const;

export const updateGoodsReceiptNoteController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const validation = updateGoodsReceiptNoteSchema.safeParse(request.body);
    if (!validation.success) {
      badValidation(response, validation, "Please correct the GRN fields");
      return;
    }
    const id = String(request.params.id);
    const existing = await prisma.goodsReceiptNote.findUnique({ where: { id } });
    if (!existing) {
      response.status(404).json({ success: false, message: "Goods receipt note was not found" });
      return;
    }
    if (existing.postedAt) {
      response.status(400).json({ success: false, message: "A posted GRN cannot be edited" });
      return;
    }
    const data = validation.data;
    if (data.status && data.status !== existing.status) {
      if (!(grnTransitions[existing.status] as readonly string[]).includes(data.status)) {
        response.status(400).json({ success: false, message: `GRN cannot move from ${existing.status} to ${data.status}` });
        return;
      }
    }
    const row = await prisma.goodsReceiptNote.update({
      where: { id },
      data: {
        ...(data.receiptDate !== undefined ? { receiptDate: data.receiptDate } : {}),
        ...(data.challanNumber !== undefined ? { challanNumber: data.challanNumber } : {}),
        ...(data.invoiceNumber !== undefined ? { invoiceNumber: data.invoiceNumber } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.status === "INSPECTED" ? { inspectedAt: new Date() } : {}),
      },
      include: grnInclude,
    });
    await audit(request, "UPDATE", "GoodsReceiptNote", id, { status: existing.status }, { status: row.status });
    response.status(200).json({ success: true, message: "Goods receipt note updated successfully", data: row });
  } catch (error) {
    console.error("Unable to update GRN:", error);
    response.status(500).json({ success: false, message: "Unable to update goods receipt note" });
  }
};

export const postGoodsReceiptNoteController = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const id = String(request.params.id);
    const result = await prisma.$transaction(async (tx) => {
      const grn = await tx.goodsReceiptNote.findUnique({
        where: { id },
        include: { items: true, purchaseOrder: { include: { items: true } } },
      });
      if (!grn) return { kind: "NOT_FOUND" as const };
      if (grn.postedAt) return { kind: "ALREADY_POSTED" as const };
      if (!["ACCEPTED", "PARTIALLY_ACCEPTED"].includes(grn.status)) {
        return { kind: "NOT_ACCEPTED" as const };
      }

      for (const line of grn.items) {
        const accepted = Number(line.acceptedQuantity);
        if (accepted <= 0) continue;

        const inventoryItem = await tx.inventoryItem.findUnique({ where: { id: line.inventoryItemId } });
        if (!inventoryItem) return { kind: "ITEM_NOT_FOUND" as const };
        if (!inventoryItem.isActive) return { kind: "ITEM_INACTIVE" as const };

        const nextStock = Number(inventoryItem.currentStock) + accepted;
        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: { currentStock: nextStock, unitCost: line.unitCost },
        });
        await tx.stockMovement.create({
          data: {
            inventoryItemId: inventoryItem.id,
            movementType: "RECEIPT",
            quantity: accepted,
            balanceAfter: nextStock,
            unitCost: line.unitCost,
            referenceType: "GRN",
            referenceNumber: grn.grnNumber,
            notes: `Goods receipt against PO ${grn.purchaseOrder.poNumber}`,
            createdById: request.auth?.userId ?? null,
          },
        });
        await tx.purchaseOrderItem.update({
          where: { id: line.purchaseOrderItemId },
          data: { receivedQuantity: { increment: accepted } },
        });
      }

      const refreshedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: grn.purchaseOrderId },
      });
      const allReceived = refreshedItems.every((item) => Number(item.receivedQuantity) >= Number(item.quantity));
      const anyReceived = refreshedItems.some((item) => Number(item.receivedQuantity) > 0);
      const poStatus = allReceived ? "RECEIVED" : anyReceived ? "PARTIALLY_RECEIVED" : "SENT";

      await tx.purchaseOrder.update({
        where: { id: grn.purchaseOrderId },
        data: { status: poStatus },
      });
      const posted = await tx.goodsReceiptNote.update({
        where: { id },
        data: { postedAt: new Date() },
        include: grnInclude,
      });
      return { kind: "SUCCESS" as const, grn: posted, poStatus };
    });

    if (result.kind === "NOT_FOUND") {
      response.status(404).json({ success: false, message: "Goods receipt note was not found" });
      return;
    }
    if (result.kind === "ALREADY_POSTED") {
      response.status(400).json({ success: false, message: "This GRN has already been posted" });
      return;
    }
    if (result.kind === "NOT_ACCEPTED") {
      response.status(400).json({ success: false, message: "Only accepted or partially accepted GRNs can be posted" });
      return;
    }
    if (result.kind === "ITEM_NOT_FOUND") {
      response.status(400).json({ success: false, message: "An inventory item on the GRN no longer exists" });
      return;
    }
    if (result.kind === "ITEM_INACTIVE") {
      response.status(400).json({ success: false, message: "Stock cannot be received into an inactive inventory item" });
      return;
    }

    await audit(request, "POST_GRN", "GoodsReceiptNote", result.grn.id, undefined, {
      grnNumber: result.grn.grnNumber,
      purchaseOrderStatus: result.poStatus,
      postedAt: result.grn.postedAt?.toISOString() ?? null,
    });
    response.status(200).json({
      success: true,
      message: "GRN posted and inventory updated successfully",
      data: result.grn,
    });
  } catch (error) {
    console.error("Unable to post GRN:", error);
    response.status(500).json({ success: false, message: "Unable to post goods receipt note" });
  }
};
