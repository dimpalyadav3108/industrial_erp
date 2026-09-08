import type {
  CreateQuotationPayload,
  Quotation,
  QuotationListResponse,
  QuotationResponse,
  QuotationStatus,
} from "../types/quotation";

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

export const getQuotations = async (search = ""): Promise<Quotation[]> => {
  const query = search.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";
  const response = await fetch(`${API_URL}/quotations${query}`, {
    headers: headers(),
  });
  const result = (await response.json()) as
    | QuotationListResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Unable to load quotations");
  }

  return (result as QuotationListResponse).data;
};

export const createQuotation = async (
  payload: CreateQuotationPayload
): Promise<Quotation> => {
  const response = await fetch(`${API_URL}/quotations`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as
    | QuotationResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Unable to create quotation");
  }

  return (result as QuotationResponse).data;
};

export const updateQuotationStatus = async (
  quotationId: string,
  status: QuotationStatus
): Promise<Quotation> => {
  const response = await fetch(`${API_URL}/quotations/${quotationId}/status`, {
    method: "PATCH",
    headers: headers(true),
    body: JSON.stringify({ status }),
  });
  const result = (await response.json()) as
    | QuotationResponse
    | ApiErrorResponse;

  if (!response.ok) {
    throw new Error(result.message || "Unable to update quotation status");
  }

  return (result as QuotationResponse).data;
};

