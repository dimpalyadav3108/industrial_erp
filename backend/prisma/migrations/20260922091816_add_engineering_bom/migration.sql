-- CreateEnum
CREATE TYPE "BomStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'RELEASED', 'SUPERSEDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BomItemSource" AS ENUM ('MAKE', 'BUY');

-- CreateTable
CREATE TABLE "EngineeringBom" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "bomNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "status" "BomStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngineeringBom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineeringBomItem" (
    "id" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "parentItemId" TEXT,
    "inventoryItemId" TEXT,
    "itemNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "source" "BomItemSource" NOT NULL DEFAULT 'BUY',
    "materialSpec" TEXT,
    "drawingNumber" TEXT,
    "remarks" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngineeringBomItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EngineeringBom_bomNumber_key" ON "EngineeringBom"("bomNumber");

-- CreateIndex
CREATE INDEX "EngineeringBom_projectId_idx" ON "EngineeringBom"("projectId");

-- CreateIndex
CREATE INDEX "EngineeringBom_status_idx" ON "EngineeringBom"("status");

-- CreateIndex
CREATE INDEX "EngineeringBom_createdById_idx" ON "EngineeringBom"("createdById");

-- CreateIndex
CREATE INDEX "EngineeringBom_approvedById_idx" ON "EngineeringBom"("approvedById");

-- CreateIndex
CREATE INDEX "EngineeringBom_createdAt_idx" ON "EngineeringBom"("createdAt");

-- CreateIndex
CREATE INDEX "EngineeringBomItem_bomId_idx" ON "EngineeringBomItem"("bomId");

-- CreateIndex
CREATE INDEX "EngineeringBomItem_parentItemId_idx" ON "EngineeringBomItem"("parentItemId");

-- CreateIndex
CREATE INDEX "EngineeringBomItem_inventoryItemId_idx" ON "EngineeringBomItem"("inventoryItemId");

-- CreateIndex
CREATE INDEX "EngineeringBomItem_source_idx" ON "EngineeringBomItem"("source");

-- CreateIndex
CREATE UNIQUE INDEX "EngineeringBomItem_bomId_itemNumber_key" ON "EngineeringBomItem"("bomId", "itemNumber");

-- AddForeignKey
ALTER TABLE "EngineeringBom" ADD CONSTRAINT "EngineeringBom_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "EngineeringProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineeringBom" ADD CONSTRAINT "EngineeringBom_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineeringBom" ADD CONSTRAINT "EngineeringBom_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineeringBomItem" ADD CONSTRAINT "EngineeringBomItem_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "EngineeringBom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineeringBomItem" ADD CONSTRAINT "EngineeringBomItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineeringBomItem" ADD CONSTRAINT "EngineeringBomItem_parentItemId_fkey" FOREIGN KEY ("parentItemId") REFERENCES "EngineeringBomItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
