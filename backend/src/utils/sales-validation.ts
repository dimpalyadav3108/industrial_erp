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
  status: z.enum(["DRAFT","CONFIRMED","IN_PROGRESS","READY_TO_INVOICE","COMPLETED","CANCELLED"]).optional(),
});

export const createInvoiceSchema = z.object({
  salesOrderId: z.string().uuid(),
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
  invoiceId: z.string().uuid(),
  paymentDate: z.coerce.date().optional(),
  amount: z.number().positive(),
  method: z.enum(["CASH","BANK_TRANSFER","UPI","CHEQUE","CARD","OTHER"]),
  referenceNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
