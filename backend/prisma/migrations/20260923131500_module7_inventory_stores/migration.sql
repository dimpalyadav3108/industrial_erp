CREATE TABLE "InventoryLocation" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "locationType" TEXT NOT NULL,
  "parentId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryLocation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InventoryLocation_code_key" ON "InventoryLocation"("code");
CREATE INDEX "InventoryLocation_type_idx" ON "InventoryLocation"("locationType");

CREATE TABLE "InventoryStockUnit" (
  "id" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "locationId" TEXT,
  "stockType" TEXT NOT NULL,
  "batchNumber" TEXT,
  "lotNumber" TEXT,
  "serialNumber" TEXT,
  "boilerSerialNumber" TEXT,
  "quantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
  "reservedQuantity" DECIMAL(15,3) NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryStockUnit_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InventoryStockUnit_item_fk" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InventoryStockUnit_location_fk" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "InventoryStockUnit_item_idx" ON "InventoryStockUnit"("inventoryItemId");
CREATE INDEX "InventoryStockUnit_batch_idx" ON "InventoryStockUnit"("batchNumber");
CREATE INDEX "InventoryStockUnit_serial_idx" ON "InventoryStockUnit"("serialNumber");
CREATE INDEX "InventoryStockUnit_boiler_serial_idx" ON "InventoryStockUnit"("boilerSerialNumber");
CREATE INDEX "InventoryStockUnit_location_idx" ON "InventoryStockUnit"("locationId");

CREATE TABLE "InventoryReservation" (
  "id" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "stockUnitId" TEXT,
  "quantity" DECIMAL(15,3) NOT NULL,
  "referenceType" TEXT NOT NULL,
  "referenceNumber" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'RESERVED',
  "reservedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "releasedAt" TIMESTAMP(3),
  CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InventoryReservation_item_fk" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InventoryReservation_stock_fk" FOREIGN KEY ("stockUnitId") REFERENCES "InventoryStockUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "InventoryReservation_user_fk" FOREIGN KEY ("reservedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "InventoryReservation_item_idx" ON "InventoryReservation"("inventoryItemId");
CREATE INDEX "InventoryReservation_status_idx" ON "InventoryReservation"("status");

CREATE TABLE "InventoryMaterialReturn" (
  "id" TEXT NOT NULL,
  "returnNumber" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "locationId" TEXT,
  "quantity" DECIMAL(15,3) NOT NULL,
  "returnType" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "sourceReference" TEXT,
  "batchNumber" TEXT,
  "serialNumber" TEXT,
  "status" TEXT NOT NULL DEFAULT 'POSTED',
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryMaterialReturn_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InventoryMaterialReturn_number_key" UNIQUE ("returnNumber"),
  CONSTRAINT "InventoryMaterialReturn_item_fk" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "InventoryMaterialReturn_location_fk" FOREIGN KEY ("locationId") REFERENCES "InventoryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "InventoryMaterialReturn_user_fk" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "InventoryMaterialReturn_item_idx" ON "InventoryMaterialReturn"("inventoryItemId");

INSERT INTO "InventoryLocation" ("id","code","name","locationType","updatedAt") VALUES
('loc_plate_yard','PLATE-YARD','Plate Yard','RAW_MATERIAL',CURRENT_TIMESTAMP),
('loc_tube_yard','TUBE-YARD','Tube Yard','RAW_MATERIAL',CURRENT_TIMESTAMP),
('loc_valve_store','VALVE-STORE','Valve Store','COMPONENT',CURRENT_TIMESTAMP),
('loc_electrical_store','ELECTRICAL-STORE','Electrical Store','COMPONENT',CURRENT_TIMESTAMP),
('loc_wip_fabrication','WIP-FABRICATION','WIP Fabrication','WIP',CURRENT_TIMESTAMP),
('loc_wip_assembly','WIP-ASSEMBLY','WIP Assembly','WIP',CURRENT_TIMESTAMP),
('loc_fg_boiler_yard','FG-BOILER-YARD','FG Boiler Yard','FINISHED_GOOD',CURRENT_TIMESTAMP),
('loc_fg_heater_yard','FG-HEATER-YARD','FG Heater Yard','FINISHED_GOOD',CURRENT_TIMESTAMP),
('loc_spare_parts','SPARE-PARTS','Spare Parts Store','SPARES',CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
