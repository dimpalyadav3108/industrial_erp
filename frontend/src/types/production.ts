export type ProductionOrderStatus =
  | "PLANNED"
  | "RELEASED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export type ProductionOperationStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SKIPPED";

export type ProductionPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface ProductionOperation {
  id: string;
  productionOrderId: string;
  sequence: number;
  name: string;
  workCenter: string | null;
  status: ProductionOperationStatus;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  notes: string | null;
}

export interface ProductionOrder {
  id: string;
  productionNumber: string;
  quotationId: string;
  title: string;
  status: ProductionOrderStatus;
  priority: ProductionPriority;
  quantity: string;
  unit: string;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  progressPercent: string;
  assignedToId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  quotation: {
    id: string;
    quotationNumber: string;
    totalAmount: string;
    status: string;
    estimate: {
      id: string;
      estimateNumber: string;
      lead: {
        id: string;
        leadNumber: string;
        title: string;
        customer: {
          id: string;
          customerCode: string;
          companyName: string;
        } | null;
      };
    };
  };
  assignedTo: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  } | null;
  operations: ProductionOperation[];
}

export interface CreateProductionOperationPayload {
  name: string;
  workCenter?: string;
  notes?: string;
}

export interface CreateProductionOrderPayload {
  quotationId: string;
  title: string;
  priority: ProductionPriority;
  quantity: number;
  unit: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  notes?: string;
  operations: CreateProductionOperationPayload[];
}

export interface ProductionListResponse {
  success: boolean;
  data: ProductionOrder[];
  message?: string;
}

export interface ProductionResponse {
  success: boolean;
  data: ProductionOrder;
  message?: string;
}

