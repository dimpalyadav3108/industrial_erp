-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('PLANNED', 'READY', 'DISPATCHED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('ROAD', 'AIR', 'RAIL', 'COURIER', 'CUSTOMER_PICKUP');

-- CreateTable
CREATE TABLE "Dispatch" (
    "id" TEXT NOT NULL,
    "dispatchNumber" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "qualityInspectionId" TEXT NOT NULL,
    "status" "DispatchStatus" NOT NULL DEFAULT 'PLANNED',
    "transportMode" "TransportMode" NOT NULL DEFAULT 'ROAD',
    "dispatchDate" TIMESTAMP(3),
    "expectedDeliveryDate" TIMESTAMP(3),
    "actualDeliveryDate" TIMESTAMP(3),
    "transporterName" TEXT,
    "vehicleNumber" TEXT,
    "trackingNumber" TEXT,
    "destination" TEXT NOT NULL,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "packageCount" INTEGER NOT NULL DEFAULT 1,
    "totalWeight" DECIMAL(12,3),
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dispatch_dispatchNumber_key" ON "Dispatch"("dispatchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Dispatch_productionOrderId_key" ON "Dispatch"("productionOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Dispatch_qualityInspectionId_key" ON "Dispatch"("qualityInspectionId");

-- CreateIndex
CREATE INDEX "Dispatch_status_idx" ON "Dispatch"("status");

-- CreateIndex
CREATE INDEX "Dispatch_transportMode_idx" ON "Dispatch"("transportMode");

-- CreateIndex
CREATE INDEX "Dispatch_dispatchDate_idx" ON "Dispatch"("dispatchDate");

-- CreateIndex
CREATE INDEX "Dispatch_expectedDeliveryDate_idx" ON "Dispatch"("expectedDeliveryDate");

-- CreateIndex
CREATE INDEX "Dispatch_createdById_idx" ON "Dispatch"("createdById");

-- CreateIndex
CREATE INDEX "Dispatch_createdAt_idx" ON "Dispatch"("createdAt");

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_qualityInspectionId_fkey" FOREIGN KEY ("qualityInspectionId") REFERENCES "QualityInspection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
