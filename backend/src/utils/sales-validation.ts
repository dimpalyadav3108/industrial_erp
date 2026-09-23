import { z } from "zod";

const item = z.object({
  lineNumber: z.number().int().positive(),
  description: z.string().trim().min(1),
  quantity: z.number().positive(),
  unit: z.string().trim().min(1),
  unitPrice: z.number().min(0),
  discountPercent: z.number().min(0).max(100).default(0),
  taxPercent: z.number().min(0).max(100).default(18),
  remarks: z.string().trim().optional(),
});

export const createSalesOrderSchema = z.object({
  quotationId: z.string().uuid().optional(),
  customerId: z.string().uuid(),
  orderDate: z.coerce.date().optional(),
  customerPoNumber: z.string().trim().optional(),
  customerPoDate: z.coerce.date().optional(),
  expectedDeliveryDate: z.coerce.date().optional(),
  currency: z.string().trim().min(3).max(3).default("INR"),
  freightAmount: z.number().min(0).default(0),
  paymentTerms: z.string().trim().optional(),
  deliveryTerms: z.string().trim().optional(),
  billingAddress: z.string().trim().optional(),
  shippingAddress: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  advanceDueAmount: z.number().min(0).default(0),
  items: z.array(item).min(1),
});

export const updateSalesOrderSchema = z.object({
  customerPoNumber: z.string().trim().nullable().optional(),
  customerPoDate: z.coerce.date().nullable().optional(),
  expectedDeliveryDate: z.coerce.date().nullable().optional(),
  freightAmount: z.number().min(0).optional(),
  paymentTerms: z.string().trim().nullable().optional(),
  deliveryTerms: z.string().trim().nullable().optional(),
  billingAddress: z.string().trim().nullable().optional(),
  shippingAddress: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  status: z.enum(["DRAFT","CONFIRMED","ADVANCE_PENDING","ADVANCE_RECEIVED","IN_PRODUCTION","READY_FOR_DISPATCH","DISPATCHED","INSTALLED","COMMISSIONED","CLOSED","CANCELLED"]).optional(),
});

export const customerApprovalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reference: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const createInvoiceSchema = z.object({
  salesOrderId: z.string().uuid(),
  type: z.enum(["PROFORMA", "TAX"]).default("TAX"),
  invoiceDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  billingAddress: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const updateInvoiceSchema = z.object({
  dueDate: z.coerce.date().nullable().optional(),
  billingAddress: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  status: z.enum(["DRAFT","ISSUED","CANCELLED"]).optional(),
});

export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid().optional(),
  salesOrderId: z.string().uuid().optional(),
  type: z.enum(["ADVANCE","MILESTONE","FINAL"]).default("FINAL"),
  paymentDate: z.coerce.date().optional(),
  amount: z.number().positive(),
  method: z.enum(["CASH","BANK_TRANSFER","UPI","CHEQUE","CARD","OTHER"]),
  referenceNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
}).refine((v) => Boolean(v.invoiceId || v.salesOrderId), { message: "Invoice or sales order is required" });

export const createDispatchNoteSchema = z.object({
  salesOrderId: z.string().uuid(),
  status: z.enum(["DRAFT","READY","DISPATCHED","DELIVERED","CANCELLED"]).default("DRAFT"),
  dispatchDate: z.coerce.date().optional(),
  destination: z.string().trim().optional(),
  transporterName: z.string().trim().optional(),
  vehicleNumber: z.string().trim().optional(),
  lrNumber: z.string().trim().optional(),
  packageCount: z.number().int().positive().default(1),
  notes: z.string().trim().optional(),
  items: z.array(z.object({
    lineNumber: z.number().int().positive(),
    description: z.string().trim().min(1),
    quantity: z.number().positive(),
    unit: z.string().trim().min(1),
    serialNumber: z.string().trim().optional(),
    packageDetails: z.string().trim().optional(),
  })).min(1),
});

export const createEWayBillSchema = z.object({
  salesOrderId: z.string().uuid(),
  dispatchNoteId: z.string().uuid().optional(),
  eWayBillNumber: z.string().trim().min(1),
  vehicleNumber: z.string().trim().optional(),
  transporterId: z.string().trim().optional(),
  transporterName: z.string().trim().optional(),
  distanceKm: z.number().min(0).optional(),
  validUntil: z.coerce.date().optional(),
  notes: z.string().trim().optional(),
});

export const linkSalesOrderSchema = z.object({
  productionOrderId: z.string().uuid().optional(),
  dispatchId: z.string().uuid().optional(),
  installationId: z.string().uuid().optional(),
}).refine((v) => Boolean(v.productionOrderId || v.dispatchId || v.installationId), { message: "A production order, dispatch or installation is required" });
