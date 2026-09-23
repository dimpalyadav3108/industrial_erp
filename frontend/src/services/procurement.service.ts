import type {
  CreateGoodsReceiptNotePayload,
  CreateProcurementRfqPayload,
  CreatePurchaseOrderPayload,
  CreatePurchaseRequisitionPayload,
  CreateVendorPayload,
  CreateVendorQuotationPayload,
  GoodsReceiptNote,
  ProcurementRfq,
  PurchaseOrder,
  PurchaseRequisition,
  UpdateGoodsReceiptNotePayload,
  UpdateProcurementRfqPayload,
  UpdatePurchaseOrderPayload,
  UpdatePurchaseRequisitionPayload,
  UpdateVendorPayload,
  UpdateVendorQuotationPayload,
  Vendor,
  VendorQuotation,
} from "../types/procurement";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

const headers = (json = false) => {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("Your session has expired. Please sign in again.");
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  };
};

async function readResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const result = (await response.json()) as T | ApiErrorResponse;
  if (!response.ok) throw new Error((result as ApiErrorResponse).message || fallbackMessage);
  return result as T;
}

type ListResponse<T> = { success: true; data: T[] };
type ItemResponse<T> = { success: true; message?: string; data: T };

async function list<T>(path: string, fallback: string): Promise<T[]> {
  const response = await fetch(`${API_URL}/procurement${path}`, { headers: headers() });
  return (await readResponse<ListResponse<T>>(response, fallback)).data;
}
async function create<T, P>(path: string, payload: P, fallback: string): Promise<T> {
  const response = await fetch(`${API_URL}/procurement${path}`, {
    method: "POST", headers: headers(true), body: JSON.stringify(payload),
  });
  return (await readResponse<ItemResponse<T>>(response, fallback)).data;
}
async function patch<T, P>(path: string, payload: P, fallback: string): Promise<T> {
  const response = await fetch(`${API_URL}/procurement${path}`, {
    method: "PATCH", headers: headers(true), body: JSON.stringify(payload),
  });
  return (await readResponse<ItemResponse<T>>(response, fallback)).data;
}

export const getVendors = () => list<Vendor>("/vendors", "Unable to load vendors");
export const createVendor = (payload: CreateVendorPayload) => create<Vendor, CreateVendorPayload>("/vendors", payload, "Unable to create vendor");
export const updateVendor = (id: string, payload: UpdateVendorPayload) => patch<Vendor, UpdateVendorPayload>(`/vendors/${encodeURIComponent(id)}`, payload, "Unable to update vendor");

export const getPurchaseRequisitions = () => list<PurchaseRequisition>("/requisitions", "Unable to load purchase requisitions");
export const createPurchaseRequisition = (payload: CreatePurchaseRequisitionPayload) => create<PurchaseRequisition, CreatePurchaseRequisitionPayload>("/requisitions", payload, "Unable to create purchase requisition");
export const updatePurchaseRequisition = (id: string, payload: UpdatePurchaseRequisitionPayload) => patch<PurchaseRequisition, UpdatePurchaseRequisitionPayload>(`/requisitions/${encodeURIComponent(id)}`, payload, "Unable to update purchase requisition");

export const getProcurementRfqs = () => list<ProcurementRfq>("/rfqs", "Unable to load RFQs");
export const createProcurementRfq = (payload: CreateProcurementRfqPayload) => create<ProcurementRfq, CreateProcurementRfqPayload>("/rfqs", payload, "Unable to create RFQ");
export const updateProcurementRfq = (id: string, payload: UpdateProcurementRfqPayload) => patch<ProcurementRfq, UpdateProcurementRfqPayload>(`/rfqs/${encodeURIComponent(id)}`, payload, "Unable to update RFQ");

export const getVendorQuotations = () => list<VendorQuotation>("/quotations", "Unable to load vendor quotations");
export const createVendorQuotation = (payload: CreateVendorQuotationPayload) => create<VendorQuotation, CreateVendorQuotationPayload>("/quotations", payload, "Unable to create vendor quotation");
export const updateVendorQuotation = (id: string, payload: UpdateVendorQuotationPayload) => patch<VendorQuotation, UpdateVendorQuotationPayload>(`/quotations/${encodeURIComponent(id)}`, payload, "Unable to update vendor quotation");

export const getPurchaseOrders = () => list<PurchaseOrder>("/purchase-orders", "Unable to load purchase orders");
export const createPurchaseOrder = (payload: CreatePurchaseOrderPayload) => create<PurchaseOrder, CreatePurchaseOrderPayload>("/purchase-orders", payload, "Unable to create purchase order");
export const updatePurchaseOrder = (id: string, payload: UpdatePurchaseOrderPayload) => patch<PurchaseOrder, UpdatePurchaseOrderPayload>(`/purchase-orders/${encodeURIComponent(id)}`, payload, "Unable to update purchase order");

export const getGoodsReceiptNotes = () => list<GoodsReceiptNote>("/grns", "Unable to load goods receipt notes");
export const createGoodsReceiptNote = (payload: CreateGoodsReceiptNotePayload) => create<GoodsReceiptNote, CreateGoodsReceiptNotePayload>("/grns", payload, "Unable to create goods receipt note");
export const updateGoodsReceiptNote = (id: string, payload: UpdateGoodsReceiptNotePayload) => patch<GoodsReceiptNote, UpdateGoodsReceiptNotePayload>(`/grns/${encodeURIComponent(id)}`, payload, "Unable to update goods receipt note");
export const postGoodsReceiptNote = (id: string) => create<GoodsReceiptNote, Record<string, never>>(`/grns/${encodeURIComponent(id)}/post`, {}, "Unable to post goods receipt note");
