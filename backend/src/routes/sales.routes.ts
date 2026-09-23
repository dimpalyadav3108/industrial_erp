import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createDispatchNoteController, createEWayBillController, createInvoiceController, createPaymentController,
  createSalesOrderController, getSalesOrderController, listDispatchNotesController, listEWayBillsController,
  listEligibleQuotationsController, listInvoicesController, listSalesOrdersController, linkSalesOrderController,
  updateInvoiceController, updateQuotationCustomerApprovalController, updateSalesOrderController,
} from "../controllers/sales.controller.js";
export const salesRouter = Router();
salesRouter.use(authenticate);
salesRouter.get("/eligible-quotations", listEligibleQuotationsController);
salesRouter.get("/orders", listSalesOrdersController);
salesRouter.get("/orders/:id", getSalesOrderController);
salesRouter.post("/orders", createSalesOrderController);
salesRouter.patch("/orders/:id", updateSalesOrderController);
salesRouter.post("/orders/:id/links", linkSalesOrderController);
salesRouter.get("/invoices", listInvoicesController);
salesRouter.post("/invoices", createInvoiceController);
salesRouter.patch("/invoices/:id", updateInvoiceController);
salesRouter.post("/payments", createPaymentController);
salesRouter.get("/dispatch-notes", listDispatchNotesController);
salesRouter.post("/dispatch-notes", createDispatchNoteController);
salesRouter.get("/e-way-bills", listEWayBillsController);
salesRouter.post("/e-way-bills", createEWayBillController);
