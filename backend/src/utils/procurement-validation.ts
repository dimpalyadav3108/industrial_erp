import { z } from "zod";

// ============================================================
// COMMON HELPERS
// ============================================================

const numberField = (label: string) =>
  z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? 0
        : Number(value),
    z
      .number()
      .finite(`${label} must be a number`)
      .nonnegative(`${label} cannot be negative`)
  );

const positiveNumber = (label: string) =>
  z.preprocess(
    (value) => Number(value),
    z
      .number()
      .finite(`${label} must be a number`)
      .positive(`${label} must be greater than zero`)
  );

const optionalNumber = (label: string) =>
  z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? undefined
        : Number(value),
    z
      .number()
      .finite(`${label} must be a number`)
      .nonnegative(`${label} cannot be negative`)
      .optional()
  );

const integerField = (label: string) =>
  z.preprocess(
    (value) => Number(value),
    z
      .number()
      .int(`${label} must be a whole number`)
      .positive(`${label} must be greater than zero`)
  );

const optionalInteger = (label: string) =>
  z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? undefined
        : Number(value),
    z
      .number()
      .int(`${label} must be a whole number`)
      .nonnegative(`${label} cannot be negative`)
      .optional()
  );

const optionalText = (maximum = 1000) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === ""
        ? undefined
        : value,
    z.string().trim().max(maximum).optional()
  );

const optionalId = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === ""
      ? undefined
      : value,
  z.string().trim().min(1).optional()
);

const requiredDate = (label: string) =>
  z.preprocess(
    (value) => {
      if (value instanceof Date) return value;

      if (typeof value === "string" || typeof value === "number") {
        return new Date(value);
      }

      return value;
    },
    z.date({
      error: `${label} must be a valid date`,
    })
  );

const optionalDate = (label: string) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }

      if (value instanceof Date) return value;

      if (typeof value === "string" || typeof value === "number") {
        return new Date(value);
      }

      return value;
    },
    z
      .date({
        error: `${label} must be a valid date`,
      })
      .optional()
  );

// ============================================================
// ENUMS
// ============================================================

export const vendorStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "BLOCKED",
]);

export const purchaseRequisitionStatusSchema = z.enum([
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "RFQ_CREATED",
  "CLOSED",
  "CANCELLED",
]);

export const rfqStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "QUOTES_RECEIVED",
  "EVALUATED",
  "AWARDED",
  "CLOSED",
  "CANCELLED",
]);

export const vendorQuotationStatusSchema = z.enum([
  "RECEIVED",
  "UNDER_REVIEW",
  "SELECTED",
  "REJECTED",
]);

export const purchaseOrderStatusSchema = z.enum([
  "DRAFT",
  "APPROVED",
  "SENT",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CLOSED",
  "CANCELLED",
]);

export const grnStatusSchema = z.enum([
  "DRAFT",
  "RECEIVED",
  "INSPECTED",
  "ACCEPTED",
  "REJECTED",
  "PARTIALLY_ACCEPTED",
]);

// ============================================================
// VENDOR
// ============================================================

