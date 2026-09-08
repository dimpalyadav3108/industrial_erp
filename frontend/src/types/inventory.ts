export type InventoryItemType =
  | "RAW_MATERIAL"
  | "COMPONENT"
  | "CONSUMABLE"
  | "FINISHED_GOOD";

export type StockMovementType =
  | "RECEIPT"
  | "ISSUE"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "RETURN_IN"
  | "RETURN_OUT";

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  movementType: StockMovementType;
  quantity: string;
  balanceAfter: string;
  unitCost: string | null;
  referenceType: string | null;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface InventoryItem {
  id: string;
  itemCode: string;
  name: string;
  description: string | null;
  itemType: InventoryItemType;
  category: string | null;
  unit: string;
  currentStock: string;
  reorderLevel: string;
  unitCost: string;
  location: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  movements?: StockMovement[];
}

export interface CreateInventoryItemPayload {
  name: string;
  description?: string;
  itemType: InventoryItemType;
  category?: string;
  unit: string;
  openingStock: number;
  reorderLevel: number;
  unitCost: number;
  location?: string;
}

export interface CreateStockMovementPayload {
  movementType: StockMovementType;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface InventoryListResponse {
  success: boolean;
  data: InventoryItem[];
  message?: string;
}

export interface InventoryItemResponse {
  success: boolean;
  data: InventoryItem;
  message?: string;
}

export interface StockMovementResponse {
  success: boolean;
  data: {
    kind: "SUCCESS";
    item: InventoryItem;
    movement: StockMovement;
  };
  message?: string;
}

