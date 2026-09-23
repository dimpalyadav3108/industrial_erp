-- CreateEnum
CREATE TYPE "WorkCenterStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "JobCardStatus" AS ENUM ('PLANNED', 'RELEASED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaterialConsumptionType" AS ENUM ('ISSUE', 'CONSUMPTION', 'RETURN', 'SCRAP');

-- AlterTable
ALTER TABLE "ProductionOperation" ADD COLUMN     "actualHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "machineId" TEXT,
ADD COLUMN     "plannedHours" DECIMAL(10,2),
ADD COLUMN     "producedQuantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN     "rejectedQuantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN     "scrapQuantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN     "workCenterId" TEXT;

-- AlterTable
ALTER TABLE "ProductionOrder" ADD COLUMN     "producedQuantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN     "rejectedQuantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
ADD COLUMN     "scrapQuantity" DECIMAL(15,3) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "WorkCenter" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "department" TEXT,
    "location" TEXT,
    "status" "WorkCenterStatus" NOT NULL DEFAULT 'ACTIVE',
    "capacityPerDay" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionMachine" (
    "id" TEXT NOT NULL,
    "machineCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workCenterId" TEXT NOT NULL,
    "status" "MachineStatus" NOT NULL DEFAULT 'AVAILABLE',
    "serialNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionMachine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionJobCard" (
    "id" TEXT NOT NULL,
    "jobCardNumber" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "status" "JobCardStatus" NOT NULL DEFAULT 'PLANNED',
    "plannedStartDate" TIMESTAMP(3),
    "plannedEndDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "plannedHours" DECIMAL(10,2),
    "actualHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "producedQuantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "rejectedQuantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "scrapQuantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionJobCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionMaterialConsumption" (
    "id" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "movementType" "MaterialConsumptionType" NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unitCost" DECIMAL(15,2),
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionMaterialConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkCenter_code_key" ON "WorkCenter"("code");

-- CreateIndex
CREATE INDEX "WorkCenter_name_idx" ON "WorkCenter"("name");

-- CreateIndex
CREATE INDEX "WorkCenter_department_idx" ON "WorkCenter"("department");

-- CreateIndex
CREATE INDEX "WorkCenter_status_idx" ON "WorkCenter"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionMachine_machineCode_key" ON "ProductionMachine"("machineCode");

-- CreateIndex
CREATE INDEX "ProductionMachine_workCenterId_idx" ON "ProductionMachine"("workCenterId");

-- CreateIndex
CREATE INDEX "ProductionMachine_status_idx" ON "ProductionMachine"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionJobCard_jobCardNumber_key" ON "ProductionJobCard"("jobCardNumber");

-- CreateIndex
CREATE INDEX "ProductionJobCard_productionOrderId_idx" ON "ProductionJobCard"("productionOrderId");

-- CreateIndex
CREATE INDEX "ProductionJobCard_operationId_idx" ON "ProductionJobCard"("operationId");

-- CreateIndex
CREATE INDEX "ProductionJobCard_assignedToId_idx" ON "ProductionJobCard"("assignedToId");

-- CreateIndex
CREATE INDEX "ProductionJobCard_status_idx" ON "ProductionJobCard"("status");

-- CreateIndex
CREATE INDEX "ProductionMaterialConsumption_productionOrderId_idx" ON "ProductionMaterialConsumption"("productionOrderId");

-- CreateIndex
CREATE INDEX "ProductionMaterialConsumption_inventoryItemId_idx" ON "ProductionMaterialConsumption"("inventoryItemId");

-- CreateIndex
CREATE INDEX "ProductionMaterialConsumption_movementType_idx" ON "ProductionMaterialConsumption"("movementType");

-- CreateIndex
CREATE INDEX "ProductionMaterialConsumption_createdAt_idx" ON "ProductionMaterialConsumption"("createdAt");

-- CreateIndex
CREATE INDEX "ProductionOperation_workCenterId_idx" ON "ProductionOperation"("workCenterId");

-- CreateIndex
CREATE INDEX "ProductionOperation_machineId_idx" ON "ProductionOperation"("machineId");

-- CreateIndex
CREATE INDEX "ProductionOperation_assignedToId_idx" ON "ProductionOperation"("assignedToId");

-- AddForeignKey
ALTER TABLE "ProductionMachine" ADD CONSTRAINT "ProductionMachine_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "WorkCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOperation" ADD CONSTRAINT "ProductionOperation_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "WorkCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOperation" ADD CONSTRAINT "ProductionOperation_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "ProductionMachine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOperation" ADD CONSTRAINT "ProductionOperation_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionJobCard" ADD CONSTRAINT "ProductionJobCard_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionJobCard" ADD CONSTRAINT "ProductionJobCard_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "ProductionOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionJobCard" ADD CONSTRAINT "ProductionJobCard_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionJobCard" ADD CONSTRAINT "ProductionJobCard_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMaterialConsumption" ADD CONSTRAINT "ProductionMaterialConsumption_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMaterialConsumption" ADD CONSTRAINT "ProductionMaterialConsumption_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMaterialConsumption" ADD CONSTRAINT "ProductionMaterialConsumption_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
