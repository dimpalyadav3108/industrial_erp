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

export const getServiceEngineers = async (): Promise<import("../types/service").ServiceEngineer[]> => { const r=await fetch(`${API_URL}/service/engineers`,{headers:headers()}); const x=await r.json(); if(!r.ok) throw new Error(x.message||"Unable to load engineers"); return x.data; };
export const getService360 = async (id:string): Promise<import("../types/service").Service360> => { const r=await fetch(`${API_URL}/service/requests/${id}/360`,{headers:headers()}); const x=await r.json(); if(!r.ok) throw new Error(x.message||"Unable to load service 360"); return x.data; };
export const assignServiceEngineer = async (id:string, engineerId:string, notes?:string) => { const r=await fetch(`${API_URL}/service/requests/${id}/assign`,{method:"POST",headers:headers(true),body:JSON.stringify({engineerId,notes})}); const x=await r.json(); if(!r.ok) throw new Error(x.message||"Unable to assign engineer"); return x.data as ServiceRequest; };
export const createServiceVisit = async (id:string,payload:any) => { const r=await fetch(`${API_URL}/service/requests/${id}/visits`,{method:"POST",headers:headers(true),body:JSON.stringify(payload)}); const x=await r.json(); if(!r.ok) throw new Error(x.message||"Unable to create visit"); return x.data; };
export const updateServiceVisit = async (id:string,payload:any) => { const r=await fetch(`${API_URL}/service/visits/${id}`,{method:"PATCH",headers:headers(true),body:JSON.stringify(payload)}); const x=await r.json(); if(!r.ok) throw new Error(x.message||"Unable to update visit"); return x.data; };
export const addServiceFeedback = async (id:string,payload:any) => { const r=await fetch(`${API_URL}/service/requests/${id}/feedback`,{method:"POST",headers:headers(true),body:JSON.stringify(payload)}); const x=await r.json(); if(!r.ok) throw new Error(x.message||"Unable to save feedback"); return x.data; };
export const addServiceSpareMovement = async (id:string,payload:any) => { const r=await fetch(`${API_URL}/service/requests/${id}/spares`,{method:"POST",headers:headers(true),body:JSON.stringify(payload)}); const x=await r.json(); if(!r.ok) throw new Error(x.message||"Unable to save spare movement"); return x.data; };
export const createPmPlan = async (payload:any) => { const r=await fetch(`${API_URL}/service/pm-plans`,{method:"POST",headers:headers(true),body:JSON.stringify(payload)}); const x=await r.json(); if(!r.ok) throw new Error(x.message||"Unable to create PM plan"); return x.data; };
export const addWarrantyCoverage = async (payload:any) => { const r=await fetch(`${API_URL}/service/warranty-coverage`,{method:"POST",headers:headers(true),body:JSON.stringify(payload)}); const x=await r.json(); if(!r.ok) throw new Error(x.message||"Unable to add warranty coverage"); return x.data; };
