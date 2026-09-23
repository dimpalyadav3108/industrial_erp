import type { ManagementDashboard } from "../types/managementDashboard";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const headers = (): Record<string, string> => {
  const token = localStorage.getItem("accessToken");
  const result: Record<string, string> = {};
  if (token) result.Authorization = `Bearer ${token}`;
  return result;
};
export async function getManagementDashboard(): Promise<ManagementDashboard> {
  const response = await fetch(`${API_URL}/management-dashboard`, { headers: headers() });
  const payload = await response.json();
  if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to load management dashboard");
  return payload.data;
}
