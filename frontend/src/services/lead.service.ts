import type {
  CreateLeadPayload,
  Lead,
  LeadCreateResponse,
  LeadListResponse,
} from "../types/lead";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

const getAccessToken = () => {
  const token = sessionStorage.getItem("accessToken");

  if (!token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return token;
};

export const getLeads = async (search = ""): Promise<Lead[]> => {
  const query = search.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";

  const response = await fetch(`${API_URL}/leads${query}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });

  const result = (await response.json()) as
    | LeadListResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(
      "message" in result ? result.message : "Unable to load leads"
    );
  }

  return "data" in result ? result.data : [];
};

export const createLead = async (
  payload: CreateLeadPayload
): Promise<LeadCreateResponse> => {
  const response = await fetch(`${API_URL}/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as
    | LeadCreateResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(
      "message" in result ? result.message : "Unable to create lead"
    );
  }

  return result as LeadCreateResponse;
};