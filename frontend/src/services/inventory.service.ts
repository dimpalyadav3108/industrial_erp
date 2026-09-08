import type {
  CreateInventoryItemPayload,
  CreateStockMovementPayload,
  InventoryItem,
  InventoryItemResponse,
  InventoryListResponse,
  StockMovementResponse,
} from "../types/inventory";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

const headers = (json = false) => {
  const token = sessionStorage.getItem("accessToken");

  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  };
};

export const getInventoryItems = async (
  search = ""
): Promise<InventoryItem[]> => {
  const query = search.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";
  const response = await fetch(`${API_URL}/inventory${query}`, {
    headers: headers(),
  });
  const result = (await response.json()) as
    | InventoryListResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Unable to load inventory items");
  }

  return (result as InventoryListResponse).data;
};

export const getInventoryItem = async (
  itemId: string
): Promise<InventoryItem> => {
  const response = await fetch(`${API_URL}/inventory/${itemId}`, {
    headers: headers(),
  });
  const result = (await response.json()) as
    | InventoryItemResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Unable to load inventory item");
  }

  return (result as InventoryItemResponse).data;
};

export const createInventoryItem = async (
  payload: CreateInventoryItemPayload
): Promise<InventoryItem> => {
  const response = await fetch(`${API_URL}/inventory`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as
    | InventoryItemResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Unable to create inventory item");
  }

  return (result as InventoryItemResponse).data;
};

export const createStockMovement = async (
  itemId: string,
  payload: CreateStockMovementPayload
): Promise<StockMovementResponse["data"]> => {
  const response = await fetch(`${API_URL}/inventory/${itemId}/movements`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as
    | StockMovementResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Unable to record stock movement");
  }

  return (result as StockMovementResponse).data;
};

