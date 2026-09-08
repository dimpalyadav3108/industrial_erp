import type {
  CreateEstimatePayload,
  Estimate,
  EstimateListResponse,
  EstimateResponse,
  EstimateStatus,
} from "../types/estimate";

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

export const getEstimates = async (search = ""): Promise<Estimate[]> => {
  const query = search.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";
  const response = await fetch(`${API_URL}/estimates${query}`, {
    headers: headers(),
  });
  const result = (await response.json()) as EstimateListResponse | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Unable to load estimates");
  }

  return (result as EstimateListResponse).data;
};

export const createEstimate = async (
  payload: CreateEstimatePayload
): Promise<Estimate> => {
  const response = await fetch(`${API_URL}/estimates`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as EstimateResponse | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Unable to create estimate");
  }

  return (result as EstimateResponse).data;
};

export const updateEstimateStatus = async (
  estimateId: string,
  status: EstimateStatus
): Promise<Estimate> => {
  const response = await fetch(`${API_URL}/estimates/${estimateId}/status`, {
    method: "PATCH",
    headers: headers(true),
    body: JSON.stringify({ status }),
  });
  const result = (await response.json()) as EstimateResponse | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Unable to update estimate status");
  }

  return (result as EstimateResponse).data;
};
