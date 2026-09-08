import type {
  CreateLeadPayload,
  Lead,
  LeadCreateResponse,
  LeadDeleteResponse,
  LeadListResponse,
  LeadResponse,
  UpdateLeadPayload,
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

const authenticatedHeaders = (includeJson = false) => ({
  ...(includeJson
    ? {
        "Content-Type": "application/json",
      }
    : {}),
  Authorization: `Bearer ${getAccessToken()}`,
});

export const getLeads = async (search = ""): Promise<Lead[]> => {
  const query = search.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";

  const response = await fetch(`${API_URL}/leads${query}`, {
    method: "GET",
    headers: authenticatedHeaders(),
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

export const getLead = async (leadId: string): Promise<Lead> => {
  const response = await fetch(`${API_URL}/leads/${leadId}`, {
    method: "GET",
    headers: authenticatedHeaders(),
  });

  const result = (await response.json()) as
    | LeadResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(
      "message" in result ? result.message : "Unable to load lead"
    );
  }

  return (result as LeadResponse).data;
};

export const createLead = async (
  payload: CreateLeadPayload
): Promise<LeadCreateResponse> => {
  const response = await fetch(`${API_URL}/leads`, {
    method: "POST",
    headers: authenticatedHeaders(true),
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

export const updateLead = async (
  leadId: string,
  payload: UpdateLeadPayload
): Promise<Lead> => {
  const response = await fetch(`${API_URL}/leads/${leadId}`, {
    method: "PATCH",
    headers: authenticatedHeaders(true),
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as
    | LeadResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(
      "message" in result ? result.message : "Unable to update lead"
    );
  }

  return (result as LeadResponse).data;
};

export const deleteLead = async (leadId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/leads/${leadId}`, {
    method: "DELETE",
    headers: authenticatedHeaders(),
  });

  const result = (await response.json()) as
    | LeadDeleteResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(
      "message" in result ? result.message : "Unable to delete lead"
    );
  }
};