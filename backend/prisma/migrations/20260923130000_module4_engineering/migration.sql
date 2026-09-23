-- Module 4: Engineering workflow, DMS and ECR
CREATE TYPE "EngineeringWorkflowStage" AS ENUM ('SALES_ORDER','ENGINEERING_RELEASE','DESIGN_CREATION','GA_DRAWING','CUSTOMER_APPROVAL','FABRICATION_DRAWING','BOM_RELEASE','PRODUCTION_RELEASE');
CREATE TYPE "EngineeringDocumentStatus" AS ENUM ('DRAFT','INTERNAL_REVIEW','CUSTOMER_REVIEW','APPROVED','REJECTED','SUPERSEDED');
CREATE TYPE "EcrStatus" AS ENUM ('DRAFT','IMPACT_ANALYSIS','PENDING_APPROVAL','APPROVED','REJECTED','IMPLEMENTED','CANCELLED');

ALTER TABLE "EngineeringProject" ADD COLUMN "salesOrderId" TEXT;
ALTER TABLE "EngineeringProject" ADD COLUMN "workflowStage" "EngineeringWorkflowStage" NOT NULL DEFAULT 'SALES_ORDER';
ALTER TABLE "EngineeringProject" ADD COLUMN "engineeringReleasedAt" TIMESTAMP(3);
ALTER TABLE "EngineeringProject" ADD COLUMN "designCreatedAt" TIMESTAMP(3);
ALTER TABLE "EngineeringProject" ADD COLUMN "customerApprovalAt" TIMESTAMP(3);
ALTER TABLE "EngineeringProject" ADD COLUMN "fabricationReleasedAt" TIMESTAMP(3);
ALTER TABLE "EngineeringProject" ADD COLUMN "bomReleasedAt" TIMESTAMP(3);
ALTER TABLE "EngineeringProject" ADD COLUMN "productionReleasedAt" TIMESTAMP(3);
ALTER TABLE "EngineeringProject" ADD COLUMN "customerApprovedVersion" TEXT;
CREATE UNIQUE INDEX "EngineeringProject_salesOrderId_key" ON "EngineeringProject"("salesOrderId");
CREATE INDEX "EngineeringProject_salesOrderId_idx" ON "EngineeringProject"("salesOrderId");
ALTER TABLE "EngineeringProject" ADD CONSTRAINT "EngineeringProject_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EngineeringDrawingRevision" ADD COLUMN "versionLabel" TEXT NOT NULL DEFAULT 'V1.0';
ALTER TABLE "EngineeringDrawingRevision" ADD COLUMN "modifiedById" TEXT;
ALTER TABLE "EngineeringDrawingRevision" ADD COLUMN "modifiedAt" TIMESTAMP(3);
ALTER TABLE "EngineeringDrawingRevision" ADD COLUMN "approvalComment" TEXT;
ALTER TABLE "EngineeringDrawingRevision" ADD COLUMN "customerApprovalReference" TEXT;
ALTER TABLE "EngineeringDrawingRevision" ADD CONSTRAINT "EngineeringDrawingRevision_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "EngineeringDrawingRevision_modifiedById_idx" ON "EngineeringDrawingRevision"("modifiedById");

CREATE TABLE "EngineeringDocument" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "drawingId" TEXT,
  "documentNumber" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" "DrawingCategory" NOT NULL,
  "versionLabel" TEXT NOT NULL DEFAULT 'V1.0',
  "status" "EngineeringDocumentStatus" NOT NULL DEFAULT 'DRAFT',
  "fileName" TEXT,
  "fileUrl" TEXT,
  "modificationReason" TEXT,
  "modifiedById" TEXT,
  "modifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "customerApproved" BOOLEAN NOT NULL DEFAULT false,
  "customerApprovedAt" TIMESTAMP(3),
  "customerApprovedVersion" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EngineeringDocument_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EngineeringDocument_projectId_documentNumber_versionLabel_key" ON "EngineeringDocument"("projectId","documentNumber","versionLabel");
CREATE INDEX "EngineeringDocument_projectId_idx" ON "EngineeringDocument"("projectId");
CREATE INDEX "EngineeringDocument_drawingId_idx" ON "EngineeringDocument"("drawingId");
CREATE INDEX "EngineeringDocument_category_idx" ON "EngineeringDocument"("category");
CREATE INDEX "EngineeringDocument_status_idx" ON "EngineeringDocument"("status");
ALTER TABLE "EngineeringDocument" ADD CONSTRAINT "EngineeringDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "EngineeringProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EngineeringDocument" ADD CONSTRAINT "EngineeringDocument_drawingId_fkey" FOREIGN KEY ("drawingId") REFERENCES "EngineeringDrawing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EngineeringDocument" ADD CONSTRAINT "EngineeringDocument_modifiedById_fkey" FOREIGN KEY ("modifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EngineeringDocument" ADD CONSTRAINT "EngineeringDocument_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "EngineeringChangeRequest" (
  "id" TEXT NOT NULL,
  "ecrNumber" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "impactAnalysis" TEXT,
  "impactedDocuments" TEXT,
  "impactedBomItems" TEXT,
  "productionImpact" TEXT,
  "status" "EcrStatus" NOT NULL DEFAULT 'DRAFT',
  "bomUpdateRequired" BOOLEAN NOT NULL DEFAULT false,
  "productionUpdateRequired" BOOLEAN NOT NULL DEFAULT false,
  "bomUpdatedAt" TIMESTAMP(3),
  "productionUpdatedAt" TIMESTAMP(3),
  "createdById" TEXT,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "implementedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EngineeringChangeRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EngineeringChangeRequest_ecrNumber_key" ON "EngineeringChangeRequest"("ecrNumber");
CREATE INDEX "EngineeringChangeRequest_projectId_idx" ON "EngineeringChangeRequest"("projectId");
CREATE INDEX "EngineeringChangeRequest_status_idx" ON "EngineeringChangeRequest"("status");
CREATE INDEX "EngineeringChangeRequest_createdAt_idx" ON "EngineeringChangeRequest"("createdAt");
ALTER TABLE "EngineeringChangeRequest" ADD CONSTRAINT "EngineeringChangeRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "EngineeringProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EngineeringChangeRequest" ADD CONSTRAINT "EngineeringChangeRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EngineeringChangeRequest" ADD CONSTRAINT "EngineeringChangeRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
