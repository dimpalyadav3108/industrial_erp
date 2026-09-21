export type ServiceContractType = "WARRANTY" | "AMC" | "CMC" | "ON_CALL";
export type ServiceContractStatus = "DRAFT" | "ACTIVE" | "EXPIRED" | "SUSPENDED" | "CANCELLED";
export type ServiceRequestType = "BREAKDOWN" | "PREVENTIVE_MAINTENANCE" | "INSTALLATION" | "COMMISSIONING" | "INSPECTION" | "OTHER";
export type ServiceRequestStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "CANCELLED";
export type ServicePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface ServiceContract {
  id: string;
  contractNumber: string;
  customerId: string;
  dispatchId: string | null;
  title: string;
  contractType: ServiceContractType;
  status: ServiceContractStatus;
  startDate: string;
  endDate: string;
  contractValue: string | null;
  visitsIncluded: number;
  visitsUsed: number;
  responseTimeHours: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; customerCode: string; companyName: string; contactPerson: string | null; phone: string | null };
  dispatch: { id: string; dispatchNumber: string; productionOrder: { id: string; productionNumber: string; title: string } } | null;
  createdBy: { id: string; employeeCode: string; firstName: string; lastName: string } | null;
  _count: { requests: number };
}

export interface ServiceRequest {
  id: string;
  ticketNumber: string;
  customerId: string;
  serviceContractId: string | null;
  requestType: ServiceRequestType;
  priority: ServicePriority;
  status: ServiceRequestStatus;
  subject: string;
  description: string;
  location: string | null;
  reportedAt: string;
  scheduledDate: string | null;
  startedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; customerCode: string; companyName: string; contactPerson: string | null; phone: string | null };
  serviceContract: { id: string; contractNumber: string; title: string; contractType: ServiceContractType; status: ServiceContractStatus } | null;
  assignedTo: { id: string; employeeCode: string; firstName: string; lastName: string } | null;
  createdBy: { id: string; employeeCode: string; firstName: string; lastName: string } | null;
}

export interface CreateServiceContractPayload {
  customerId: string;
  dispatchId?: string;
  title: string;
  contractType: ServiceContractType;
  status: ServiceContractStatus;
  startDate: string;
  endDate: string;
  contractValue?: number;
  visitsIncluded: number;
  responseTimeHours?: number;
  notes?: string;
}

export interface CreateServiceRequestPayload {
  customerId: string;
  serviceContractId?: string;
  requestType: ServiceRequestType;
  priority: ServicePriority;
  subject: string;
  description: string;
  location?: string;
  scheduledDate?: string;
}

export interface ServiceContractListResponse { success: boolean; data: ServiceContract[]; message?: string }
export interface ServiceContractResponse { success: boolean; data: ServiceContract; message?: string }
export interface ServiceRequestListResponse { success: boolean; data: ServiceRequest[]; message?: string }
export interface ServiceRequestResponse { success: boolean; data: ServiceRequest; message?: string }
