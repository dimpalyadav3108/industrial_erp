import type {
  CompanySettings,
  CompanySettingsPayload,
  CompanySettingsResponse,
} from "../types/settings";

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

export const getCompanySettings = async (): Promise<CompanySettings> => {
  const response = await fetch(`${API_URL}/settings/company`, { headers: headers() });
  const result = (await response.json()) as CompanySettingsResponse | ApiErrorResponse;
  if (!response.ok) throw new Error(result.message || "Unable to load settings");
  return (result as CompanySettingsResponse).data;
};

export const saveCompanySettings = async (
  payload: CompanySettingsPayload
): Promise<CompanySettings> => {
  const response = await fetch(`${API_URL}/settings/company`, {
    method: "PUT",
    headers: headers(true),
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as CompanySettingsResponse | ApiErrorResponse;
  if (!response.ok) throw new Error(result.message || "Unable to save settings");
  return (result as CompanySettingsResponse).data;
};
    