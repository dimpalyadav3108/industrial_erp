export type EngineeringProjectStatus =
  | "DRAFT"
  | "DESIGN_IN_PROGRESS"
  | "CUSTOMER_REVIEW"
  | "APPROVED"
  | "RELEASED"
  | "ON_HOLD"
  | "CANCELLED";

export type DrawingCategory =
  | "GENERAL_ARRANGEMENT"
  | "PID"
  | "FABRICATION"
  | "TUBE_LAYOUT"
  | "ELECTRICAL"
  | "INSTRUMENTATION"
  | "FOUNDATION"
  | "OTHER";

export type EngineeringWorkflowStage =
  | "SALES_ORDER" | "ENGINEERING_RELEASE" | "DESIGN_CREATION" | "GA_DRAWING"
  | "CUSTOMER_APPROVAL" | "FABRICATION_DRAWING" | "BOM_RELEASE" | "PRODUCTION_RELEASE";

export type EngineeringDocumentStatus = "DRAFT" | "INTERNAL_REVIEW" | "CUSTOMER_REVIEW" | "APPROVED" | "REJECTED" | "SUPERSEDED";
export type EcrStatus = "DRAFT" | "IMPACT_ANALYSIS" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "IMPLEMENTED" | "CANCELLED";

export interface EngineeringDocument {
  id: string; projectId: string; drawingId: string | null; documentNumber: string; title: string; category: DrawingCategory;
  versionLabel: string; status: EngineeringDocumentStatus; fileName: string | null; fileUrl: string | null;
  modificationReason: string | null; modifiedAt: string; customerApproved: boolean; customerApprovedAt: string | null; customerApprovedVersion: string | null;
  modifiedBy: EngineeringUserSummary | null; approvedBy: EngineeringUserSummary | null;
}

export interface EngineeringChangeRequest {
  id: string; ecrNumber: string; projectId: string; title: string; description: string; reason: string; impactAnalysis: string | null;
  impactedDocuments: string | null; impactedBomItems: string | null; productionImpact: string | null; status: EcrStatus;
  bomUpdateRequired: boolean; productionUpdateRequired: boolean; bomUpdatedAt: string | null; productionUpdatedAt: string | null;
  createdAt: string; approvedAt: string | null; implementedAt: string | null;
  createdBy: EngineeringUserSummary | null; approvedBy: EngineeringUserSummary | null;
}

export type DrawingRevisionStatus =
  | "DRAFT"
  | "INTERNAL_REVIEW"
  | "CUSTOMER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUPERSEDED";

// ============================================================
// BOM TYPES
// ============================================================

export type BomStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "RELEASED"
  | "SUPERSEDED"
  | "CANCELLED";

export type BomItemSource = "MAKE" | "BUY";

// ============================================================
// USER
// ============================================================

export interface EngineeringUserSummary {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
}

// ============================================================
// DRAWING REVISION
// ============================================================

export interface EngineeringDrawingRevision {
  id: string;
  drawingId: string;
  revisionNumber: number;
  versionLabel: string;
  status: DrawingRevisionStatus;

  documentName: string | null;
  documentUrl: string | null;
  changeReason: string;

  submittedAt: string | null;
  approvedAt: string | null;

  customerApproved: boolean;
  customerApprovedAt: string | null;
  modifiedById: string | null;
  modifiedAt: string | null;

  createdById: string | null;
  approvedById: string | null;

  createdAt: string;
  updatedAt: string;

  createdBy: EngineeringUserSummary | null;
  approvedBy: EngineeringUserSummary | null;
}

// ============================================================
// DRAWING
// ============================================================

export interface EngineeringDrawing {
  id: string;
  projectId: string;

  drawingNumber: string;
  title: string;

  category: DrawingCategory;

  description: string | null;

  currentRevision: number;

  status: DrawingRevisionStatus;

  createdById: string | null;

  createdAt: string;
  updatedAt: string;

  createdBy: EngineeringUserSummary | null;

  revisions: EngineeringDrawingRevision[];
  documents?: EngineeringDocument[];
}

// ============================================================
// BOM INVENTORY ITEM
// ============================================================

export interface EngineeringBomInventoryItem {
  id: string;
  itemCode: string;
  name: string;
  itemType: string;
  unit: string;
}

// ============================================================
// BOM ITEM
// ============================================================

export interface EngineeringBomItem {
  id: string;

  bomId: string;

  parentItemId: string | null;

  inventoryItemId: string | null;

  itemNumber: number;

  name: string;

  description: string | null;

  /**
   * Prisma Decimal values are normally serialized by the API
   * as strings. Number is included to keep the frontend tolerant
   * if the API serialization changes.
   */
  quantity: string | number;

  unit: string;

  source: BomItemSource;

  materialSpec: string | null;
  alternateMaterial: string | null;
  unitCost: string | number | null;

  drawingNumber: string | null;

  remarks: string | null;

  sortOrder: number;

  createdAt: string;
  updatedAt: string;

  inventoryItem: EngineeringBomInventoryItem | null;
}

// ============================================================
// ENGINEERING BOM
// ============================================================

export interface EngineeringBom {
  id: string;

  projectId: string;

  bomNumber: string;

  name: string;

  revision: number;

  status: BomStatus;

  description: string | null;

  createdById: string | null;
  approvedById: string | null;

