export type LeadPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type LeadStatus =
  | "NEW"
  | "QUALIFIED"
  | "TECHNICAL_REVIEW"
  | "ESTIMATION"
  | "QUOTATION_SENT"
  | "WON"
  | "LOST"
  | "ON_HOLD";

export interface LeadCustomer {
  id: string;
  customerCode: string;
  companyName: string;
}

export interface AssignedUser {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
}

export interface Lead {
  id: string;
  leadNumber: string;
  title: string;
  description: string | null;
  source: string | null;
  priority: LeadPriority;
  status: LeadStatus;
  estimatedValue: string | null;
  expectedCloseDate: string | null;
  customerId: string;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  customer: LeadCustomer;
  assignedTo: AssignedUser | null;
}

export interface CreateLeadPayload {
  title: string;
  description?: string;
  source?: string;
  priority: LeadPriority;
  status: LeadStatus;
  estimatedValue?: number;
  expectedCloseDate?: string;
  customerId: string;
  assignedToId?: string;
}

export interface LeadListResponse {
  success: boolean;
  data: Lead[];
  message?: string;
}

export interface LeadCreateResponse {
  success: boolean;
  message: string;
  data?: Lead;
  errors?: Record<string, string[]>;
}