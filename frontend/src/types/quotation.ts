export type QuotationStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CONVERTED";

export interface QuotationItem {
  id: string;
  itemType: string;
  description: string;
  quantity: string;
  unit: string;
  unitRate: string;
  amount: string;
  sortOrder: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  estimateId: string;
  version: number;
  status: QuotationStatus;
  issueDate: string;
  validUntil: string | null;
  subtotal: string;
  taxPercent: string;
  taxAmount: string;
  totalAmount: string;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  termsAndConditions: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  estimate: {
    id: string;
    estimateNumber: string;
    version: number;
    status: string;
    items: QuotationItem[];
    lead: {
      id: string;
      leadNumber: string;
      title: string;
      status: string;
      customer: {
        id: string;
        customerCode: string;
        companyName: string;
        contactPerson: string | null;
        email: string | null;
        phone: string | null;
        billingAddress: string | null;
        city: string | null;
        state: string | null;
        country: string;
        gstNumber: string | null;
      } | null;
    };
  };
}

export interface CreateQuotationPayload {
  estimateId: string;
  status: QuotationStatus;
  validUntil?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  termsAndConditions?: string;
  notes?: string;
}

export interface QuotationListResponse {
  success: boolean;
  data: Quotation[];
  message?: string;
}

export interface QuotationResponse {
  success: boolean;
  data: Quotation;
  message?: string;
}

