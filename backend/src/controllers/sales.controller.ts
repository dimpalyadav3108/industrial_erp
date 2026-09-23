import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/database.js";
import {
  createInvoiceSchema,
  createPaymentSchema,
  createSalesOrderSchema,
  updateInvoiceSchema,
  updateSalesOrderSchema,
} from "../utils/sales-validation.js";

type AuthenticatedRequest = Request & { auth?: { userId: string } };

const code = (prefix: string) =>
  `${prefix}-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;

const n = (v: unknown) => Number(v ?? 0);

const audit = async (
  r: AuthenticatedRequest,
  action: string,
  entity: string,
  entityId: string,
  newValues?: Prisma.InputJsonValue
) => {
  await prisma.auditLog.create({
    data: {
      userId: r.auth?.userId ?? null,
      action,
      entity,
      entityId,
      ...(newValues !== undefined ? { newValues } : {}),
      ipAddress: r.ip ?? null,
    },
  });
};

const bad = (
  res: Response,
  e: { error: { flatten(): { fieldErrors: unknown } } }
) =>
  res.status(400).json({
    success: false,
    message: "Please correct the fields",
    errors: e.error.flatten().fieldErrors,
  });

const orderInclude = {
  customer: true,
  quotation: {
    include: {
      estimate: { include: { lead: { include: { customer: true } } } },
    },
  },
  items: { orderBy: { lineNumber: "asc" as const } },
  invoices: true,
} as const;

const invoiceInclude = {
  customer: true,
  salesOrder: true,
  items: { orderBy: { lineNumber: "asc" as const } },
  payments: { orderBy: { paymentDate: "desc" as const } },
} as const;

export const listEligibleQuotationsController = async (
  _r: Request,
  res: Response
) => {
  const rows = await prisma.quotation.findMany({
    where: {
      status: { in: ["ACCEPTED", "CONVERTED"] },
      salesOrder: null,
    },
    include: {
      estimate: {
        include: {
          lead: { include: { customer: true } },
          items: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, data: rows });
};

export const listSalesOrdersController = async (
  _r: Request,
  res: Response
) => {
  try {
    const rows = await prisma.salesOrder.findMany({
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Unable to load sales orders" });
  }
};

export const getSalesOrderController = async (r: Request, res: Response) => {
  const row = await prisma.salesOrder.findUnique({
    where: { id: String(r.params.id) },
    include: orderInclude,
  });

  if (!row) {
    res.status(404).json({ success: false, message: "Sales order not found" });
    return;
  }

  res.json({ success: true, data: row });
};

export const createSalesOrderController = async (
  r: AuthenticatedRequest,
  res: Response
) => {
  const v = createSalesOrderSchema.safeParse(r.body);
  if (!v.success) {
    bad(res, v);
    return;
  }

  const d = v.data;

  if (d.quotationId) {
    const q = await prisma.quotation.findUnique({
      where: { id: d.quotationId },
      include: { estimate: { include: { lead: true } } },
    });

    if (!q) {
      res.status(404).json({ success: false, message: "Quotation not found" });
      return;
    }

    if (!["ACCEPTED", "CONVERTED"].includes(q.status)) {
      res.status(400).json({
        success: false,
        message: "Quotation must be accepted before creating a sales order",
      });
      return;
    }

    if (q.estimate.lead.customerId && q.estimate.lead.customerId !== d.customerId) {
      res.status(400).json({
        success: false,
        message: "Selected customer does not match quotation customer",
      });
      return;
    }
  }

  const settings = await prisma.companySettings.findUnique({ where: { id: "company" } });
  const prefix = settings?.salesOrderPrefix ?? "SO";

  const calc = d.items.map((i) => {
    const gross = i.quantity * i.unitPrice;
    const taxable = gross * (1 - i.discountPercent / 100);
    const tax = (taxable * i.taxPercent) / 100;

    return {
      lineNumber: i.lineNumber,
      description: i.description,
      quantity: i.quantity,
      unit: i.unit,
      unitPrice: i.unitPrice,
      discountPercent: i.discountPercent,
      taxPercent: i.taxPercent,
      taxableAmount: taxable,
      taxAmount: tax,
      lineTotal: taxable + tax,
      ...(i.remarks !== undefined ? { remarks: i.remarks } : {}),
    };
  });

  const subtotal = calc.reduce((a, i) => a + i.quantity * i.unitPrice, 0);
  const discount = calc.reduce(
    (a, i) => a + (i.quantity * i.unitPrice - i.taxableAmount),
    0
  );
  const tax = calc.reduce((a, i) => a + i.taxAmount, 0);
  const total = subtotal - discount + tax + d.freightAmount;

  const row = await prisma.salesOrder.create({
    data: {
      salesOrderNumber: code(prefix),
      customerId: d.customerId,
      ...(d.quotationId !== undefined ? { quotationId: d.quotationId } : {}),
      ...(d.orderDate !== undefined ? { orderDate: d.orderDate } : {}),
      currency: d.currency,
      ...(d.customerPoNumber !== undefined ? { customerPoNumber: d.customerPoNumber } : {}),
      ...(d.customerPoDate !== undefined ? { customerPoDate: d.customerPoDate } : {}),
      ...(d.expectedDeliveryDate !== undefined
        ? { expectedDeliveryDate: d.expectedDeliveryDate }
        : {}),
      subtotal,
      discountAmount: discount,
      taxAmount: tax,
      freightAmount: d.freightAmount,
      totalAmount: total,
      ...(d.paymentTerms !== undefined ? { paymentTerms: d.paymentTerms } : {}),
      ...(d.deliveryTerms !== undefined ? { deliveryTerms: d.deliveryTerms } : {}),
      ...(d.billingAddress !== undefined ? { billingAddress: d.billingAddress } : {}),
      ...(d.shippingAddress !== undefined ? { shippingAddress: d.shippingAddress } : {}),
      ...(d.notes !== undefined ? { notes: d.notes } : {}),
      createdById: r.auth?.userId ?? null,
      items: { create: calc },
    },
    include: orderInclude,
  });

  if (d.quotationId) {
    await prisma.quotation.update({
      where: { id: d.quotationId },
      data: { status: "CONVERTED" },
    });
  }

  await audit(r, "CREATE", "SalesOrder", row.id, {
    salesOrderNumber: row.salesOrderNumber,
  });

  res.status(201).json({
    success: true,
    message: "Sales order created successfully",
    data: row,
  });
};

export const updateSalesOrderController = async (
  r: AuthenticatedRequest,
  res: Response
) => {
  const v = updateSalesOrderSchema.safeParse(r.body);
  if (!v.success) {
    bad(res, v);
    return;
  }

  const id = String(r.params.id);
  const old = await prisma.salesOrder.findUnique({ where: { id } });

  if (!old) {
    res.status(404).json({ success: false, message: "Sales order not found" });
    return;
  }

  const allowed: Record<string, string[]> = {
    DRAFT: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["IN_PROGRESS", "READY_TO_INVOICE", "CANCELLED"],
    IN_PROGRESS: ["READY_TO_INVOICE", "CANCELLED"],
    READY_TO_INVOICE: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
  };

  const nextAllowed = allowed[old.status] ?? [];
  if (v.data.status && !nextAllowed.includes(v.data.status)) {
    res.status(400).json({
      success: false,
      message: `Cannot change sales order from ${old.status} to ${v.data.status}`,
    });
    return;
  }

  const data: any = { ...v.data };
  if (v.data.status === "CONFIRMED") {
    data.confirmedAt = new Date();
    data.confirmedById = r.auth?.userId ?? null;
  }
  if (v.data.status === "COMPLETED") data.completedAt = new Date();

  const row = await prisma.salesOrder.update({
    where: { id },
    data,
    include: orderInclude,
  });

  await audit(r, "UPDATE", "SalesOrder", id, { status: row.status });
  res.json({ success: true, message: "Sales order updated successfully", data: row });
};

export const listInvoicesController = async (_r: Request, res: Response) => {
  const rows = await prisma.salesInvoice.findMany({
    include: invoiceInclude,
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, data: rows });
};

export const createInvoiceController = async (
  r: AuthenticatedRequest,
  res: Response
) => {
  const v = createInvoiceSchema.safeParse(r.body);
  if (!v.success) {
    bad(res, v);
    return;
  }

  const d = v.data;
  const so = await prisma.salesOrder.findUnique({
    where: { id: d.salesOrderId },
    include: { items: true, customer: true },
  });

  if (!so) {
    res.status(404).json({ success: false, message: "Sales order not found" });
    return;
  }

  if (!["CONFIRMED", "IN_PROGRESS", "READY_TO_INVOICE"].includes(so.status)) {
    res.status(400).json({
      success: false,
      message: "Sales order must be confirmed before invoicing",
    });
    return;
  }

  const existingInvoice = await prisma.salesInvoice.findFirst({
    where: { salesOrderId: so.id, status: { not: "CANCELLED" } },
  });

  if (existingInvoice) {
    res.status(409).json({
      success: false,
      message: "An active invoice already exists for this sales order",
    });
    return;
  }

  const settings = await prisma.companySettings.findUnique({ where: { id: "company" } });

  const row = await prisma.salesInvoice.create({
    data: {
      invoiceNumber: code(settings?.invoicePrefix ?? "INV"),
      salesOrderId: so.id,
      customerId: so.customerId,
      ...(d.invoiceDate !== undefined ? { invoiceDate: d.invoiceDate } : {}),
      ...(d.dueDate !== undefined ? { dueDate: d.dueDate } : {}),
      currency: so.currency,
      subtotal: so.subtotal,
      discountAmount: so.discountAmount,
      taxAmount: so.taxAmount,
      freightAmount: so.freightAmount,
      totalAmount: so.totalAmount,
      balanceAmount: so.totalAmount,
      billingAddress: d.billingAddress ?? so.billingAddress,
      ...(d.notes !== undefined ? { notes: d.notes } : {}),
      createdById: r.auth?.userId ?? null,
      items: {
        create: so.items.map((i) => ({
          lineNumber: i.lineNumber,
          description: i.description,
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: i.unitPrice,
          discountPercent: i.discountPercent,
          taxPercent: i.taxPercent,
          taxableAmount: i.taxableAmount,
          taxAmount: i.taxAmount,
          lineTotal: i.lineTotal,
        })),
      },
    },
    include: invoiceInclude,
  });

  await audit(r, "CREATE", "SalesInvoice", row.id, {
    invoiceNumber: row.invoiceNumber,
  });

  res.status(201).json({
    success: true,
    message: "Invoice created successfully",
    data: row,
  });
};

export const updateInvoiceController = async (
  r: AuthenticatedRequest,
  res: Response
) => {
  const v = updateInvoiceSchema.safeParse(r.body);
  if (!v.success) {
    bad(res, v);
    return;
  }

  const id = String(r.params.id);
  const old = await prisma.salesInvoice.findUnique({ where: { id } });

  if (!old) {
    res.status(404).json({ success: false, message: "Invoice not found" });
    return;
  }

  if (["PAID", "CANCELLED"].includes(old.status)) {
    res.status(400).json({
      success: false,
      message: "Paid or cancelled invoices cannot be edited",
    });
    return;
  }

  const data: any = { ...v.data };
  if (v.data.status === "ISSUED") data.issuedAt = new Date();

  const row = await prisma.salesInvoice.update({
    where: { id },
    data,
    include: invoiceInclude,
  });

  await audit(r, "UPDATE", "SalesInvoice", id, { status: row.status });
  res.json({ success: true, message: "Invoice updated successfully", data: row });
};

export const createPaymentController = async (
  r: AuthenticatedRequest,
  res: Response
) => {
  const v = createPaymentSchema.safeParse(r.body);
  if (!v.success) {
    bad(res, v);
    return;
  }

  const d = v.data;
  const inv = await prisma.salesInvoice.findUnique({ where: { id: d.invoiceId } });

  if (!inv) {
    res.status(404).json({ success: false, message: "Invoice not found" });
    return;
  }

  if (!["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(inv.status)) {
    res.status(400).json({
      success: false,
      message: "Invoice must be issued before recording payment",
    });
    return;
  }

  if (d.amount > n(inv.balanceAmount)) {
    res.status(400).json({
      success: false,
      message: "Payment cannot exceed invoice balance",
    });
    return;
  }

  const settings = await prisma.companySettings.findUnique({ where: { id: "company" } });

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.salesPayment.create({
      data: {
        invoiceId: inv.id,
        paymentNumber: code(settings?.paymentPrefix ?? "PAY"),
        ...(d.paymentDate !== undefined ? { paymentDate: d.paymentDate } : {}),
        amount: d.amount,
        method: d.method,
        ...(d.referenceNumber !== undefined ? { referenceNumber: d.referenceNumber } : {}),
        ...(d.notes !== undefined ? { notes: d.notes } : {}),
        recordedById: r.auth?.userId ?? null,
      },
    });

    const paid = n(inv.paidAmount) + d.amount;
    const balance = Math.max(0, n(inv.totalAmount) - paid);
    const status = balance === 0 ? "PAID" : "PARTIALLY_PAID";

    const invoice = await tx.salesInvoice.update({
      where: { id: inv.id },
      data: {
        paidAmount: paid,
        balanceAmount: balance,
        status,
        paidAt: balance === 0 ? new Date() : null,
      },
      include: invoiceInclude,
    });

    if (balance === 0) {
      await tx.salesOrder.update({
        where: { id: inv.salesOrderId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    }

    return { payment, invoice };
  });

  await audit(r, "CREATE", "SalesPayment", result.payment.id, {
    paymentNumber: result.payment.paymentNumber,
    amount: d.amount,
  });

  res.status(201).json({
    success: true,
    message: "Payment recorded successfully",
    data: result,
  });
};
