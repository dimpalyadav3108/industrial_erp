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


export type LogisticsStage = "FG_READY" | "PACKING" | "LOADING" | "DISPATCHED" | "DELIVERED";
export interface DispatchTrackingEvent {
  id: string;
  status: string;
  location: string | null;
  remarks: string | null;
  eventAt: string;
  createdById: string | null;
  createdAt: string;
}
export interface DispatchLogistics {
  id: string;
  dispatchId: string;
  stage: LogisticsStage;
  fgReadyAt: string | null;
  packedAt: string | null;
  loadedAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  deliveryStatus: string;
  ewayBillNumber: string | null;
  ewayBillDate: string | null;
  eInvoiceNumber: string | null;
  eInvoiceDate: string | null;
  lrNumber: string | null;
  lrDate: string | null;
  vehicleTrackingUrl: string | null;
  vehicleTrackingNote: string | null;
  packingListUrl: string | null;
  lrCopyUrl: string | null;
  podUrl: string | null;
  podReceivedAt: string | null;
  notes: string | null;
}
export interface DispatchWithLogistics extends Dispatch {
  logistics: DispatchLogistics | null;
  trackingEvents: DispatchTrackingEvent[];
}
