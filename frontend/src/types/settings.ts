export interface CompanySettings {
  id: string;
  companyName: string;
  legalName: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postalCode: string | null;
  currency: string;
  timezone: string;
  financialYearStart: number;
  defaultTaxPercent: string;
  estimatePrefix: string;
  quotationPrefix: string;
  productionPrefix: string;
  dispatchPrefix: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettingsPayload {
  companyName: string;
  legalName: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postalCode: string | null;
  currency: string;
  timezone: string;
  financialYearStart: number;
  defaultTaxPercent: number;
  estimatePrefix: string;
  quotationPrefix: string;
  productionPrefix: string;
  dispatchPrefix: string;
}

export interface CompanySettingsResponse {
  success: boolean;
  data: CompanySettings;
  message?: string;
}
