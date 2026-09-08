import type {
  CreateProductionOrderPayload,
  ProductionOperationStatus,
  ProductionOrder,
  ProductionOrderStatus,
  ProductionListResponse,
  ProductionResponse,
} from "../types/production";

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

export const getProductionOrders = async (
  search = ""
): Promise<ProductionOrder[]> => {
  const query = search.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";
  const response = await fetch(`${API_URL}/production${query}`, {
    headers: headers(),
  });
  const result = (await response.json()) as
    | ProductionListResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Unable to load production orders");
  }

  return (result as ProductionListResponse).data;
};

export const createProductionOrder = async (
  payload: CreateProductionOrderPayload
): Promise<ProductionOrder> => {
  const response = await fetch(`${API_URL}/production`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as
    | ProductionResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Unable to create production order");
  }

  return (result as ProductionResponse).data;
};

export const updateProductionOrderStatus = async (
  orderId: string,
  status: ProductionOrderStatus
): Promise<ProductionOrder> => {
  const response = await fetch(`${API_URL}/production/${orderId}`, {
    method: "PATCH",
    headers: headers(true),
    body: JSON.stringify({ status }),
  });
  const result = (await response.json()) as
    | ProductionResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Unable to update production status");
  }

  return (result as ProductionResponse).data;
};

export const updateProductionOperation = async (
  orderId: string,
  operationId: string,
  status: ProductionOperationStatus
): Promise<ProductionOrder> => {
  const response = await fetch(
    `${API_URL}/production/${orderId}/operations/${operationId}`,
    {
      method: "PATCH",
      headers: headers(true),
      body: JSON.stringify({ status }),
    }
  );
  const result = (await response.json()) as
    | ProductionResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Unable to update operation");
  }

  return (result as ProductionResponse).data;
};

