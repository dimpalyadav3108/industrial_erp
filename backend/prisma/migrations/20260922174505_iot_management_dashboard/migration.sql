-- CreateEnum
CREATE TYPE "IotDeviceStatus" AS ENUM ('ONLINE', 'OFFLINE', 'WARNING', 'MAINTENANCE', 'DISABLED');

-- CreateEnum
CREATE TYPE "IotAlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IotAlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateTable
CREATE TABLE "IotDevice" (
    "id" TEXT NOT NULL,
    "deviceCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "machineId" TEXT,
    "workCenterId" TEXT,
    "location" TEXT,
    "status" "IotDeviceStatus" NOT NULL DEFAULT 'OFFLINE',
    "firmware" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IotDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IotSensorReading" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "sensorType" TEXT NOT NULL,
    "value" DECIMAL(18,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "IotSensorReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IotAlert" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "sensorType" TEXT,
    "observedValue" DECIMAL(18,4),
    "thresholdValue" DECIMAL(18,4),
    "severity" "IotAlertSeverity" NOT NULL DEFAULT 'WARNING',
    "status" "IotAlertStatus" NOT NULL DEFAULT 'OPEN',
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IotAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IotDevice_deviceCode_key" ON "IotDevice"("deviceCode");

-- CreateIndex
CREATE INDEX "IotDevice_machineId_idx" ON "IotDevice"("machineId");

-- CreateIndex
CREATE INDEX "IotDevice_workCenterId_idx" ON "IotDevice"("workCenterId");

-- CreateIndex
CREATE INDEX "IotDevice_status_idx" ON "IotDevice"("status");

-- CreateIndex
CREATE INDEX "IotDevice_lastSeenAt_idx" ON "IotDevice"("lastSeenAt");

-- CreateIndex
CREATE INDEX "IotSensorReading_deviceId_recordedAt_idx" ON "IotSensorReading"("deviceId", "recordedAt");

-- CreateIndex
CREATE INDEX "IotSensorReading_sensorType_idx" ON "IotSensorReading"("sensorType");

-- CreateIndex
CREATE INDEX "IotSensorReading_recordedAt_idx" ON "IotSensorReading"("recordedAt");

-- CreateIndex
CREATE INDEX "IotAlert_deviceId_idx" ON "IotAlert"("deviceId");

-- CreateIndex
CREATE INDEX "IotAlert_status_idx" ON "IotAlert"("status");

-- CreateIndex
CREATE INDEX "IotAlert_severity_idx" ON "IotAlert"("severity");

-- CreateIndex
CREATE INDEX "IotAlert_createdAt_idx" ON "IotAlert"("createdAt");

-- AddForeignKey
ALTER TABLE "IotSensorReading" ADD CONSTRAINT "IotSensorReading_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "IotDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IotAlert" ADD CONSTRAINT "IotAlert_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "IotDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
