ALTER TABLE "EngineeringBomItem" ADD COLUMN "alternateMaterial" TEXT;
ALTER TABLE "EngineeringBomItem" ADD COLUMN "unitCost" DECIMAL(15,2);
CREATE INDEX IF NOT EXISTS "EngineeringBomItem_bomId_parentItemId_idx" ON "EngineeringBomItem"("bomId", "parentItemId");
