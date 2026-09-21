import type {
  CreateDispatchPayload,
  Dispatch,
  DispatchListResponse,
  DispatchResponse,
  DispatchStatus,
} from "../types/dispatch";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

const headers = (json = false) => {
  const token = sessionStorage.getItem("accessToken");
  if (!token) throw new Error("Your session has expired. Please sign in again.");
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  };
};

export const getDispatches = async (search = ""): Promise<Dispatch[]> => {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  const response = await fetch(`${API_URL}/dispatches${query}`, { headers: headers() });
  const result = (await response.json()) as DispatchListResponse | ApiErrorResponse;
  if (!response.ok) throw new Error(result.message || "Unable to load dispatches");
  return (result as DispatchListResponse).data;
};

export const createDispatch = async (payload: CreateDispatchPayload): Promise<Dispatch> => {
  const response = await fetch(`${API_URL}/dispatches`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as DispatchResponse | ApiErrorResponse;
  if (!response.ok) throw new Error(result.message || "Unable to create dispatch");
  return (result as DispatchResponse).data;
};

export const updateDispatchStatus = async (id: string, status: DispatchStatus): Promise<Dispatch> => {
  const response = await fetch(`${API_URL}/dispatches/${id}`, {
    method: "PATCH",
    headers: headers(true),
    body: JSON.stringify({ status }),
  });
  const result = (await response.json()) as DispatchResponse | ApiErrorResponse;
  if (!response.ok) throw new Error(result.message || "Unable to update dispatch");
  return (result as DispatchResponse).data;
};
