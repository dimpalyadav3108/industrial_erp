-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PurchaseRequisitionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'RFQ_CREATED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('DRAFT', 'SENT', 'QUOTES_RECEIVED', 'EVALUATED', 'AWARDED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VendorQuotationStatus" AS ENUM ('RECEIVED', 'UNDER_REVIEW', 'SELECTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GrnStatus" AS ENUM ('DRAFT', 'RECEIVED', 'INSPECTED', 'ACCEPTED', 'REJECTED', 'PARTIALLY_ACCEPTED');

-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "grnPrefix" TEXT NOT NULL DEFAULT 'GRN',
ADD COLUMN     "purchaseOrderPrefix" TEXT NOT NULL DEFAULT 'PO',
ADD COLUMN     "requisitionPrefix" TEXT NOT NULL DEFAULT 'PR',
ADD COLUMN     "rfqPrefix" TEXT NOT NULL DEFAULT 'RFQ',
ADD COLUMN     "vendorPrefix" TEXT NOT NULL DEFAULT 'VEN';

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "vendorCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "alternatePhone" TEXT,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "postalCode" TEXT,
    "paymentTerms" TEXT,
    "deliveryTerms" TEXT,
    "rating" DECIMAL(3,2),
    "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequisition" (
    "id" TEXT NOT NULL,
    "requisitionNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "PurchaseRequisitionStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIUM',
    "requiredDate" TIMESTAMP(3),
    "requestedById" TEXT,
    "approvedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequisitionItem" (
    "id" TEXT NOT NULL,
    "purchaseRequisitionId" TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "lineNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "estimatedUnitPrice" DECIMAL(15,2),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequisitionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementRfq" (
    "id" TEXT NOT NULL,
    "rfqNumber" TEXT NOT NULL,
    "purchaseRequisitionId" TEXT NOT NULL,
    "status" "RfqStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementRfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementRfqItem" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "purchaseRequisitionItemId" TEXT,
    "inventoryItemId" TEXT,
    "lineNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "specification" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementRfqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementRfqVendor" (
    "rfqId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "ProcurementRfqVendor_pkey" PRIMARY KEY ("rfqId","vendorId")
);

-- CreateTable
CREATE TABLE "VendorQuotation" (
    "id" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" "VendorQuotationStatus" NOT NULL DEFAULT 'RECEIVED',
    "quotationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "freightAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deliveryDays" INTEGER,
    "paymentTerms" TEXT,
    "deliveryTerms" TEXT,
    "notes" TEXT,
    "selectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorQuotationItem" (
    "id" TEXT NOT NULL,
    "vendorQuotationId" TEXT NOT NULL,
    "rfqItemId" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "taxPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deliveryDays" INTEGER,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorQuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "vendorQuotationId" TEXT,
    "purchaseRequisitionId" TEXT,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDeliveryDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "freightAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paymentTerms" TEXT,
    "deliveryTerms" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "purchaseRequisitionItemId" TEXT,
    "inventoryItemId" TEXT,
    "lineNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "receivedQuantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "taxPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptNote" (
    "id" TEXT NOT NULL,
    "grnNumber" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" "GrnStatus" NOT NULL DEFAULT 'DRAFT',
    "receiptDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "challanNumber" TEXT,
    "invoiceNumber" TEXT,
    "notes" TEXT,
    "receivedById" TEXT,
    "inspectedAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReceiptNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptNoteItem" (
    "id" TEXT NOT NULL,
    "goodsReceiptNoteId" TEXT NOT NULL,
    "purchaseOrderItemId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "receivedQuantity" DECIMAL(15,3) NOT NULL,
    "acceptedQuantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "rejectedQuantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(15,2) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReceiptNoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_vendorCode_key" ON "Vendor"("vendorCode");

-- CreateIndex
CREATE INDEX "Vendor_name_idx" ON "Vendor"("name");

-- CreateIndex
CREATE INDEX "Vendor_status_idx" ON "Vendor"("status");

-- CreateIndex
CREATE INDEX "Vendor_gstNumber_idx" ON "Vendor"("gstNumber");

-- CreateIndex
CREATE INDEX "Vendor_createdAt_idx" ON "Vendor"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequisition_requisitionNumber_key" ON "PurchaseRequisition"("requisitionNumber");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_status_idx" ON "PurchaseRequisition"("status");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_priority_idx" ON "PurchaseRequisition"("priority");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_requiredDate_idx" ON "PurchaseRequisition"("requiredDate");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_requestedById_idx" ON "PurchaseRequisition"("requestedById");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_approvedById_idx" ON "PurchaseRequisition"("approvedById");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_createdAt_idx" ON "PurchaseRequisition"("createdAt");

-- CreateIndex
CREATE INDEX "PurchaseRequisitionItem_purchaseRequisitionId_idx" ON "PurchaseRequisitionItem"("purchaseRequisitionId");

-- CreateIndex
CREATE INDEX "PurchaseRequisitionItem_inventoryItemId_idx" ON "PurchaseRequisitionItem"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequisitionItem_purchaseRequisitionId_lineNumber_key" ON "PurchaseRequisitionItem"("purchaseRequisitionId", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ProcurementRfq_rfqNumber_key" ON "ProcurementRfq"("rfqNumber");

-- CreateIndex
CREATE INDEX "ProcurementRfq_purchaseRequisitionId_idx" ON "ProcurementRfq"("purchaseRequisitionId");

-- CreateIndex
CREATE INDEX "ProcurementRfq_status_idx" ON "ProcurementRfq"("status");

-- CreateIndex
CREATE INDEX "ProcurementRfq_dueDate_idx" ON "ProcurementRfq"("dueDate");

-- CreateIndex
CREATE INDEX "ProcurementRfq_createdById_idx" ON "ProcurementRfq"("createdById");

-- CreateIndex
CREATE INDEX "ProcurementRfq_createdAt_idx" ON "ProcurementRfq"("createdAt");

-- CreateIndex
CREATE INDEX "ProcurementRfqItem_rfqId_idx" ON "ProcurementRfqItem"("rfqId");

-- CreateIndex
CREATE INDEX "ProcurementRfqItem_purchaseRequisitionItemId_idx" ON "ProcurementRfqItem"("purchaseRequisitionItemId");

-- CreateIndex
CREATE INDEX "ProcurementRfqItem_inventoryItemId_idx" ON "ProcurementRfqItem"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcurementRfqItem_rfqId_lineNumber_key" ON "ProcurementRfqItem"("rfqId", "lineNumber");

-- CreateIndex
CREATE INDEX "ProcurementRfqVendor_vendorId_idx" ON "ProcurementRfqVendor"("vendorId");

-- CreateIndex
CREATE INDEX "VendorQuotation_rfqId_idx" ON "VendorQuotation"("rfqId");

-- CreateIndex
CREATE INDEX "VendorQuotation_vendorId_idx" ON "VendorQuotation"("vendorId");

-- CreateIndex
CREATE INDEX "VendorQuotation_status_idx" ON "VendorQuotation"("status");

-- CreateIndex
CREATE INDEX "VendorQuotation_quotationDate_idx" ON "VendorQuotation"("quotationDate");

-- CreateIndex
CREATE UNIQUE INDEX "VendorQuotation_rfqId_vendorId_quotationNumber_key" ON "VendorQuotation"("rfqId", "vendorId", "quotationNumber");

-- CreateIndex
CREATE INDEX "VendorQuotationItem_vendorQuotationId_idx" ON "VendorQuotationItem"("vendorQuotationId");

-- CreateIndex
CREATE INDEX "VendorQuotationItem_rfqItemId_idx" ON "VendorQuotationItem"("rfqItemId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorQuotationItem_vendorQuotationId_rfqItemId_key" ON "VendorQuotationItem"("vendorQuotationId", "rfqItemId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_vendorId_idx" ON "PurchaseOrder"("vendorId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_vendorQuotationId_idx" ON "PurchaseOrder"("vendorQuotationId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_purchaseRequisitionId_idx" ON "PurchaseOrder"("purchaseRequisitionId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_createdById_idx" ON "PurchaseOrder"("createdById");

-- CreateIndex
CREATE INDEX "PurchaseOrder_approvedById_idx" ON "PurchaseOrder"("approvedById");

-- CreateIndex
CREATE INDEX "PurchaseOrder_orderDate_idx" ON "PurchaseOrder"("orderDate");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseRequisitionItemId_idx" ON "PurchaseOrderItem"("purchaseRequisitionItemId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_inventoryItemId_idx" ON "PurchaseOrderItem"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrderItem_purchaseOrderId_lineNumber_key" ON "PurchaseOrderItem"("purchaseOrderId", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceiptNote_grnNumber_key" ON "GoodsReceiptNote"("grnNumber");

-- CreateIndex
CREATE INDEX "GoodsReceiptNote_purchaseOrderId_idx" ON "GoodsReceiptNote"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "GoodsReceiptNote_vendorId_idx" ON "GoodsReceiptNote"("vendorId");

-- CreateIndex
CREATE INDEX "GoodsReceiptNote_status_idx" ON "GoodsReceiptNote"("status");

-- CreateIndex
CREATE INDEX "GoodsReceiptNote_receiptDate_idx" ON "GoodsReceiptNote"("receiptDate");

-- CreateIndex
CREATE INDEX "GoodsReceiptNote_receivedById_idx" ON "GoodsReceiptNote"("receivedById");

-- CreateIndex
CREATE INDEX "GoodsReceiptNoteItem_goodsReceiptNoteId_idx" ON "GoodsReceiptNoteItem"("goodsReceiptNoteId");

-- CreateIndex
CREATE INDEX "GoodsReceiptNoteItem_purchaseOrderItemId_idx" ON "GoodsReceiptNoteItem"("purchaseOrderItemId");

-- CreateIndex
CREATE INDEX "GoodsReceiptNoteItem_inventoryItemId_idx" ON "GoodsReceiptNoteItem"("inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceiptNoteItem_goodsReceiptNoteId_purchaseOrderItemId_key" ON "GoodsReceiptNoteItem"("goodsReceiptNoteId", "purchaseOrderItemId");

-- AddForeignKey
ALTER TABLE "PurchaseRequisition" ADD CONSTRAINT "PurchaseRequisition_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisition" ADD CONSTRAINT "PurchaseRequisition_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisitionItem" ADD CONSTRAINT "PurchaseRequisitionItem_purchaseRequisitionId_fkey" FOREIGN KEY ("purchaseRequisitionId") REFERENCES "PurchaseRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisitionItem" ADD CONSTRAINT "PurchaseRequisitionItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementRfq" ADD CONSTRAINT "ProcurementRfq_purchaseRequisitionId_fkey" FOREIGN KEY ("purchaseRequisitionId") REFERENCES "PurchaseRequisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementRfq" ADD CONSTRAINT "ProcurementRfq_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementRfqItem" ADD CONSTRAINT "ProcurementRfqItem_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "ProcurementRfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementRfqItem" ADD CONSTRAINT "ProcurementRfqItem_purchaseRequisitionItemId_fkey" FOREIGN KEY ("purchaseRequisitionItemId") REFERENCES "PurchaseRequisitionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementRfqItem" ADD CONSTRAINT "ProcurementRfqItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementRfqVendor" ADD CONSTRAINT "ProcurementRfqVendor_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "ProcurementRfq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementRfqVendor" ADD CONSTRAINT "ProcurementRfqVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorQuotation" ADD CONSTRAINT "VendorQuotation_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "ProcurementRfq"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorQuotation" ADD CONSTRAINT "VendorQuotation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorQuotationItem" ADD CONSTRAINT "VendorQuotationItem_vendorQuotationId_fkey" FOREIGN KEY ("vendorQuotationId") REFERENCES "VendorQuotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorQuotationItem" ADD CONSTRAINT "VendorQuotationItem_rfqItemId_fkey" FOREIGN KEY ("rfqItemId") REFERENCES "ProcurementRfqItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorQuotationId_fkey" FOREIGN KEY ("vendorQuotationId") REFERENCES "VendorQuotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_purchaseRequisitionId_fkey" FOREIGN KEY ("purchaseRequisitionId") REFERENCES "PurchaseRequisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseRequisitionItemId_fkey" FOREIGN KEY ("purchaseRequisitionItemId") REFERENCES "PurchaseRequisitionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNote" ADD CONSTRAINT "GoodsReceiptNote_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNote" ADD CONSTRAINT "GoodsReceiptNote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNote" ADD CONSTRAINT "GoodsReceiptNote_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNoteItem" ADD CONSTRAINT "GoodsReceiptNoteItem_goodsReceiptNoteId_fkey" FOREIGN KEY ("goodsReceiptNoteId") REFERENCES "GoodsReceiptNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNoteItem" ADD CONSTRAINT "GoodsReceiptNoteItem_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNoteItem" ADD CONSTRAINT "GoodsReceiptNoteItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
