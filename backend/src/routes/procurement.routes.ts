import { Router } from "express";

import {
  // Vendors
  listVendorsController,
  getVendorController,
  createVendorController,
  updateVendorController,

  // Purchase Requisitions
  listPurchaseRequisitionsController,
  getPurchaseRequisitionController,
  createPurchaseRequisitionController,
  updatePurchaseRequisitionController,

  // RFQs
  listProcurementRfqsController,
  getProcurementRfqController,
  createProcurementRfqController,
  updateProcurementRfqController,

  // Vendor Quotations
  listVendorQuotationsController,
  createVendorQuotationController,
  updateVendorQuotationController,

  // Purchase Orders
  listPurchaseOrdersController,
  getPurchaseOrderController,
  createPurchaseOrderController,
  updatePurchaseOrderController,

  // Goods Receipt Notes
  listGoodsReceiptNotesController,
  getGoodsReceiptNoteController,
  createGoodsReceiptNoteController,
  updateGoodsReceiptNoteController,
  postGoodsReceiptNoteController,
} from "../controllers/procurement.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

export const procurementRouter = Router();

procurementRouter.use(authenticate);

// ============================================================
// VENDORS
// ============================================================

procurementRouter.get("/vendors", listVendorsController);
procurementRouter.get("/vendors/:id", getVendorController);
procurementRouter.post("/vendors", createVendorController);
procurementRouter.patch("/vendors/:id", updateVendorController);

// ============================================================
// PURCHASE REQUISITIONS
// ============================================================

procurementRouter.get(
  "/requisitions",
  listPurchaseRequisitionsController
);

procurementRouter.get(
  "/requisitions/:id",
  getPurchaseRequisitionController
);

procurementRouter.post(
  "/requisitions",
  createPurchaseRequisitionController
);

procurementRouter.patch(
  "/requisitions/:id",
  updatePurchaseRequisitionController
);

// ============================================================
// RFQs
// ============================================================

procurementRouter.get(
  "/rfqs",
  listProcurementRfqsController
);

procurementRouter.get(
  "/rfqs/:id",
  getProcurementRfqController
);

procurementRouter.post(
  "/rfqs",
  createProcurementRfqController
);

procurementRouter.patch(
  "/rfqs/:id",
  updateProcurementRfqController
);

// ============================================================
// VENDOR QUOTATIONS
// ============================================================

procurementRouter.get(
  "/quotations",
  listVendorQuotationsController
);

procurementRouter.post(
  "/quotations",
  createVendorQuotationController
);

procurementRouter.patch(
  "/quotations/:id",
  updateVendorQuotationController
);

// ============================================================
// PURCHASE ORDERS
// ============================================================

procurementRouter.get(
  "/purchase-orders",
  listPurchaseOrdersController
);

procurementRouter.get(
  "/purchase-orders/:id",
  getPurchaseOrderController
);

procurementRouter.post(
  "/purchase-orders",
  createPurchaseOrderController
);

procurementRouter.patch(
  "/purchase-orders/:id",
  updatePurchaseOrderController
);

// ============================================================
// GOODS RECEIPT NOTES
// ============================================================

procurementRouter.get(
  "/grns",
  listGoodsReceiptNotesController
);

procurementRouter.get(
  "/grns/:id",
  getGoodsReceiptNoteController
);

procurementRouter.post(
  "/grns",
  createGoodsReceiptNoteController
);

procurementRouter.patch(
  "/grns/:id",
  updateGoodsReceiptNoteController
);

// Posts accepted quantities into Inventory.
// This endpoint should only be called once for each GRN.
procurementRouter.post(
  "/grns/:id/post",
  postGoodsReceiptNoteController
);