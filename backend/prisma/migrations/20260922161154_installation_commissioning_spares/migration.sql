-- CreateEnum
CREATE TYPE "InstallationStatus" AS ENUM ('PLANNED', 'SITE_READY', 'IN_PROGRESS', 'INSTALLED', 'COMMISSIONING', 'HANDED_OVER', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InstallationCheckStatus" AS ENUM ('PENDING', 'PASS', 'FAIL', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "CommissioningTestStatus" AS ENUM ('PENDING', 'PASS', 'FAIL');

-- CreateEnum
CREATE TYPE "SpareMovementType" AS ENUM ('ISSUE', 'RETURN', 'USED');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "installationJobId" TEXT;

-- CreateTable
CREATE TABLE "InstallationJob" (
    "id" TEXT NOT NULL,
    "installationNumber" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "serviceRequestId" TEXT,
    "warrantyContractId" TEXT,
    "siteName" TEXT NOT NULL,
    "siteAddress" TEXT NOT NULL,
    "siteContactPerson" TEXT,
    "siteContactPhone" TEXT,
    "engineerId" TEXT,
    "status" "InstallationStatus" NOT NULL DEFAULT 'PLANNED',
    "plannedStartDate" TIMESTAMP(3),
    "actualStartDate" TIMESTAMP(3),
    "installationDate" TIMESTAMP(3),
    "commissioningDate" TIMESTAMP(3),
    "handoverDate" TIMESTAMP(3),
    "customerSignoffName" TEXT,
    "customerSignoffNotes" TEXT,
    "commissioningReportUrl" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationChecklistItem" (
    "id" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "item" TEXT NOT NULL,
    "status" "InstallationCheckStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "checkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallationChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissioningTest" (
    "id" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "testName" TEXT NOT NULL,
    "specification" TEXT,
    "observedValue" TEXT,
    "status" "CommissioningTestStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "testedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissioningTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationSpareMovement" (
    "id" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "movementType" "SpareMovementType" NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallationSpareMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstallationJob_installationNumber_key" ON "InstallationJob"("installationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationJob_dispatchId_key" ON "InstallationJob"("dispatchId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationJob_serviceRequestId_key" ON "InstallationJob"("serviceRequestId");

-- CreateIndex
CREATE INDEX "InstallationJob_status_idx" ON "InstallationJob"("status");

-- CreateIndex
CREATE INDEX "InstallationJob_engineerId_idx" ON "InstallationJob"("engineerId");

-- CreateIndex
CREATE INDEX "InstallationJob_warrantyContractId_idx" ON "InstallationJob"("warrantyContractId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationChecklistItem_installationId_sequence_key" ON "InstallationChecklistItem"("installationId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "CommissioningTest_installationId_sequence_key" ON "CommissioningTest"("installationId", "sequence");

-- CreateIndex
CREATE INDEX "InstallationSpareMovement_installationId_idx" ON "InstallationSpareMovement"("installationId");

-- CreateIndex
CREATE INDEX "InstallationSpareMovement_inventoryItemId_idx" ON "InstallationSpareMovement"("inventoryItemId");

-- CreateIndex
CREATE INDEX "InstallationSpareMovement_movementType_idx" ON "InstallationSpareMovement"("movementType");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_installationJobId_fkey" FOREIGN KEY ("installationJobId") REFERENCES "InstallationJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationJob" ADD CONSTRAINT "InstallationJob_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationJob" ADD CONSTRAINT "InstallationJob_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationJob" ADD CONSTRAINT "InstallationJob_warrantyContractId_fkey" FOREIGN KEY ("warrantyContractId") REFERENCES "ServiceContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationJob" ADD CONSTRAINT "InstallationJob_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationJob" ADD CONSTRAINT "InstallationJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationChecklistItem" ADD CONSTRAINT "InstallationChecklistItem_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "InstallationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissioningTest" ADD CONSTRAINT "CommissioningTest_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "InstallationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationSpareMovement" ADD CONSTRAINT "InstallationSpareMovement_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "InstallationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationSpareMovement" ADD CONSTRAINT "InstallationSpareMovement_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationSpareMovement" ADD CONSTRAINT "InstallationSpareMovement_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
