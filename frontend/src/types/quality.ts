export type QualityInspectionType = "IN_PROCESS" | "FINAL";

export type QualityInspectionStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "PASSED"
  | "FAILED"
  | "ON_HOLD";

export type QualityCheckResult =
  | "PENDING"
  | "PASS"
  | "FAIL"
  | "NOT_APPLICABLE";

export interface QualityCheckItem {
  id: string;
  qualityInspectionId: string;
  sequence: number;
  parameter: string;
  specification: string | null;
  observedValue: string | null;
  result: QualityCheckResult;
  remarks: string | null;
}

export interface QualityInspection {
  id: string;
  inspectionNumber: string;
  productionOrderId: string;
  inspectionType: QualityInspectionType;
  status: QualityInspectionStatus;
  scheduledDate: string | null;
  inspectionDate: string | null;
  remarks: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  productionOrder: {
    id: string;
    productionNumber: string;
    title: string;
    status: string;
    quantity: string;
    unit: string;
    quotation: {
      id: string;
      quotationNumber: string;
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
  };
  inspector: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  } | null;
  checks: QualityCheckItem[];
}

export interface CreateQualityCheckPayload {
  parameter: string;
  specification?: string;
}

export interface CreateQualityInspectionPayload {
  productionOrderId: string;
  inspectionType: QualityInspectionType;
  scheduledDate?: string;
  remarks?: string;
  checks: CreateQualityCheckPayload[];
}

export interface QualityListResponse {
  success: boolean;
  data: QualityInspection[];
  message?: string;
}

export interface QualityResponse {
  success: boolean;
  data: QualityInspection;
  message?: string;
}

