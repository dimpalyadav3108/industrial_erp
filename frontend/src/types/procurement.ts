export type VendorStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";
export type PurchaseRequisitionStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "RFQ_CREATED" | "CLOSED" | "CANCELLED";
export type RfqStatus = "DRAFT" | "SENT" | "QUOTES_RECEIVED" | "EVALUATED" | "AWARDED" | "CLOSED" | "CANCELLED";
export type VendorQuotationStatus = "RECEIVED" | "UNDER_REVIEW" | "SELECTED" | "REJECTED";
export type PurchaseOrderStatus = "DRAFT" | "APPROVED" | "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CLOSED" | "CANCELLED";
export type GrnStatus = "DRAFT" | "RECEIVED" | "INSPECTED" | "ACCEPTED" | "REJECTED" | "PARTIALLY_ACCEPTED";
export type ProcurementPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type DecimalValue = string | number;

export interface ProcurementUserSummary {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
}

export interface ProcurementInventoryItem {
  id: string;
  itemCode: string;
  name: string;
  unit: string;
  currentStock?: DecimalValue;
}

export interface Vendor {
  id: string;
  vendorCode: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  alternatePhone: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postalCode: string | null;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  rating: DecimalValue | null;
  status: VendorStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { quotations: number; purchaseOrders: number; goodsReceipts: number };
}

export interface PurchaseRequisitionItem {
  id: string;
  purchaseRequisitionId: string;
  inventoryItemId: string | null;
  lineNumber: number;
  description: string;
  quantity: DecimalValue;
  unit: string;
  estimatedUnitPrice: DecimalValue | null;
  remarks: string | null;
  inventoryItem?: ProcurementInventoryItem | null;
}

export interface PurchaseRequisition {
  id: string;
  requisitionNumber: string;
  title: string;
  status: PurchaseRequisitionStatus;
  priority: ProcurementPriority;
  requiredDate: string | null;
  requestedById: string | null;
  approvedById: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  requestedBy?: ProcurementUserSummary | null;
  approvedBy?: ProcurementUserSummary | null;
  items: PurchaseRequisitionItem[];
}

export interface ProcurementRfqItem {
  id: string;
  rfqId: string;
  purchaseRequisitionItemId: string | null;
  inventoryItemId: string | null;
  lineNumber: number;
  description: string;
  quantity: DecimalValue;
  unit: string;
  specification: string | null;
  remarks: string | null;
  inventoryItem?: ProcurementInventoryItem | null;
}

export interface ProcurementRfq {
  id: string;
  rfqNumber: string;
  purchaseRequisitionId: string;
  status: RfqStatus;
  issueDate: string | null;
  dueDate: string | null;
  notes: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  purchaseRequisition?: PurchaseRequisition;
  items: ProcurementRfqItem[];
  vendors: Array<{ rfqId: string; vendorId: string; invitedAt: string; respondedAt: string | null; vendor: Vendor }>;
  quotations: VendorQuotation[];
}

export interface VendorQuotationItem {
  id: string;
  vendorQuotationId: string;
  rfqItemId: string;
  quantity: DecimalValue;
  unitPrice: DecimalValue;
  taxPercent: DecimalValue;
  taxAmount: DecimalValue;
  lineTotal: DecimalValue;
  deliveryDays: number | null;
  remarks: string | null;
  rfqItem?: ProcurementRfqItem;
}

export interface VendorQuotation {
  id: string;
  quotationNumber: string;
  rfqId: string;
  vendorId: string;
  status: VendorQuotationStatus;
  quotationDate: string;
  validUntil: string | null;
  currency: string;
  subtotal: DecimalValue;
  taxAmount: DecimalValue;
  freightAmount: DecimalValue;
  totalAmount: DecimalValue;
  deliveryDays: number | null;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  notes: string | null;
  selectedAt: string | null;
  vendor?: Vendor;
  rfq?: ProcurementRfq;
  items: VendorQuotationItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  purchaseRequisitionItemId: string | null;
  inventoryItemId: string | null;
  lineNumber: number;
  description: string;
  quantity: DecimalValue;
  receivedQuantity: DecimalValue;
  unit: string;
  unitPrice: DecimalValue;
  taxPercent: DecimalValue;
  taxAmount: DecimalValue;
  lineTotal: DecimalValue;
  remarks: string | null;
  inventoryItem?: ProcurementInventoryItem | null;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorQuotationId: string | null;
  purchaseRequisitionId: string | null;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDeliveryDate: string | null;
  currency: string;
  subtotal: DecimalValue;
  taxAmount: DecimalValue;
  freightAmount: DecimalValue;
  totalAmount: DecimalValue;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  notes: string | null;
  approvedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: Vendor;
  items: PurchaseOrderItem[];
}

