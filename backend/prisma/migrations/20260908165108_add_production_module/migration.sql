-- CreateEnum
CREATE TYPE "ProductionOrderStatus" AS ENUM ('PLANNED', 'RELEASED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProductionOperationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateTable
CREATE TABLE "ProductionOrder" (
    "id" TEXT NOT NULL,
    "productionNumber" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ProductionOrderStatus" NOT NULL DEFAULT 'PLANNED',
    "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIUM',
    "quantity" DECIMAL(15,3) NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'Nos',
    "plannedStartDate" TIMESTAMP(3),
    "plannedEndDate" TIMESTAMP(3),
    "actualStartDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "progressPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionOperation" (
    "id" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "workCenter" TEXT,
    "status" "ProductionOperationStatus" NOT NULL DEFAULT 'PENDING',
    "plannedStartDate" TIMESTAMP(3),
    "plannedEndDate" TIMESTAMP(3),
    "actualStartDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOrder_productionNumber_key" ON "ProductionOrder"("productionNumber");

-- CreateIndex
CREATE INDEX "ProductionOrder_quotationId_idx" ON "ProductionOrder"("quotationId");

-- CreateIndex
CREATE INDEX "ProductionOrder_status_idx" ON "ProductionOrder"("status");

-- CreateIndex
CREATE INDEX "ProductionOrder_priority_idx" ON "ProductionOrder"("priority");

-- CreateIndex
CREATE INDEX "ProductionOrder_assignedToId_idx" ON "ProductionOrder"("assignedToId");

-- CreateIndex
CREATE INDEX "ProductionOrder_createdById_idx" ON "ProductionOrder"("createdById");

-- CreateIndex
CREATE INDEX "ProductionOrder_plannedEndDate_idx" ON "ProductionOrder"("plannedEndDate");

-- CreateIndex
CREATE INDEX "ProductionOrder_createdAt_idx" ON "ProductionOrder"("createdAt");

-- CreateIndex
CREATE INDEX "ProductionOperation_productionOrderId_idx" ON "ProductionOperation"("productionOrderId");

-- CreateIndex
CREATE INDEX "ProductionOperation_status_idx" ON "ProductionOperation"("status");

-- CreateIndex
CREATE INDEX "ProductionOperation_workCenter_idx" ON "ProductionOperation"("workCenter");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOperation_productionOrderId_sequence_key" ON "ProductionOperation"("productionOrderId", "sequence");

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOperation" ADD CONSTRAINT "ProductionOperation_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
