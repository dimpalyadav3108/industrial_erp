ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "steamCapacityTph" DECIMAL(12,3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "workingPressureBar" DECIMAL(10,3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "fuelType" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "feedWaterSource" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "steamConsumption" DECIMAL(12,3);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "operatingHoursPerDay" DECIMAL(6,2);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "existingFuelCost" DECIMAL(15,2);
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "industryType" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "crmStage" TEXT NOT NULL DEFAULT 'LEAD_RECEIVED';

CREATE TABLE IF NOT EXISTS "LeadActivity" (
  "id" TEXT NOT NULL, "leadId" TEXT NOT NULL, "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PLANNED', "subject" TEXT NOT NULL, "notes" TEXT,
  "scheduledAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "assignedToId" TEXT, "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LeadActivity_leadId_type_idx" ON "LeadActivity"("leadId", "type");
CREATE INDEX IF NOT EXISTS "LeadActivity_scheduledAt_idx" ON "LeadActivity"("scheduledAt");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeadActivity_leadId_fkey') THEN ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeadActivity_assignedToId_fkey') THEN ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeadActivity_createdById_fkey') THEN ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF;
END $$;

CREATE TABLE IF NOT EXISTS "LeadCompetitor" (
  "id" TEXT NOT NULL, "leadId" TEXT NOT NULL, "name" TEXT NOT NULL, "notes" TEXT,
  "quotedValue" DECIMAL(15,2), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadCompetitor_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LeadCompetitor_leadId_idx" ON "LeadCompetitor"("leadId");
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeadCompetitor_leadId_fkey') THEN ALTER TABLE "LeadCompetitor" ADD CONSTRAINT "LeadCompetitor_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

CREATE TABLE IF NOT EXISTS "LeadOutcomeRecord" (
  "id" TEXT NOT NULL, "leadId" TEXT NOT NULL, "outcome" TEXT NOT NULL, "reason" TEXT, "notes" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdById" TEXT,
  CONSTRAINT "LeadOutcomeRecord_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LeadOutcomeRecord_leadId_outcome_idx" ON "LeadOutcomeRecord"("leadId", "outcome");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeadOutcomeRecord_leadId_fkey') THEN ALTER TABLE "LeadOutcomeRecord" ADD CONSTRAINT "LeadOutcomeRecord_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeadOutcomeRecord_createdById_fkey') THEN ALTER TABLE "LeadOutcomeRecord" ADD CONSTRAINT "LeadOutcomeRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; END IF;
END $$;

CREATE TABLE IF NOT EXISTS "LeadTechnicalSurvey" (
  "id" TEXT NOT NULL, "leadId" TEXT NOT NULL, "engineerVisitAt" TIMESTAMP(3),
  "siteAudit" BOOLEAN NOT NULL DEFAULT false, "utilityAudit" BOOLEAN NOT NULL DEFAULT false, "fuelAudit" BOOLEAN NOT NULL DEFAULT false, "waterAudit" BOOLEAN NOT NULL DEFAULT false,
  "surveyReport" TEXT, "boilerRoomLayout" TEXT, "chimneyHeightM" DECIMAL(10,2), "waterAnalysis" TEXT,
  "existingSteamNetwork" TEXT, "fuelStorage" TEXT, "engineerNotes" TEXT, "status" TEXT NOT NULL DEFAULT 'DRAFT', "proposalReference" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadTechnicalSurvey_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LeadTechnicalSurvey_leadId_idx" ON "LeadTechnicalSurvey"("leadId");
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeadTechnicalSurvey_leadId_fkey') THEN ALTER TABLE "LeadTechnicalSurvey" ADD CONSTRAINT "LeadTechnicalSurvey_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;

CREATE TABLE IF NOT EXISTS "LeadTender" (
  "id" TEXT NOT NULL, "leadId" TEXT NOT NULL, "tenderNumber" TEXT NOT NULL, "dueDate" TIMESTAMP(3), "emdAmount" DECIMAL(15,2), "bgAmount" DECIMAL(15,2),
  "technicalClarifications" TEXT, "status" TEXT NOT NULL DEFAULT 'RECEIVED', "eligibilityCheckedAt" TIMESTAMP(3), "emdSubmittedAt" TIMESTAMP(3),
  "technicalBidAt" TIMESTAMP(3), "commercialBidAt" TIMESTAMP(3), "negotiationNotes" TEXT, "awardDate" TIMESTAMP(3), "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadTender_pkey" PRIMARY KEY ("id"), CONSTRAINT "LeadTender_tenderNumber_key" UNIQUE ("tenderNumber")
);
CREATE INDEX IF NOT EXISTS "LeadTender_leadId_status_idx" ON "LeadTender"("leadId", "status");
CREATE INDEX IF NOT EXISTS "LeadTender_dueDate_idx" ON "LeadTender"("dueDate");
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeadTender_leadId_fkey') THEN ALTER TABLE "LeadTender" ADD CONSTRAINT "LeadTender_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE; END IF; END $$;
