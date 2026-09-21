import type {
  CreateServiceContractPayload, CreateServiceRequestPayload, ServiceContract,
  ServiceContractListResponse, ServiceContractResponse, ServiceContractStatus,
  ServiceRequest, ServiceRequestListResponse, ServiceRequestResponse, ServiceRequestStatus,
} from "../types/service";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
interface ApiErrorResponse { success: false; message: string; errors?: Record<string, string[]> }
const headers = (json = false) => {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Your session has expired. Please sign in again.");
  return { ...(json ? { "Content-Type": "application/json" } : {}), Authorization: `Bearer ${token}` };
};
const query = (search: string) => search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";

export const getServiceContracts = async (search = ""): Promise<ServiceContract[]> => {
  const response = await fetch(`${API_URL}/service/contracts${query(search)}`, { headers: headers() });
  const result = await response.json() as ServiceContractListResponse | ApiErrorResponse;
  if (!response.ok) throw new Error(result.message || "Unable to load service contracts");
  return (result as ServiceContractListResponse).data;
};
export const createServiceContract = async (payload: CreateServiceContractPayload): Promise<ServiceContract> => {
  const response = await fetch(`${API_URL}/service/contracts`, { method: "POST", headers: headers(true), body: JSON.stringify(payload) });
  const result = await response.json() as ServiceContractResponse | ApiErrorResponse;
  if (!response.ok) throw new Error(result.message || "Unable to create service contract");
  return (result as ServiceContractResponse).data;
};
export const updateServiceContractStatus = async (id: string, status: ServiceContractStatus): Promise<ServiceContract> => {
  const response = await fetch(`${API_URL}/service/contracts/${id}/status`, { method: "PATCH", headers: headers(true), body: JSON.stringify({ status }) });
  const result = await response.json() as ServiceContractResponse | ApiErrorResponse;
  if (!response.ok) throw new Error(result.message || "Unable to update service contract");
  return (result as ServiceContractResponse).data;
};
export const getServiceRequests = async (search = ""): Promise<ServiceRequest[]> => {
  const response = await fetch(`${API_URL}/service/requests${query(search)}`, { headers: headers() });
  const result = await response.json() as ServiceRequestListResponse | ApiErrorResponse;
  if (!response.ok) throw new Error(result.message || "Unable to load service requests");
  return (result as ServiceRequestListResponse).data;
};
export const createServiceRequest = async (payload: CreateServiceRequestPayload): Promise<ServiceRequest> => {
  const response = await fetch(`${API_URL}/service/requests`, { method: "POST", headers: headers(true), body: JSON.stringify(payload) });
  const result = await response.json() as ServiceRequestResponse | ApiErrorResponse;
  if (!response.ok) throw new Error(result.message || "Unable to create service request");
  return (result as ServiceRequestResponse).data;
};
export const updateServiceRequestStatus = async (id: string, status: ServiceRequestStatus): Promise<ServiceRequest> => {
  const response = await fetch(`${API_URL}/service/requests/${id}`, { method: "PATCH", headers: headers(true), body: JSON.stringify({ status }) });
  const result = await response.json() as ServiceRequestResponse | ApiErrorResponse;
  if (!response.ok) throw new Error(result.message || "Unable to update service request");
  return (result as ServiceRequestResponse).data;
};
