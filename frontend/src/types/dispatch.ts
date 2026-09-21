export type DispatchStatus = "PLANNED" | "READY" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
export type TransportMode = "ROAD" | "AIR" | "RAIL" | "COURIER" | "CUSTOMER_PICKUP";

export interface Dispatch {
  id: string;
  dispatchNumber: string;
  productionOrderId: string;
  qualityInspectionId: string;
  status: DispatchStatus;
  transportMode: TransportMode;
  dispatchDate: string | null;
  expectedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  transporterName: string | null;
  vehicleNumber: string | null;
  trackingNumber: string | null;
  destination: string;
  contactPerson: string | null;
  contactPhone: string | null;
  packageCount: number;
  totalWeight: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  productionOrder: {
    id: string;
    productionNumber: string;
    title: string;
    quantity: string;
    unit: string;
    quotation: {
      quotationNumber: string;
      estimate: {
        estimateNumber: string;
        lead: {
          title: string;
          customer: { companyName: string } | null;
        };
      };
    };
  };
  qualityInspection: {
    id: string;
    inspectionNumber: string;
    inspectionType: string;
    status: string;
    inspectionDate: string | null;
  };
  createdBy: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface CreateDispatchPayload {
  qualityInspectionId: string;
  transportMode: TransportMode;
  expectedDeliveryDate?: string;
  transporterName?: string;
  vehicleNumber?: string;
  trackingNumber?: string;
  destination: string;
  contactPerson?: string;
  contactPhone?: string;
  packageCount: number;
  totalWeight?: number;
  notes?: string;
}

export interface DispatchListResponse {
  success: boolean;
  data: Dispatch[];
  message?: string;
}

export interface DispatchResponse {
  success: boolean;
  data: Dispatch;
  message?: string;
}