export interface GoodsReceiptNoteItem {
  id: string;
  goodsReceiptNoteId: string;
  purchaseOrderItemId: string;
  inventoryItemId: string;
  receivedQuantity: DecimalValue;
  acceptedQuantity: DecimalValue;
  rejectedQuantity: DecimalValue;
  unitCost: DecimalValue;
  remarks: string | null;
  inventoryItem?: ProcurementInventoryItem;
  purchaseOrderItem?: PurchaseOrderItem;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  vendorId: string;
  status: GrnStatus;
  receiptDate: string;
  challanNumber: string | null;
  invoiceNumber: string | null;
  notes: string | null;
  inspectedAt: string | null;
  postedAt: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: Vendor;
  purchaseOrder?: PurchaseOrder;
  items: GoodsReceiptNoteItem[];
}

export interface CreateVendorPayload {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  gstNumber?: string;
  panNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  rating?: number;
  notes?: string;
}
export type UpdateVendorPayload = Partial<CreateVendorPayload> & { status?: VendorStatus };

export interface CreatePurchaseRequisitionPayload {
  title: string;
  priority?: ProcurementPriority;
  requiredDate?: string;
  notes?: string;
  items: Array<{
    inventoryItemId?: string;
    lineNumber: number;
    description: string;
    quantity: number;
    unit: string;
    estimatedUnitPrice?: number;
    remarks?: string;
  }>;
}
export interface UpdatePurchaseRequisitionPayload {
  title?: string;
  priority?: ProcurementPriority;
  requiredDate?: string | null;
  notes?: string | null;
  rejectionReason?: string | null;
  status?: PurchaseRequisitionStatus;
}

export interface CreateProcurementRfqPayload {
  purchaseRequisitionId: string;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  vendorIds: string[];
  items: Array<{
    purchaseRequisitionItemId?: string;
    inventoryItemId?: string;
    lineNumber: number;
    description: string;
    quantity: number;
    unit: string;
    specification?: string;
    remarks?: string;
  }>;
}
export interface UpdateProcurementRfqPayload { issueDate?: string | null; dueDate?: string | null; notes?: string | null; status?: RfqStatus }

export interface CreateVendorQuotationPayload {
  quotationNumber: string;
  rfqId: string;
  vendorId: string;
  quotationDate?: string;
  validUntil?: string;
  currency?: string;
  freightAmount?: number;
  deliveryDays?: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
  items: Array<{ rfqItemId: string; quantity: number; unitPrice: number; taxPercent?: number; deliveryDays?: number; remarks?: string }>;
}
export interface UpdateVendorQuotationPayload {
  quotationDate?: string;
  validUntil?: string | null;
  currency?: string;
  freightAmount?: number;
  deliveryDays?: number | null;
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  notes?: string | null;
  status?: VendorQuotationStatus;
}

export interface CreatePurchaseOrderPayload {
  vendorId: string;
  vendorQuotationId?: string;
  purchaseRequisitionId?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  currency?: string;
  freightAmount?: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
  items: Array<{
    purchaseRequisitionItemId?: string;
    inventoryItemId?: string;
    lineNumber: number;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    taxPercent?: number;
    remarks?: string;
  }>;
}
export interface UpdatePurchaseOrderPayload {
  expectedDeliveryDate?: string | null;
  freightAmount?: number;
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  notes?: string | null;
  status?: PurchaseOrderStatus;
}

export interface CreateGoodsReceiptNotePayload {
  purchaseOrderId: string;
  receiptDate?: string;
  challanNumber?: string;
  invoiceNumber?: string;
  notes?: string;
  items: Array<{
    purchaseOrderItemId: string;
    inventoryItemId: string;
    receivedQuantity: number;
    acceptedQuantity?: number;
    rejectedQuantity?: number;
    unitCost: number;
    remarks?: string;
  }>;
}
export interface UpdateGoodsReceiptNotePayload {
  receiptDate?: string;
  challanNumber?: string | null;
  invoiceNumber?: string | null;
  notes?: string | null;
  status?: GrnStatus;
}
