import type {
  CreateDispatchPayload,
  Dispatch,
  DispatchListResponse,
  DispatchResponse,
  DispatchStatus,
  LogisticsStage,
  DispatchLogistics,
  DispatchTrackingEvent,
} from "../types/dispatch";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

const headers = (json = false) => {
  const token = localStorage.getItem("accessToken");
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


export interface DispatchLogisticsPayload {
  stage?: LogisticsStage;
  deliveryStatus?: string;
  ewayBillNumber?: string;
  ewayBillDate?: string;
  eInvoiceNumber?: string;
  eInvoiceDate?: string;
  lrNumber?: string;
  lrDate?: string;
  vehicleTrackingUrl?: string;
  vehicleTrackingNote?: string;
  packingListUrl?: string;
  lrCopyUrl?: string;
  podUrl?: string;
  podReceivedAt?: string;
  notes?: string;
  trackingRemarks?: string;
}

export const getDispatchLogistics = async (id: string) => {
  const response = await fetch(`${API_URL}/dispatches/${id}/logistics`, { headers: headers() });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Unable to load logistics");
  return result.data as { logistics: DispatchLogistics; trackingEvents: DispatchTrackingEvent[] };
};

export const updateDispatchLogistics = async (id: string, payload: DispatchLogisticsPayload) => {
  const response = await fetch(`${API_URL}/dispatches/${id}/logistics`, {
    method: "PATCH", headers: headers(true), body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Unable to update logistics");
  return result.data as { logistics: DispatchLogistics; trackingEvents: DispatchTrackingEvent[] };
};

export const addDispatchTrackingEvent = async (id: string, payload: {status: string; location?: string; remarks?: string; eventAt?: string}) => {
  const response = await fetch(`${API_URL}/dispatches/${id}/tracking-events`, {
    method: "POST", headers: headers(true), body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Unable to add tracking event");
  return result.data as { logistics: DispatchLogistics; trackingEvents: DispatchTrackingEvent[] };
};

export const uploadDispatchDocument = async (id: string, documentType: "POD"|"PACKING_LIST"|"LR_COPY", file: File) => {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
  const response = await fetch(`${API_URL}/dispatches/${id}/documents`, {
    method: "POST", headers: headers(true),
    body: JSON.stringify({ documentType, fileName: file.name, data }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Unable to upload document");
  return result.data as { url: string; fileName: string; mimeType: string };
};
