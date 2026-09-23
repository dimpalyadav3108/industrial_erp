-- CreateEnum
CREATE TYPE "QualityDocumentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'RELEASED');

-- CreateEnum
CREATE TYPE "IbrDocumentType" AS ENUM ('FORM_III', 'FORM_IV', 'FORM_XVI', 'DRAWING', 'MATERIAL_CERTIFICATE', 'TEST_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "IbrDocumentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WeldingProcedureType" AS ENUM ('WPS', 'PQR');

-- CreateEnum
CREATE TYPE "WeldingProcedureStatus" AS ENUM ('DRAFT', 'QUALIFIED', 'EXPIRED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "WelderQualificationStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "WeldJointStatus" AS ENUM ('PLANNED', 'WELDED', 'INSPECTED', 'ACCEPTED', 'REJECTED', 'REPAIR');

-- CreateEnum
CREATE TYPE "NcrSeverity" AS ENUM ('MINOR', 'MAJOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NcrStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CapaStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'VERIFICATION', 'CLOSED');

-- CreateTable
CREATE TABLE "InspectionTestPlan" (
    "id" TEXT NOT NULL,
    "itpNumber" TEXT NOT NULL,
    "productionOrderId" TEXT,
    "title" TEXT NOT NULL,
    "revision" TEXT NOT NULL DEFAULT '0',
    "status" "QualityDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "remarks" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionTestPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionTestPlanItem" (
    "id" TEXT NOT NULL,
    "itpId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "activity" TEXT NOT NULL,
    "acceptanceCriteria" TEXT,
    "inspectionMethod" TEXT,
    "holdPoint" BOOLEAN NOT NULL DEFAULT false,
    "witnessPoint" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionTestPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IbrDocument" (
    "id" TEXT NOT NULL,
    "productionOrderId" TEXT,
    "documentType" "IbrDocumentType" NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "revision" TEXT NOT NULL DEFAULT '0',
    "status" "IbrDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "remarks" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IbrDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeldingProcedure" (
    "id" TEXT NOT NULL,
    "procedureType" "WeldingProcedureType" NOT NULL,
    "procedureNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "revision" TEXT NOT NULL DEFAULT '0',
    "process" TEXT NOT NULL,
    "baseMaterial" TEXT,
    "fillerMaterial" TEXT,
    "thicknessRange" TEXT,
    "position" TEXT,
    "status" "WeldingProcedureStatus" NOT NULL DEFAULT 'DRAFT',
    "qualifiedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "remarks" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeldingProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WelderQualification" (
    "id" TEXT NOT NULL,
    "welderCode" TEXT NOT NULL,
    "welderName" TEXT NOT NULL,
    "qualificationNumber" TEXT NOT NULL,
    "process" TEXT NOT NULL,
    "position" TEXT,
    "materialGroup" TEXT,
    "qualifiedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" "WelderQualificationStatus" NOT NULL DEFAULT 'ACTIVE',
    "documentUrl" TEXT,
    "remarks" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WelderQualification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeldJoint" (
    "id" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "jointNumber" TEXT NOT NULL,
    "drawingNumber" TEXT,
    "wpsId" TEXT,
    "welderQualificationId" TEXT,
    "material" TEXT,
    "size" TEXT,
    "status" "WeldJointStatus" NOT NULL DEFAULT 'PLANNED',
    "weldedAt" TIMESTAMP(3),
    "inspectionMethod" TEXT,
    "inspectionResult" TEXT,
    "remarks" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeldJoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NonConformanceReport" (
    "id" TEXT NOT NULL,
    "ncrNumber" TEXT NOT NULL,
    "productionOrderId" TEXT,
    "qualityInspectionId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "NcrSeverity" NOT NULL DEFAULT 'MINOR',
    "status" "NcrStatus" NOT NULL DEFAULT 'OPEN',
    "disposition" TEXT,
    "rootCause" TEXT,
    "dueDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NonConformanceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectivePreventiveAction" (
    "id" TEXT NOT NULL,
    "capaNumber" TEXT NOT NULL,
    "ncrId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "correctiveAction" TEXT NOT NULL,
    "preventiveAction" TEXT,
    "ownerId" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "CapaStatus" NOT NULL DEFAULT 'OPEN',
    "effectivenessCheck" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorrectivePreventiveAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InspectionTestPlan_itpNumber_key" ON "InspectionTestPlan"("itpNumber");

-- CreateIndex
CREATE INDEX "InspectionTestPlan_productionOrderId_idx" ON "InspectionTestPlan"("productionOrderId");

-- CreateIndex
CREATE INDEX "InspectionTestPlan_status_idx" ON "InspectionTestPlan"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionTestPlanItem_itpId_sequence_key" ON "InspectionTestPlanItem"("itpId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "IbrDocument_documentNumber_key" ON "IbrDocument"("documentNumber");

-- CreateIndex
CREATE INDEX "IbrDocument_productionOrderId_idx" ON "IbrDocument"("productionOrderId");

-- CreateIndex
CREATE INDEX "IbrDocument_documentType_idx" ON "IbrDocument"("documentType");

-- CreateIndex
CREATE INDEX "IbrDocument_status_idx" ON "IbrDocument"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WeldingProcedure_procedureNumber_key" ON "WeldingProcedure"("procedureNumber");

-- CreateIndex
CREATE INDEX "WeldingProcedure_procedureType_idx" ON "WeldingProcedure"("procedureType");

-- CreateIndex
CREATE INDEX "WeldingProcedure_status_idx" ON "WeldingProcedure"("status");

-- CreateIndex
CREATE INDEX "WeldingProcedure_expiryDate_idx" ON "WeldingProcedure"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "WelderQualification_qualificationNumber_key" ON "WelderQualification"("qualificationNumber");

-- CreateIndex
CREATE INDEX "WelderQualification_welderCode_idx" ON "WelderQualification"("welderCode");

-- CreateIndex
CREATE INDEX "WelderQualification_status_idx" ON "WelderQualification"("status");

-- CreateIndex
CREATE INDEX "WelderQualification_expiryDate_idx" ON "WelderQualification"("expiryDate");

-- CreateIndex
CREATE INDEX "WeldJoint_wpsId_idx" ON "WeldJoint"("wpsId");

-- CreateIndex
CREATE INDEX "WeldJoint_welderQualificationId_idx" ON "WeldJoint"("welderQualificationId");

-- CreateIndex
CREATE INDEX "WeldJoint_status_idx" ON "WeldJoint"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WeldJoint_productionOrderId_jointNumber_key" ON "WeldJoint"("productionOrderId", "jointNumber");

-- CreateIndex
CREATE UNIQUE INDEX "NonConformanceReport_ncrNumber_key" ON "NonConformanceReport"("ncrNumber");

-- CreateIndex
CREATE INDEX "NonConformanceReport_productionOrderId_idx" ON "NonConformanceReport"("productionOrderId");

-- CreateIndex
CREATE INDEX "NonConformanceReport_qualityInspectionId_idx" ON "NonConformanceReport"("qualityInspectionId");

-- CreateIndex
CREATE INDEX "NonConformanceReport_severity_idx" ON "NonConformanceReport"("severity");

-- CreateIndex
CREATE INDEX "NonConformanceReport_status_idx" ON "NonConformanceReport"("status");

-- CreateIndex
CREATE INDEX "NonConformanceReport_dueDate_idx" ON "NonConformanceReport"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "CorrectivePreventiveAction_capaNumber_key" ON "CorrectivePreventiveAction"("capaNumber");

-- CreateIndex
CREATE INDEX "CorrectivePreventiveAction_ncrId_idx" ON "CorrectivePreventiveAction"("ncrId");

-- CreateIndex
CREATE INDEX "CorrectivePreventiveAction_ownerId_idx" ON "CorrectivePreventiveAction"("ownerId");

-- CreateIndex
CREATE INDEX "CorrectivePreventiveAction_status_idx" ON "CorrectivePreventiveAction"("status");

-- CreateIndex
CREATE INDEX "CorrectivePreventiveAction_dueDate_idx" ON "CorrectivePreventiveAction"("dueDate");

-- AddForeignKey
ALTER TABLE "InspectionTestPlan" ADD CONSTRAINT "InspectionTestPlan_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionTestPlan" ADD CONSTRAINT "InspectionTestPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionTestPlan" ADD CONSTRAINT "InspectionTestPlan_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionTestPlanItem" ADD CONSTRAINT "InspectionTestPlanItem_itpId_fkey" FOREIGN KEY ("itpId") REFERENCES "InspectionTestPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IbrDocument" ADD CONSTRAINT "IbrDocument_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IbrDocument" ADD CONSTRAINT "IbrDocument_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IbrDocument" ADD CONSTRAINT "IbrDocument_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeldingProcedure" ADD CONSTRAINT "WeldingProcedure_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelderQualification" ADD CONSTRAINT "WelderQualification_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeldJoint" ADD CONSTRAINT "WeldJoint_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeldJoint" ADD CONSTRAINT "WeldJoint_wpsId_fkey" FOREIGN KEY ("wpsId") REFERENCES "WeldingProcedure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeldJoint" ADD CONSTRAINT "WeldJoint_welderQualificationId_fkey" FOREIGN KEY ("welderQualificationId") REFERENCES "WelderQualification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeldJoint" ADD CONSTRAINT "WeldJoint_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformanceReport" ADD CONSTRAINT "NonConformanceReport_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformanceReport" ADD CONSTRAINT "NonConformanceReport_qualityInspectionId_fkey" FOREIGN KEY ("qualityInspectionId") REFERENCES "QualityInspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformanceReport" ADD CONSTRAINT "NonConformanceReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectivePreventiveAction" ADD CONSTRAINT "CorrectivePreventiveAction_ncrId_fkey" FOREIGN KEY ("ncrId") REFERENCES "NonConformanceReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectivePreventiveAction" ADD CONSTRAINT "CorrectivePreventiveAction_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectivePreventiveAction" ADD CONSTRAINT "CorrectivePreventiveAction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
