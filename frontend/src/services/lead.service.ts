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
  const token = localStorage.getItem("accessToken");

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
export interface LeadCrmDetails {
  technical: Record<string, any> | null;
  activities: any[];
  competitors: any[];
  surveys: any[];
  tenders: any[];
  quotations: any[];
}

const crmRequest = async (leadId: string, path: string, method: string, body?: unknown) => {
  const response = await fetch(`${API_URL}/leads/${leadId}${path}`, {
    method,
    headers: authenticatedHeaders(Boolean(body)),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "CRM request failed");
  return result;
};

export const getLeadCrmDetails = async (leadId: string): Promise<LeadCrmDetails> =>
  (await crmRequest(leadId, "/crm", "GET")).data;
export const saveLeadTechnical = (leadId: string, data: Record<string, unknown>) => crmRequest(leadId, "/technical", "PUT", data);
export const addLeadActivity = (leadId: string, data: Record<string, unknown>) => crmRequest(leadId, "/activities", "POST", data);
export const addLeadCompetitor = (leadId: string, data: Record<string, unknown>) => crmRequest(leadId, "/competitors", "POST", data);
export const addLeadSurvey = (leadId: string, data: Record<string, unknown>) => crmRequest(leadId, "/surveys", "POST", data);
export const addLeadTender = (leadId: string, data: Record<string, unknown>) => crmRequest(leadId, "/tenders", "POST", data);
export const addLeadOutcome = (leadId: string, data: Record<string, unknown>) => crmRequest(leadId, "/outcomes", "POST", data);
