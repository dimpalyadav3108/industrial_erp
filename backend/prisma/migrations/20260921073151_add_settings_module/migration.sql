-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL DEFAULT 'company',
    "companyName" TEXT NOT NULL DEFAULT 'Industrial ERP',
    "legalName" TEXT,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "postalCode" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "financialYearStart" INTEGER NOT NULL DEFAULT 4,
    "defaultTaxPercent" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "estimatePrefix" TEXT NOT NULL DEFAULT 'EST',
    "quotationPrefix" TEXT NOT NULL DEFAULT 'QUO',
    "productionPrefix" TEXT NOT NULL DEFAULT 'PRO',
    "dispatchPrefix" TEXT NOT NULL DEFAULT 'DSP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);
