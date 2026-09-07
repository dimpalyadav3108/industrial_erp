export type CustomerStatus =
  | "PROSPECT"
  | "ACTIVE"
  | "INACTIVE"
  | "BLACKLISTED";

export interface Customer {
  id: string;
  customerCode: string;
  companyName: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  gstNumber: string | null;
  billingAddress: string | null;
  shippingAddress: string | null;
  city: string | null;
  state: string | null;
  country: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
  _count?: {
    leads: number;
  };
}

export interface CreateCustomerInput {
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  billingAddress?: string;
  shippingAddress?: string;
  city?: string;
  state?: string;
  country: string;
  status: CustomerStatus;
}

export interface CustomerListResponse {
  success: true;
  data: Customer[];
  count: number;
}

export interface CustomerResponse {
  success: true;
  message: string;
  data: Customer;
}