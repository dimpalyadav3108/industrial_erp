-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN     "annualCostSaving" DECIMAL(18,2),
ADD COLUMN     "annualFuelSaving" DECIMAL(18,3),
ADD COLUMN     "calculatedBoilerOutput" DECIMAL(15,3),
ADD COLUMN     "calculatedThermalEfficiency" DECIMAL(6,2),
ADD COLUMN     "capacityTph" DECIMAL(12,3),
ADD COLUMN     "designPressureBar" DECIMAL(10,3),
ADD COLUMN     "estimatedFuelSavingPerHour" DECIMAL(15,3),
ADD COLUMN     "existingBoilerEfficiency" DECIMAL(6,2),
ADD COLUMN     "feedWaterTemperatureC" DECIMAL(10,2),
ADD COLUMN     "flueGasTemperatureC" DECIMAL(10,2),
ADD COLUMN     "fuelCalorificValueKcalKg" DECIMAL(15,2),
ADD COLUMN     "fuelConsumptionPerHour" DECIMAL(15,3),
ADD COLUMN     "fuelPricePerUnit" DECIMAL(15,2),
ADD COLUMN     "fuelType" TEXT,
ADD COLUMN     "operatingDaysPerYear" INTEGER,
ADD COLUMN     "operatingHoursPerDay" DECIMAL(6,2),
ADD COLUMN     "processIndustry" TEXT,
ADD COLUMN     "productFamily" TEXT,
ADD COLUMN     "productModel" TEXT,
ADD COLUMN     "proposedBoilerEfficiency" DECIMAL(6,2),
ADD COLUMN     "requiredSteamConsumption" DECIMAL(12,3),
ADD COLUMN     "steamTemperatureC" DECIMAL(10,2),
ADD COLUMN     "technicalNotes" TEXT,
ADD COLUMN     "workingPressureBar" DECIMAL(10,3);

-- CreateIndex
CREATE INDEX "Estimate_productFamily_idx" ON "Estimate"("productFamily");

-- CreateIndex
CREATE INDEX "Estimate_fuelType_idx" ON "Estimate"("fuelType");
