CREATE TYPE "FinanceRecognitionType" AS ENUM ('MILESTONE','PERCENTAGE_COMPLETION','DISPATCH','COMMISSIONING');
CREATE TYPE "FinanceFollowUpStatus" AS ENUM ('OPEN','COMPLETED','RESCHEDULED');
CREATE TYPE "FinanceApprovalStatus" AS ENUM ('PENDING','APPROVED','REJECTED');
CREATE TYPE "FinancePartyType" AS ENUM ('CUSTOMER','VENDOR');
CREATE TYPE "TdsStatus" AS ENUM ('DRAFT','DEDUCTED','DEPOSITED','CANCELLED');
CREATE TABLE "FinanceReceipt" (
 "id" TEXT NOT NULL, "receiptNumber" TEXT NOT NULL, "invoiceId" TEXT NOT NULL, "customerId" TEXT NOT NULL,
 "receiptDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "amount" DECIMAL(15,2) NOT NULL,
 "method" "PaymentMethod" NOT NULL, "referenceNumber" TEXT, "notes" TEXT, "createdById" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "FinanceReceipt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FinanceReceipt_receiptNumber_key" ON "FinanceReceipt"("receiptNumber");
CREATE INDEX "FinanceReceipt_invoiceId_idx" ON "FinanceReceipt"("invoiceId");
CREATE INDEX "FinanceReceipt_customerId_idx" ON "FinanceReceipt"("customerId");
CREATE INDEX "FinanceReceipt_receiptDate_idx" ON "FinanceReceipt"("receiptDate");
CREATE TABLE "FinancePaymentFollowUp" (
 "id" TEXT NOT NULL, "invoiceId" TEXT NOT NULL, "followUpDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "nextFollowUpDate" TIMESTAMP(3), "status" "FinanceFollowUpStatus" NOT NULL DEFAULT 'OPEN', "notes" TEXT,
 "assignedToId" TEXT, "createdById" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "FinancePaymentFollowUp_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FinancePaymentFollowUp_invoiceId_idx" ON "FinancePaymentFollowUp"("invoiceId");
CREATE INDEX "FinancePaymentFollowUp_nextFollowUpDate_idx" ON "FinancePaymentFollowUp"("nextFollowUpDate");
CREATE INDEX "FinancePaymentFollowUp_status_idx" ON "FinancePaymentFollowUp"("status");
CREATE TABLE "VendorPaymentApproval" (
 "id" TEXT NOT NULL, "vendorPaymentId" TEXT NOT NULL, "status" "FinanceApprovalStatus" NOT NULL DEFAULT 'PENDING',
 "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "approvedById" TEXT, "approvedAt" TIMESTAMP(3),
 "rejectionReason" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "VendorPaymentApproval_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VendorPaymentApproval_vendorPaymentId_key" ON "VendorPaymentApproval"("vendorPaymentId");
CREATE TABLE "FinanceRevenueRecognition" (
 "id" TEXT NOT NULL, "recognitionNumber" TEXT NOT NULL, "recognitionType" "FinanceRecognitionType" NOT NULL,
 "recognitionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "projectId" TEXT, "salesOrderId" TEXT,
 "invoiceId" TEXT, "milestoneId" TEXT, "percentage" DECIMAL(7,2), "amount" DECIMAL(15,2) NOT NULL,
 "notes" TEXT, "createdById" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "FinanceRevenueRecognition_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FinanceRevenueRecognition_recognitionNumber_key" ON "FinanceRevenueRecognition"("recognitionNumber");
CREATE INDEX "FinanceRevenueRecognition_projectId_idx" ON "FinanceRevenueRecognition"("projectId");
CREATE INDEX "FinanceRevenueRecognition_recognitionType_idx" ON "FinanceRevenueRecognition"("recognitionType");
CREATE INDEX "FinanceRevenueRecognition_recognitionDate_idx" ON "FinanceRevenueRecognition"("recognitionDate");
CREATE TABLE "FinanceProductCost" (
 "id" TEXT NOT NULL, "productName" TEXT NOT NULL, "standardCost" DECIMAL(15,2) NOT NULL, "currency" TEXT NOT NULL DEFAULT 'INR',
 "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "FinanceProductCost_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FinanceProductCost_productName_key" ON "FinanceProductCost"("productName");
CREATE TABLE "TdsRecord" (
 "id" TEXT NOT NULL, "partyType" "FinancePartyType" NOT NULL, "partyId" TEXT NOT NULL, "documentType" TEXT NOT NULL,
 "documentId" TEXT NOT NULL, "tdsSection" TEXT NOT NULL, "rate" DECIMAL(7,3) NOT NULL, "taxableAmount" DECIMAL(15,2) NOT NULL,
 "tdsAmount" DECIMAL(15,2) NOT NULL, "deductedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "status" "TdsStatus" NOT NULL DEFAULT 'DRAFT',
 "notes" TEXT, "createdById" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "TdsRecord_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TdsRecord_party_idx" ON "TdsRecord"("partyType","partyId");
CREATE INDEX "TdsRecord_documentId_idx" ON "TdsRecord"("documentId");
CREATE INDEX "TdsRecord_status_idx" ON "TdsRecord"("status");
CREATE INDEX "TdsRecord_deductedAt_idx" ON "TdsRecord"("deductedAt");
