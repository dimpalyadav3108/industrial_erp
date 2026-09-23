-- AlterTable
ALTER TABLE "ProductionJobCard" ADD COLUMN     "downtimeMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reworkQuantity" DECIMAL(15,3) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ProductionMaterialConsumption" ADD COLUMN     "batchNumber" TEXT,
ADD COLUMN     "heatNumber" TEXT,
ADD COLUMN     "materialCertificateNumber" TEXT,
ADD COLUMN     "serialNumber" TEXT;

-- AlterTable
ALTER TABLE "ProductionOperation" ADD COLUMN     "downtimeMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reworkQuantity" DECIMAL(15,3) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProductionTraceability" (
    "id" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "operationId" TEXT,
    "inventoryItemId" TEXT,
    "componentName" TEXT NOT NULL,
    "heatNumber" TEXT,
    "batchNumber" TEXT,
    "serialNumber" TEXT,
    "materialCertificateNumber" TEXT,
    "quantity" DECIMAL(15,3) NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionTraceability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionDowntime" (
    "id" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "operationId" TEXT,
    "machineId" TEXT,
    "category" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionDowntime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductionTraceability_productionOrderId_idx" ON "ProductionTraceability"("productionOrderId");

-- CreateIndex
CREATE INDEX "ProductionTraceability_operationId_idx" ON "ProductionTraceability"("operationId");

-- CreateIndex
CREATE INDEX "ProductionTraceability_inventoryItemId_idx" ON "ProductionTraceability"("inventoryItemId");

-- CreateIndex
CREATE INDEX "ProductionTraceability_heatNumber_idx" ON "ProductionTraceability"("heatNumber");

-- CreateIndex
CREATE INDEX "ProductionTraceability_batchNumber_idx" ON "ProductionTraceability"("batchNumber");

-- CreateIndex
CREATE INDEX "ProductionTraceability_serialNumber_idx" ON "ProductionTraceability"("serialNumber");

-- CreateIndex
CREATE INDEX "ProductionDowntime_productionOrderId_idx" ON "ProductionDowntime"("productionOrderId");

-- CreateIndex
CREATE INDEX "ProductionDowntime_operationId_idx" ON "ProductionDowntime"("operationId");

-- CreateIndex
CREATE INDEX "ProductionDowntime_machineId_idx" ON "ProductionDowntime"("machineId");

-- CreateIndex
CREATE INDEX "ProductionDowntime_startedAt_idx" ON "ProductionDowntime"("startedAt");

-- AddForeignKey
ALTER TABLE "ProductionTraceability" ADD CONSTRAINT "ProductionTraceability_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionDowntime" ADD CONSTRAINT "ProductionDowntime_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
