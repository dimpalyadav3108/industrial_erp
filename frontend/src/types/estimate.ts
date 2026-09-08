export type EstimateStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CONVERTED";

export type EstimateItemType =
  | "MATERIAL"
  | "LABOUR"
  | "OVERHEAD"
  | "SERVICE";

export interface EstimateItem {
  id: string;
  estimateId: string;
  itemType: EstimateItemType;
  description: string;
  quantity: string;
  unit: string;
  unitRate: string;
  amount: string;
  sortOrder: number;
}

export interface EstimateLead {
  id: string;
  leadNumber: string;
  title: string;
  status: string;
  customer: {
    id: string;
    customerCode: string;
    companyName: string;
  } | null;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  leadId: string;
  version: number;
  status: EstimateStatus;
  materialCost: string;
  labourCost: string;
  overheadCost: string;
  marginPercent: string;
  subtotal: string;
  taxPercent: string;
  taxAmount: string;
  totalAmount: string;
  notes: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
  lead: EstimateLead;
  items: EstimateItem[];
}

export interface CreateEstimateItemPayload {
  itemType: EstimateItemType;
  description: string;
  quantity: number;
  unit: string;
  unitRate: number;
}

export interface CreateEstimatePayload {
  leadId: string;
  status: EstimateStatus;
  marginPercent: number;
  taxPercent: number;
  validUntil?: string;
  notes?: string;
  items: CreateEstimateItemPayload[];
}

export interface EstimateListResponse {
  success: boolean;
  data: Estimate[];
  message?: string;
}

export interface EstimateResponse {
  success: boolean;
  data: Estimate;
  message?: string;
}
