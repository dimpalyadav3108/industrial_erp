-- CreateEnum
CREATE TYPE "EngineeringProjectStatus" AS ENUM ('DRAFT', 'DESIGN_IN_PROGRESS', 'CUSTOMER_REVIEW', 'APPROVED', 'RELEASED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DrawingCategory" AS ENUM ('GENERAL_ARRANGEMENT', 'PID', 'FABRICATION', 'TUBE_LAYOUT', 'ELECTRICAL', 'INSTRUMENTATION', 'FOUNDATION', 'OTHER');

-- CreateEnum
CREATE TYPE "DrawingRevisionStatus" AS ENUM ('DRAFT', 'INTERNAL_REVIEW', 'CUSTOMER_REVIEW', 'APPROVED', 'REJECTED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "EngineeringProject" (
    "id" TEXT NOT NULL,
    "engineeringNumber" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "productFamily" TEXT,
    "productModel" TEXT,
    "status" "EngineeringProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "plannedStartDate" TIMESTAMP(3),
    "plannedReleaseDate" TIMESTAMP(3),
    "actualReleaseDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngineeringProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineeringDrawing" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "drawingNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "DrawingCategory" NOT NULL,
    "description" TEXT,
    "currentRevision" INTEGER NOT NULL DEFAULT 0,
    "status" "DrawingRevisionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngineeringDrawing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineeringDrawingRevision" (
    "id" TEXT NOT NULL,
    "drawingId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "status" "DrawingRevisionStatus" NOT NULL DEFAULT 'DRAFT',
    "documentName" TEXT,
    "documentUrl" TEXT,
    "changeReason" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "customerApproved" BOOLEAN NOT NULL DEFAULT false,
    "customerApprovedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngineeringDrawingRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EngineeringProject_engineeringNumber_key" ON "EngineeringProject"("engineeringNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EngineeringProject_quotationId_key" ON "EngineeringProject"("quotationId");

-- CreateIndex
CREATE INDEX "EngineeringProject_quotationId_idx" ON "EngineeringProject"("quotationId");

-- CreateIndex
CREATE INDEX "EngineeringProject_status_idx" ON "EngineeringProject"("status");

-- CreateIndex
CREATE INDEX "EngineeringProject_createdById_idx" ON "EngineeringProject"("createdById");

-- CreateIndex
CREATE INDEX "EngineeringProject_plannedReleaseDate_idx" ON "EngineeringProject"("plannedReleaseDate");

-- CreateIndex
CREATE INDEX "EngineeringProject_createdAt_idx" ON "EngineeringProject"("createdAt");

-- CreateIndex
CREATE INDEX "EngineeringDrawing_projectId_idx" ON "EngineeringDrawing"("projectId");

-- CreateIndex
CREATE INDEX "EngineeringDrawing_category_idx" ON "EngineeringDrawing"("category");

-- CreateIndex
CREATE INDEX "EngineeringDrawing_status_idx" ON "EngineeringDrawing"("status");

-- CreateIndex
CREATE INDEX "EngineeringDrawing_createdById_idx" ON "EngineeringDrawing"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "EngineeringDrawing_projectId_drawingNumber_key" ON "EngineeringDrawing"("projectId", "drawingNumber");

-- CreateIndex
CREATE INDEX "EngineeringDrawingRevision_drawingId_idx" ON "EngineeringDrawingRevision"("drawingId");

-- CreateIndex
CREATE INDEX "EngineeringDrawingRevision_status_idx" ON "EngineeringDrawingRevision"("status");

-- CreateIndex
CREATE INDEX "EngineeringDrawingRevision_createdById_idx" ON "EngineeringDrawingRevision"("createdById");

-- CreateIndex
CREATE INDEX "EngineeringDrawingRevision_approvedById_idx" ON "EngineeringDrawingRevision"("approvedById");

-- CreateIndex
CREATE INDEX "EngineeringDrawingRevision_customerApproved_idx" ON "EngineeringDrawingRevision"("customerApproved");

-- CreateIndex
CREATE UNIQUE INDEX "EngineeringDrawingRevision_drawingId_revisionNumber_key" ON "EngineeringDrawingRevision"("drawingId", "revisionNumber");

-- AddForeignKey
ALTER TABLE "EngineeringProject" ADD CONSTRAINT "EngineeringProject_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineeringProject" ADD CONSTRAINT "EngineeringProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineeringDrawing" ADD CONSTRAINT "EngineeringDrawing_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "EngineeringProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineeringDrawing" ADD CONSTRAINT "EngineeringDrawing_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineeringDrawingRevision" ADD CONSTRAINT "EngineeringDrawingRevision_drawingId_fkey" FOREIGN KEY ("drawingId") REFERENCES "EngineeringDrawing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineeringDrawingRevision" ADD CONSTRAINT "EngineeringDrawingRevision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineeringDrawingRevision" ADD CONSTRAINT "EngineeringDrawingRevision_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
