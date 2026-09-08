-- CreateEnum
CREATE TYPE "QualityInspectionType" AS ENUM ('IN_PROCESS', 'FINAL');

-- CreateEnum
CREATE TYPE "QualityInspectionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "QualityCheckResult" AS ENUM ('PENDING', 'PASS', 'FAIL', 'NOT_APPLICABLE');

-- CreateTable
CREATE TABLE "QualityInspection" (
    "id" TEXT NOT NULL,
    "inspectionNumber" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "inspectionType" "QualityInspectionType" NOT NULL,
    "status" "QualityInspectionStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledDate" TIMESTAMP(3),
    "inspectionDate" TIMESTAMP(3),
    "inspectorId" TEXT,
    "createdById" TEXT,
    "remarks" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualityInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityCheckItem" (
    "id" TEXT NOT NULL,
    "qualityInspectionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "parameter" TEXT NOT NULL,
    "specification" TEXT,
    "observedValue" TEXT,
    "result" "QualityCheckResult" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualityCheckItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QualityInspection_inspectionNumber_key" ON "QualityInspection"("inspectionNumber");

-- CreateIndex
CREATE INDEX "QualityInspection_productionOrderId_idx" ON "QualityInspection"("productionOrderId");

-- CreateIndex
CREATE INDEX "QualityInspection_inspectionType_idx" ON "QualityInspection"("inspectionType");

-- CreateIndex
CREATE INDEX "QualityInspection_status_idx" ON "QualityInspection"("status");

-- CreateIndex
CREATE INDEX "QualityInspection_inspectorId_idx" ON "QualityInspection"("inspectorId");

-- CreateIndex
CREATE INDEX "QualityInspection_scheduledDate_idx" ON "QualityInspection"("scheduledDate");

-- CreateIndex
CREATE INDEX "QualityInspection_createdAt_idx" ON "QualityInspection"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QualityInspection_productionOrderId_inspectionType_key" ON "QualityInspection"("productionOrderId", "inspectionType");

-- CreateIndex
CREATE INDEX "QualityCheckItem_qualityInspectionId_idx" ON "QualityCheckItem"("qualityInspectionId");

-- CreateIndex
CREATE INDEX "QualityCheckItem_result_idx" ON "QualityCheckItem"("result");

-- CreateIndex
CREATE UNIQUE INDEX "QualityCheckItem_qualityInspectionId_sequence_key" ON "QualityCheckItem"("qualityInspectionId", "sequence");

-- AddForeignKey
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityCheckItem" ADD CONSTRAINT "QualityCheckItem_qualityInspectionId_fkey" FOREIGN KEY ("qualityInspectionId") REFERENCES "QualityInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
