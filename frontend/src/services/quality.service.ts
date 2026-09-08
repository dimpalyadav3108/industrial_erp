import type {
  CreateQualityInspectionPayload,
  QualityCheckResult,
  QualityInspection,
  QualityListResponse,
  QualityResponse,
} from "../types/quality";

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

export const getQualityInspections = async (
  search = ""
): Promise<QualityInspection[]> => {
  const query = search.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";
  const response = await fetch(`${API_URL}/quality${query}`, {
    headers: headers(),
  });
  const result = (await response.json()) as
    | QualityListResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Unable to load quality inspections");
  }

  return (result as QualityListResponse).data;
};

export const createQualityInspection = async (
  payload: CreateQualityInspectionPayload
): Promise<QualityInspection> => {
  const response = await fetch(`${API_URL}/quality`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as
    | QualityResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Unable to create quality inspection");
  }

  return (result as QualityResponse).data;
};

export const updateQualityCheck = async (
  inspectionId: string,
  checkId: string,
  payload: {
    result: QualityCheckResult;
    observedValue?: string;
    remarks?: string;
  }
): Promise<QualityInspection> => {
  const response = await fetch(
    `${API_URL}/quality/${inspectionId}/checks/${checkId}`,
    {
      method: "PATCH",
      headers: headers(true),
      body: JSON.stringify(payload),
    }
  );
  const result = (await response.json()) as
    | QualityResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Unable to update quality check");
  }

  return (result as QualityResponse).data;
};