  approvedAt: string | null;
  releasedAt: string | null;

  createdAt: string;
  updatedAt: string;

  createdBy: EngineeringUserSummary | null;
  approvedBy: EngineeringUserSummary | null;

  items: EngineeringBomItem[];
}

// ============================================================
// QUOTATION
// ============================================================

export interface EngineeringProjectQuotation {
  id: string;

  quotationNumber: string;

  status: string;

  estimate?: {
    id: string;

    estimateNumber?: string;

    lead?: {
      id: string;

      leadNumber?: string;

      title?: string;

      customer?: {
        id: string;
        companyName: string;
      };
    };
  };
}

// ============================================================
// ENGINEERING PROJECT
// ============================================================

export interface EngineeringProject {
  id: string;

  engineeringNumber: string;

  quotationId: string;

  title: string;

  productFamily: string | null;

  productModel: string | null;

  status: EngineeringProjectStatus;
  workflowStage: EngineeringWorkflowStage;
  salesOrderId: string | null;
  engineeringReleasedAt: string | null;
  designCreatedAt: string | null;
  customerApprovalAt: string | null;
  fabricationReleasedAt: string | null;
  bomReleasedAt: string | null;
  productionReleasedAt: string | null;
  customerApprovedVersion: string | null;

  plannedStartDate: string | null;

  plannedReleaseDate: string | null;

  actualReleaseDate: string | null;

  notes: string | null;

  createdById: string | null;

  createdAt: string;
  updatedAt: string;

  quotation: EngineeringProjectQuotation;

  createdBy: EngineeringUserSummary | null;

  drawings: EngineeringDrawing[];

  // BOMs belonging to this engineering project
  boms: EngineeringBom[];
  documents?: EngineeringDocument[];
  ecrs?: EngineeringChangeRequest[];
}

// ============================================================
// PROJECT PAYLOADS
// ============================================================

export interface CreateEngineeringProjectPayload {
  quotationId: string;

  title: string;

  productFamily?: string;

  productModel?: string;

  plannedStartDate?: string;

  plannedReleaseDate?: string;

  notes?: string;
}

export interface UpdateEngineeringProjectPayload {
  title?: string;

  productFamily?: string | null;

  productModel?: string | null;

  status?: EngineeringProjectStatus;

  plannedStartDate?: string | null;

  plannedReleaseDate?: string | null;

  notes?: string | null;
}

// ============================================================
// DRAWING PAYLOADS
// ============================================================

export interface CreateEngineeringDrawingPayload {
  projectId: string;

  drawingNumber: string;

  title: string;

  category: DrawingCategory;

  description?: string;

  documentName?: string;

  documentUrl?: string;

  changeReason: string;
}

export interface CreateDrawingRevisionPayload {
  documentName?: string;

  documentUrl?: string;

  changeReason: string;
}

export interface UpdateDrawingRevisionPayload {
  status?: DrawingRevisionStatus;

  customerApproved?: boolean;
}

// ============================================================
// BOM PAYLOADS
// ============================================================

export interface CreateEngineeringBomPayload {
  projectId: string;

  bomNumber: string;

  name: string;

  revision?: number;

  description?: string;
}

export interface UpdateEngineeringBomPayload {
  name?: string;

  revision?: number;

  status?: BomStatus;

  description?: string | null;
}

// ============================================================
// BOM ITEM PAYLOADS
// ============================================================

export interface CreateEngineeringBomItemPayload {
  parentItemId?: string | null;

  inventoryItemId?: string | null;

  itemNumber: number;

  name: string;

  description?: string;

  quantity: number;

  unit: string;

  source?: BomItemSource;

  materialSpec?: string;

  alternateMaterial?: string;

  unitCost?: number;

  drawingNumber?: string;

  remarks?: string;

  sortOrder?: number;
}

export interface UpdateEngineeringBomItemPayload {
  parentItemId?: string | null;

  inventoryItemId?: string | null;

  itemNumber?: number;

  name?: string;

  description?: string | null;

  quantity?: number;

  unit?: string;

  source?: BomItemSource;

  materialSpec?: string | null;

  alternateMaterial?: string | null;

  unitCost?: number;

  drawingNumber?: string | null;

  remarks?: string | null;

  sortOrder?: number;
}

// ============================================================
// PROJECT RESPONSES
// ============================================================

export interface EngineeringProjectListResponse {
  success: true;

  data: EngineeringProject[];
}

export interface EngineeringProjectResponse {
  success: true;

  message?: string;

  data: EngineeringProject;
}

// ============================================================
// DRAWING RESPONSES
// ============================================================

export interface EngineeringDrawingResponse {
  success: true;

  message?: string;

  data: EngineeringDrawing;
}

export interface EngineeringRevisionResponse {
  success: true;

  message?: string;

  data: EngineeringDrawingRevision;
}

// ============================================================
// BOM RESPONSES
// ============================================================

export interface EngineeringBomListResponse {
  success: true;

  data: EngineeringBom[];
}

export interface EngineeringBomResponse {
  success: true;

  message?: string;

  data: EngineeringBom;
}

export interface EngineeringBomItemResponse {
  success: true;

  message?: string;

  data: EngineeringBomItem;
}

export interface EngineeringBomItemDeleteResponse {
  success: true;

  message: string;
}