export const createVendorPortalDocumentSchema = z.object({
  documentType: z.string().min(2),
  fileName: z.string().min(1),
  fileUrl: z.string().optional(),
  invoiceNumber: z.string().optional(),
  dispatchNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const createVendorRatingSchema = z.object({
  purchaseOrderId: z.string().optional(),
  qualityScore: z.coerce.number().min(0).max(100),
  deliveryScore: z.coerce.number().min(0).max(100),
  priceScore: z.coerce.number().min(0).max(100),
  serviceScore: z.coerce.number().min(0).max(100),
  remarks: z.string().optional(),
});

export const createMaterialPlanSchema = z.object({
  title: z.string().min(2),
  salesOrderId: z.string().optional(),
  shortageValue: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

export const createVendorSchema = z.object({
  name: z.string().trim().min(2, "Vendor name must contain at least 2 characters").max(200),
  contactPerson: optionalText(150),
  email: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().email("Enter a valid email address").max(200).optional()
  ),
  phone: optionalText(30),
  alternatePhone: optionalText(30),
  gstNumber: optionalText(50),
  panNumber: optionalText(50),
  address: optionalText(1000),
  city: optionalText(100),
  state: optionalText(100),
  country: z.string().trim().min(1).max(100).default("India"),
  postalCode: optionalText(20),
  paymentTerms: optionalText(500),
  deliveryTerms: optionalText(500),
  rating: z.preprocess(
    (value) => value === "" || value === null || value === undefined ? undefined : Number(value),
    z.number().min(0).max(5).optional()
  ),
  category: z.enum(["PLATE_SUPPLIER","TUBE_SUPPLIER","VALVE_SUPPLIER","BURNER_SUPPLIER","FABRICATOR","TRANSPORT_VENDOR","OTHER"]).optional(),
  portalEnabled: z.boolean().optional(),
  notes: optionalText(2000),
});

export const updateVendorSchema = z
  .object({
    name: z.string().trim().min(2).max(200).optional(),
    contactPerson: optionalText(150),
    email: z.preprocess(
      (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
      z.string().trim().email("Enter a valid email address").max(200).optional()
    ),
    phone: optionalText(30),
    alternatePhone: optionalText(30),
    gstNumber: optionalText(50),
    panNumber: optionalText(50),
    address: optionalText(1000),
    city: optionalText(100),
    state: optionalText(100),
    country: optionalText(100),
    postalCode: optionalText(20),
    paymentTerms: optionalText(500),
    deliveryTerms: optionalText(500),
    rating: z.preprocess(
      (value) => value === "" || value === null || value === undefined ? undefined : Number(value),
      z.number().min(0).max(5).optional()
    ),
    category: z.enum(["PLATE_SUPPLIER","TUBE_SUPPLIER","VALVE_SUPPLIER","BURNER_SUPPLIER","FABRICATOR","TRANSPORT_VENDOR","OTHER"]).optional(),
    portalEnabled: z.boolean().optional(),
    notes: optionalText(2000),
    status: vendorStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one vendor field must be provided",
  });

// ============================================================
// PURCHASE REQUISITION ITEMS
// ============================================================

export const purchaseRequisitionItemSchema = z.object({
  inventoryItemId: optionalId,

  lineNumber: integerField("Line number"),

  description: z
    .string()
    .trim()
    .min(2, "Description is required")
    .max(1000),

  quantity: positiveNumber("Quantity"),

  unit: z
    .string()
    .trim()
    .min(1, "Unit is required")
    .max(30),

  estimatedUnitPrice: optionalNumber("Estimated unit price"),

  remarks: optionalText(1000),
});

// ============================================================
// PURCHASE REQUISITION
// ============================================================

export const createPurchaseRequisitionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Requisition title must contain at least 2 characters")
    .max(200),

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .default("MEDIUM"),

  requiredDate: optionalDate("Required date"),

  notes: optionalText(2000),

  items: z
    .array(purchaseRequisitionItemSchema)
    .min(1, "At least one requisition item is required"),
});

export const updatePurchaseRequisitionSchema = z
  .object({
    title: z.string().trim().min(2).max(200).optional(),

    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
      .optional(),

    requiredDate: optionalDate("Required date"),

    notes: optionalText(2000),

    rejectionReason: optionalText(2000),

    status: purchaseRequisitionStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one requisition field must be provided",
  });

// ============================================================
// RFQ ITEM
// ============================================================

export const procurementRfqItemSchema = z.object({
  purchaseRequisitionItemId: optionalId,

  inventoryItemId: optionalId,

  lineNumber: integerField("Line number"),

  description: z
    .string()
    .trim()
    .min(2, "Description is required")
    .max(1000),

  quantity: positiveNumber("Quantity"),

  unit: z
    .string()
    .trim()
    .min(1, "Unit is required")
    .max(30),

  specification: optionalText(2000),
  remarks: optionalText(1000),
});

// ============================================================
// RFQ
// ============================================================

export const createProcurementRfqSchema = z.object({
  purchaseRequisitionId: z
    .string()
    .trim()
    .min(1, "Purchase requisition is required"),

  issueDate: optionalDate("Issue date"),

  dueDate: optionalDate("Due date"),

  notes: optionalText(2000),

  vendorIds: z
    .array(z.string().trim().min(1))
    .min(1, "At least one vendor must be selected"),

  items: z
    .array(procurementRfqItemSchema)
    .min(1, "At least one RFQ item is required"),
});

export const updateProcurementRfqSchema = z
  .object({
    issueDate: optionalDate("Issue date"),
    dueDate: optionalDate("Due date"),
    notes: optionalText(2000),
    status: rfqStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one RFQ field must be provided",
  });

// ============================================================
// VENDOR QUOTATION ITEM
// ============================================================

export const vendorQuotationItemSchema = z.object({
  rfqItemId: z
    .string()
    .trim()
    .min(1, "RFQ item is required"),

  quantity: positiveNumber("Quantity"),

  unitPrice: numberField("Unit price"),

  taxPercent: numberField("Tax percent"),

  deliveryDays: optionalInteger("Delivery days"),

  remarks: optionalText(1000),
});

// ============================================================
// VENDOR QUOTATION
// ============================================================

export const createVendorQuotationSchema = z.object({
  quotationNumber: z
    .string()
    .trim()
    .min(1, "Quotation number is required")
    .max(100),

  rfqId: z
    .string()
    .trim()
    .min(1, "RFQ is required"),

  vendorId: z
    .string()
    .trim()
    .min(1, "Vendor is required"),

  quotationDate: optionalDate("Quotation date"),

  validUntil: optionalDate("Valid until"),

  currency: z
    .string()
    .trim()
    .min(3)
    .max(10)
    .default("INR"),

  freightAmount: numberField("Freight amount"),

  deliveryDays: optionalInteger("Delivery days"),

  paymentTerms: optionalText(1000),
  deliveryTerms: optionalText(1000),
  notes: optionalText(2000),

  items: z
    .array(vendorQuotationItemSchema)
    .min(1, "At least one quotation item is required"),
});

export const updateVendorQuotationSchema = z
  .object({
    quotationDate: optionalDate("Quotation date"),
    validUntil: optionalDate("Valid until"),

    currency: z.string().trim().min(3).max(10).optional(),

    freightAmount: optionalNumber("Freight amount"),

    deliveryDays: optionalInteger("Delivery days"),

    paymentTerms: optionalText(1000),
    deliveryTerms: optionalText(1000),
    notes: optionalText(2000),

    status: vendorQuotationStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one quotation field must be provided",
  });

// ============================================================
// PURCHASE ORDER ITEM
// ============================================================

export const purchaseOrderItemSchema = z.object({
  purchaseRequisitionItemId: optionalId,

  inventoryItemId: optionalId,

  lineNumber: integerField("Line number"),

  description: z
    .string()
    .trim()
    .min(2, "Description is required")
    .max(1000),

  quantity: positiveNumber("Quantity"),

  unit: z
    .string()
    .trim()
    .min(1, "Unit is required")
    .max(30),

  unitPrice: numberField("Unit price"),

  taxPercent: numberField("Tax percent"),

  remarks: optionalText(1000),
});

// ============================================================
// PURCHASE ORDER
// ============================================================

export const createPurchaseOrderSchema = z.object({
  vendorId: z
    .string()
    .trim()
    .min(1, "Vendor is required"),

  vendorQuotationId: optionalId,

  purchaseRequisitionId: optionalId,

  orderDate: optionalDate("Order date"),

  expectedDeliveryDate: optionalDate("Expected delivery date"),

  currency: z
    .string()
    .trim()
    .min(3)
    .max(10)
    .default("INR"),

  freightAmount: numberField("Freight amount"),

  paymentTerms: optionalText(1000),
  deliveryTerms: optionalText(1000),
  notes: optionalText(2000),

  items: z
    .array(purchaseOrderItemSchema)
    .min(1, "At least one purchase order item is required"),
});

export const updatePurchaseOrderSchema = z
  .object({
    expectedDeliveryDate: optionalDate("Expected delivery date"),

    freightAmount: optionalNumber("Freight amount"),

    paymentTerms: optionalText(1000),
    deliveryTerms: optionalText(1000),
    notes: optionalText(2000),

    status: purchaseOrderStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one purchase order field must be provided",
  });

// ============================================================
// GRN ITEM
// ============================================================

export const goodsReceiptNoteItemSchema = z
  .object({
    purchaseOrderItemId: z
      .string()
      .trim()
      .min(1, "Purchase order item is required"),

    inventoryItemId: z
      .string()
      .trim()
      .min(1, "Inventory item is required"),

    receivedQuantity: positiveNumber("Received quantity"),

    acceptedQuantity: numberField("Accepted quantity"),

    rejectedQuantity: numberField("Rejected quantity"),

    unitCost: numberField("Unit cost"),

    remarks: optionalText(1000),
  })
  .refine(
    (data) =>
      data.acceptedQuantity + data.rejectedQuantity <=
      data.receivedQuantity,
    {
      message:
        "Accepted and rejected quantities cannot exceed received quantity",
      path: ["acceptedQuantity"],
    }
  );

// ============================================================
// GOODS RECEIPT NOTE
// ============================================================

export const createGoodsReceiptNoteSchema = z.object({
  purchaseOrderId: z
    .string()
    .trim()
    .min(1, "Purchase order is required"),

  receiptDate: optionalDate("Receipt date"),

  challanNumber: optionalText(100),

  invoiceNumber: optionalText(100),

  notes: optionalText(2000),

  items: z
    .array(goodsReceiptNoteItemSchema)
    .min(1, "At least one received item is required"),
});

export const updateGoodsReceiptNoteSchema = z
  .object({
    receiptDate: optionalDate("Receipt date"),
    challanNumber: optionalText(100),
    invoiceNumber: optionalText(100),
    notes: optionalText(2000),

    status: grnStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one GRN field must be provided",
  });

// ============================================================
// TYPES
// ============================================================

export type CreateVendorInput =
  z.infer<typeof createVendorSchema>;

export type CreatePurchaseRequisitionInput =
  z.infer<typeof createPurchaseRequisitionSchema>;

export type CreateProcurementRfqInput =
  z.infer<typeof createProcurementRfqSchema>;

export type CreateVendorQuotationInput =
  z.infer<typeof createVendorQuotationSchema>;

export type CreatePurchaseOrderInput =
  z.infer<typeof createPurchaseOrderSchema>;

export type CreateGoodsReceiptNoteInput =
  z.infer<typeof createGoodsReceiptNoteSchema>;