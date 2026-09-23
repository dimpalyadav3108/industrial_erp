
CREATE TABLE "DispatchLogistics" (
  "id" TEXT NOT NULL,
  "dispatchId" TEXT NOT NULL,
  "stage" TEXT NOT NULL DEFAULT 'FG_READY',
  "fgReadyAt" TIMESTAMP(3),
  "packedAt" TIMESTAMP(3),
  "loadedAt" TIMESTAMP(3),
  "dispatchedAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "deliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "ewayBillNumber" TEXT,
  "ewayBillDate" TIMESTAMP(3),
  "eInvoiceNumber" TEXT,
  "eInvoiceDate" TIMESTAMP(3),
  "lrNumber" TEXT,
  "lrDate" TIMESTAMP(3),
  "vehicleTrackingUrl" TEXT,
  "vehicleTrackingNote" TEXT,
  "packingListUrl" TEXT,
  "lrCopyUrl" TEXT,
  "podUrl" TEXT,
  "podReceivedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DispatchLogistics_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DispatchLogistics_dispatchId_key" UNIQUE ("dispatchId"),
  CONSTRAINT "DispatchLogistics_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "DispatchTrackingEvent" (
  "id" TEXT NOT NULL,
  "dispatchId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "location" TEXT,
  "remarks" TEXT,
  "eventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DispatchTrackingEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DispatchTrackingEvent_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DispatchTrackingEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "DispatchLogistics_stage_idx" ON "DispatchLogistics"("stage");
CREATE INDEX "DispatchLogistics_deliveryStatus_idx" ON "DispatchLogistics"("deliveryStatus");
CREATE INDEX "DispatchTrackingEvent_dispatchId_eventAt_idx" ON "DispatchTrackingEvent"("dispatchId","eventAt");
