-- Module 3: Sales Management completion

CREATE TYPE "CustomerApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "SalesInvoiceType" AS ENUM ('PROFORMA', 'TAX');
CREATE TYPE "PaymentType" AS ENUM ('ADVANCE', 'MILESTONE', 'FINAL');
CREATE TYPE "DispatchNoteStatus" AS ENUM ('DRAFT', 'READY', 'DISPATCHED', 'DELIVERED', 'CANCELLED');

ALTER TYPE "SalesOrderStatus" ADD VALUE IF NOT EXISTS 'ADVANCE_PENDING';
ALTER TYPE "SalesOrderStatus" ADD VALUE IF NOT EXISTS 'ADVANCE_RECEIVED';
ALTER TYPE "SalesOrderStatus" ADD VALUE IF NOT EXISTS 'IN_PRODUCTION';
ALTER TYPE "SalesOrderStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_DISPATCH';
ALTER TYPE "SalesOrderStatus" ADD VALUE IF NOT EXISTS 'DISPATCHED';
ALTER TYPE "SalesOrderStatus" ADD VALUE IF NOT EXISTS 'INSTALLED';
ALTER TYPE "SalesOrderStatus" ADD VALUE IF NOT EXISTS 'COMMISSIONED';
ALTER TYPE "SalesOrderStatus" ADD VALUE IF NOT EXISTS 'CLOSED';

ALTER TABLE "Quotation"
  ADD COLUMN "customerApprovalStatus" "CustomerApprovalStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "customerApprovedAt" TIMESTAMP(3),
  ADD COLUMN "customerApprovalReference" TEXT,
  ADD COLUMN "customerApprovalNotes" TEXT;

UPDATE "Quotation"
SET "customerApprovalStatus" = 'APPROVED', "customerApprovedAt" = COALESCE("updatedAt", "createdAt")
WHERE "status" IN ('ACCEPTED', 'CONVERTED');

ALTER TABLE "SalesOrder"
  ADD COLUMN "customerApprovalAt" TIMESTAMP(3),
  ADD COLUMN "customerApprovalReference" TEXT,
  ADD COLUMN "advanceAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN "advanceDueAmount" DECIMAL(15,2) NOT NULL DEFAULT 0;

ALTER TABLE "SalesInvoice"
  ADD COLUMN "type" "SalesInvoiceType" NOT NULL DEFAULT 'TAX';

ALTER TABLE "SalesPayment"
  ALTER COLUMN "invoiceId" DROP NOT NULL,
  ADD COLUMN "salesOrderId" TEXT,
  ADD COLUMN "type" "PaymentType" NOT NULL DEFAULT 'FINAL';

ALTER TABLE "ProductionOrder"
  ADD COLUMN "salesOrderId" TEXT;

ALTER TABLE "Dispatch"
  ADD COLUMN "salesOrderId" TEXT;

ALTER TABLE "InstallationJob"
  ADD COLUMN "salesOrderId" TEXT;

CREATE TABLE "SalesDispatchNote" (
  "id" TEXT NOT NULL,
  "dispatchNoteNumber" TEXT NOT NULL,
  "salesOrderId" TEXT NOT NULL,
  "status" "DispatchNoteStatus" NOT NULL DEFAULT 'DRAFT',
  "dispatchDate" TIMESTAMP(3),
  "destination" TEXT,
  "transporterName" TEXT,
  "vehicleNumber" TEXT,
  "lrNumber" TEXT,
  "packageCount" INTEGER NOT NULL DEFAULT 1,
  "notes" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SalesDispatchNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SalesDispatchNote_dispatchNoteNumber_key" ON "SalesDispatchNote"("dispatchNoteNumber");
CREATE INDEX "SalesDispatchNote_salesOrderId_idx" ON "SalesDispatchNote"("salesOrderId");
CREATE INDEX "SalesDispatchNote_status_idx" ON "SalesDispatchNote"("status");
CREATE INDEX "SalesDispatchNote_dispatchDate_idx" ON "SalesDispatchNote"("dispatchDate");

CREATE TABLE "SalesDispatchNoteItem" (
  "id" TEXT NOT NULL,
  "dispatchNoteId" TEXT NOT NULL,
  "lineNumber" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(15,3) NOT NULL,
  "unit" TEXT NOT NULL,
  "serialNumber" TEXT,
  "packageDetails" TEXT,
  CONSTRAINT "SalesDispatchNoteItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SalesDispatchNoteItem_dispatchNoteId_lineNumber_key" ON "SalesDispatchNoteItem"("dispatchNoteId", "lineNumber");

CREATE TABLE "SalesEWayBill" (
  "id" TEXT NOT NULL,
  "eWayBillNumber" TEXT NOT NULL,
  "salesOrderId" TEXT NOT NULL,
  "dispatchNoteId" TEXT,
  "vehicleNumber" TEXT,
  "transporterId" TEXT,
  "transporterName" TEXT,
  "distanceKm" DECIMAL(10,2),
  "validUntil" TIMESTAMP(3),
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SalesEWayBill_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SalesEWayBill_eWayBillNumber_key" ON "SalesEWayBill"("eWayBillNumber");
CREATE INDEX "SalesEWayBill_salesOrderId_idx" ON "SalesEWayBill"("salesOrderId");
CREATE INDEX "SalesEWayBill_dispatchNoteId_idx" ON "SalesEWayBill"("dispatchNoteId");

CREATE UNIQUE INDEX "SalesOrder_dispatchId_key" ON "Dispatch"("salesOrderId");
CREATE INDEX "Dispatch_salesOrderId_idx" ON "Dispatch"("salesOrderId");
CREATE INDEX "ProductionOrder_salesOrderId_idx" ON "ProductionOrder"("salesOrderId");
CREATE UNIQUE INDEX "InstallationJob_salesOrderId_key" ON "InstallationJob"("salesOrderId");
CREATE INDEX "InstallationJob_salesOrderId_idx" ON "InstallationJob"("salesOrderId");
CREATE INDEX "SalesPayment_salesOrderId_idx" ON "SalesPayment"("salesOrderId");
CREATE INDEX "SalesPayment_type_idx" ON "SalesPayment"("type");

ALTER TABLE "SalesDispatchNote" ADD CONSTRAINT "SalesDispatchNote_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesDispatchNote" ADD CONSTRAINT "SalesDispatchNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesDispatchNoteItem" ADD CONSTRAINT "SalesDispatchNoteItem_dispatchNoteId_fkey" FOREIGN KEY ("dispatchNoteId") REFERENCES "SalesDispatchNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesEWayBill" ADD CONSTRAINT "SalesEWayBill_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SalesEWayBill" ADD CONSTRAINT "SalesEWayBill_dispatchNoteId_fkey" FOREIGN KEY ("dispatchNoteId") REFERENCES "SalesDispatchNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesEWayBill" ADD CONSTRAINT "SalesEWayBill_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesPayment" ADD CONSTRAINT "SalesPayment_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InstallationJob" ADD CONSTRAINT "InstallationJob_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
