-- CreateEnum
CREATE TYPE "EstimateStage" AS ENUM ('RFQ', 'ENGINEERING_VALIDATION', 'BOM_ESTIMATION', 'RAW_MATERIAL_COSTING', 'LABOUR_COSTING', 'FABRICATION_COSTING', 'PAINTING_COSTING', 'TESTING_COSTING', 'TRANSPORTATION_COSTING', 'MARGIN_REVIEW', 'QUOTATION_RELEASE');

-- CreateEnum
CREATE TYPE "EngineeringValidationStatus" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RawMaterialCategory" AS ENUM ('MS_PLATE', 'SS_PLATE', 'TUBES', 'PIPES', 'VALVES', 'PUMPS', 'BURNERS', 'REFRACTORY');

-- CreateEnum
CREATE TYPE "FabricationProcess" AS ENUM ('CUTTING', 'ROLLING', 'WELDING', 'MACHINING', 'GRINDING', 'SAND_BLASTING', 'PAINTING', 'INSULATION');

-- CreateEnum
CREATE TYPE "TestingType" AS ENUM ('HYDRO_TEST', 'NDT', 'RADIOGRAPHY', 'IBR_INSPECTION');

-- CreateEnum
CREATE TYPE "LogisticsType" AS ENUM ('PACKING', 'FREIGHT', 'INSURANCE');

-- AlterTable
ALTER TABLE "Estimate"
  ADD COLUMN     "stage" "EstimateStage" NOT NULL DEFAULT 'RFQ',
  ADD COLUMN     "rfqNumber" TEXT,
  ADD COLUMN     "rfqSource" TEXT,
  ADD COLUMN     "rfqReceivedDate" TIMESTAMP(3),
  ADD COLUMN     "rfqDueDate" TIMESTAMP(3),
  ADD COLUMN     "engineeringValidationStatus" "EngineeringValidationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN     "engineeringValidationNotes" TEXT,
  ADD COLUMN     "engineeringValidatedById" TEXT,
  ADD COLUMN     "engineeringValidatedAt" TIMESTAMP(3),
  ADD COLUMN     "bomEstimationCompletedAt" TIMESTAMP(3),
  ADD COLUMN     "fabricationCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN     "paintingCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN     "testingCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN     "packingCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN     "freightCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN     "insuranceCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN     "transportationCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN     "quotationReleasedById" TEXT,
  ADD COLUMN     "quotationReleasedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EstimateItem"
  ADD COLUMN     "category" "RawMaterialCategory",
  ADD COLUMN     "process" "FabricationProcess",
  ADD COLUMN     "testType" "TestingType",
  ADD COLUMN     "logisticsType" "LogisticsType";

-- CreateIndex
CREATE INDEX "Estimate_stage_idx" ON "Estimate"("stage");

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_engineeringValidatedById_fkey" FOREIGN KEY ("engineeringValidatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_quotationReleasedById_fkey" FOREIGN KEY ("quotationReleasedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
