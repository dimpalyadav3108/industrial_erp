CREATE TYPE "InstallationUpdateType" AS ENUM ('PHOTO','PROGRESS','ISSUE');
CREATE TYPE "InstallationReportType" AS ENUM ('COMMISSIONING','STEAM_RAISING','FUEL_CONSUMPTION','EFFICIENCY');
CREATE TABLE "InstallationSiteUpdate" (
  "id" TEXT NOT NULL,
  "installationId" TEXT NOT NULL,
  "type" "InstallationUpdateType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "photoUrl" TEXT,
  "progressPct" DECIMAL(5,2),
  "issueStatus" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InstallationSiteUpdate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "InstallationReport" (
  "id" TEXT NOT NULL,
  "installationId" TEXT NOT NULL,
  "reportType" "InstallationReportType" NOT NULL,
  "reportNumber" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "steamPressure" TEXT,
  "fuelConsumption" TEXT,
  "efficiency" TEXT,
  "observations" TEXT,
  "reportUrl" TEXT,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "issuedById" TEXT,
  CONSTRAINT "InstallationReport_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InstallationReport_reportNumber_key" ON "InstallationReport"("reportNumber");
CREATE INDEX "InstallationSiteUpdate_installationId_idx" ON "InstallationSiteUpdate"("installationId");
CREATE INDEX "InstallationSiteUpdate_type_idx" ON "InstallationSiteUpdate"("type");
CREATE INDEX "InstallationReport_installationId_idx" ON "InstallationReport"("installationId");
CREATE INDEX "InstallationReport_reportType_idx" ON "InstallationReport"("reportType");
ALTER TABLE "InstallationSiteUpdate" ADD CONSTRAINT "InstallationSiteUpdate_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "InstallationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstallationSiteUpdate" ADD CONSTRAINT "InstallationSiteUpdate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InstallationReport" ADD CONSTRAINT "InstallationReport_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "InstallationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstallationReport" ADD CONSTRAINT "InstallationReport_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
