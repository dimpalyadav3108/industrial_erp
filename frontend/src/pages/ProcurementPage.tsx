import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  X,
  Check,
  Ban,
} from "lucide-react";

import {
  createGoodsReceiptNote,
  createProcurementRfq,
  createPurchaseOrder,
  createPurchaseRequisition,
  createVendor,
  createVendorQuotation,
  getGoodsReceiptNotes,
  getProcurementRfqs,
  getPurchaseOrders,
  getPurchaseRequisitions,
  getVendorQuotations,
  getVendors,
  postGoodsReceiptNote,
  updateGoodsReceiptNote,
  updateProcurementRfq,
  updatePurchaseOrder,
  updatePurchaseRequisition,
  updateVendorQuotation,
} from "../services/procurement.service";

import type {
  GoodsReceiptNote,
  ProcurementRfq,
  PurchaseOrder,
  PurchaseRequisition,
  PurchaseRequisitionStatus,
  RfqStatus,
  VendorQuotationStatus,
  PurchaseOrderStatus,
  GrnStatus,
  Vendor,
  VendorQuotation,
} from "../types/procurement";

import ProcurementIntelligencePanel from "./ProcurementIntelligencePanel";
import ProcurementModule6Panel from "./ProcurementModule6Panel";

type Tab =
  | "vendors"
  | "requisitions"
  | "rfqs"
  | "quotations"
  | "orders"
  | "grns";

type RequisitionItemForm = {
  description: string;
  quantity: string;
  unit: string;
  estimatedUnitPrice: string;
  remarks: string;
};

const emptyRequisitionItem = (): RequisitionItemForm => ({
  description: "",
  quantity: "1",
  unit: "Nos",
  estimatedUnitPrice: "",
  remarks: "",
});

function formatStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function money(value: string | number | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function date(value: string | null | undefined) {
  if (!value) return "—";

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-IN");
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function ProcurementPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [requisitions, setRequisitions] = useState<
    PurchaseRequisition[]
  >([]);
  const [rfqs, setRfqs] = useState<ProcurementRfq[]>([]);
  const [quotations, setQuotations] = useState<VendorQuotation[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [grns, setGrns] = useState<GoodsReceiptNote[]>([]);

  const [tab, setTab] = useState<Tab>("vendors");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ============================================================
     VENDOR FORM
  ============================================================ */

  const [showVendor, setShowVendor] = useState(false);
  const [savingVendor, setSavingVendor] = useState(false);

  const [vendorForm, setVendorForm] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    gstNumber: "",
    city: "",
    state: "",
    country: "India",
    paymentTerms: "",
    notes: "",
  });

  /* ============================================================
     PURCHASE REQUISITION FORM
  ============================================================ */

  const [showRequisition, setShowRequisition] =
    useState(false);

  const [savingRequisition, setSavingRequisition] =
    useState(false);

  const [requisitionForm, setRequisitionForm] = useState({
    title: "",
    priority: "MEDIUM" as
      | "LOW"
      | "MEDIUM"
      | "HIGH"
      | "URGENT",
    requiredDate: "",
    notes: "",
  });

  const [requisitionItems, setRequisitionItems] = useState<
    RequisitionItemForm[]
  >([emptyRequisitionItem()]);

  /* ============================================================
     REQUISITION ACTION
  ============================================================ */

  const [updatingRequisitionId, setUpdatingRequisitionId] =
    useState<string | null>(null);

  const [showWorkflow, setShowWorkflow] = useState<"rfqs" | "quotations" | "orders" | "grns" | null>(null);
  const [updatingWorkflowId, setUpdatingWorkflowId] = useState<string | null>(null);

  /* ============================================================
     LOAD DATA
  ============================================================ */

  const loadData = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [v, pr, r, q, po, g] = await Promise.all([
        getVendors(),
        getPurchaseRequisitions(),
        getProcurementRfqs(),
        getVendorQuotations(),
        getPurchaseOrders(),
        getGoodsReceiptNotes(),
      ]);

      setVendors(v);
      setRequisitions(pr);
      setRfqs(r);
      setQuotations(q);
      setOrders(po);
      setGrns(g);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to load procurement data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* ============================================================
     SEARCH
  ============================================================ */

  const query = search.trim().toLowerCase();

  const rows = useMemo(() => {
    const contains = (...values: unknown[]) =>
      !query ||
      values.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query)
      );

    if (tab === "vendors") {
      return vendors.filter((v) =>
        contains(
          v.vendorCode,
          v.name,
          v.contactPerson,
          v.city,
          v.status
        )
      );
    }

    if (tab === "requisitions") {
      return requisitions.filter((v) =>
        contains(
          v.requisitionNumber,
          v.title,
          v.priority,
          v.status
        )
      );
    }

    if (tab === "rfqs") {
      return rfqs.filter((v) =>
        contains(v.rfqNumber, v.status)
      );
    }

    if (tab === "quotations") {
      return quotations.filter((v) =>
        contains(
          v.quotationNumber,
          v.vendor?.name,
          v.status
        )
      );
    }

    if (tab === "orders") {
      return orders.filter((v) =>
        contains(v.poNumber, v.vendor?.name, v.status)
      );
    }

    return grns.filter((v) =>
      contains(v.grnNumber, v.vendor?.name, v.status)
    );
  }, [
    tab,
    query,
    vendors,
    requisitions,
    rfqs,
    quotations,
    orders,
    grns,
  ]);

  /* ============================================================
     VENDOR
  ============================================================ */

  const submitVendor = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    try {
      setSavingVendor(true);
      setError("");
      setSuccess("");

      await createVendor({
        name: vendorForm.name,
        contactPerson:
          vendorForm.contactPerson || undefined,
        email: vendorForm.email || undefined,
        phone: vendorForm.phone || undefined,
        gstNumber:
          vendorForm.gstNumber || undefined,
        city: vendorForm.city || undefined,
        state: vendorForm.state || undefined,
        country: vendorForm.country || "India",
        paymentTerms:
          vendorForm.paymentTerms || undefined,
        notes: vendorForm.notes || undefined,
      });

      setShowVendor(false);

      setVendorForm({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        gstNumber: "",
        city: "",
        state: "",
        country: "India",
        paymentTerms: "",
        notes: "",
      });

      setSuccess("Vendor created successfully.");

      await loadData(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to create vendor"
      );
    } finally {
      setSavingVendor(false);
    }
  };

  /* ============================================================
     PURCHASE REQUISITION
  ============================================================ */

  function resetRequisitionForm() {
    setRequisitionForm({
      title: "",
      priority: "MEDIUM",
      requiredDate: "",
      notes: "",
    });

    setRequisitionItems([emptyRequisitionItem()]);
  }

  function openRequisitionModal() {
    setError("");
    setSuccess("");
    resetRequisitionForm();
    setShowRequisition(true);
  }

  function closeRequisitionModal() {
    if (savingRequisition) return;

    setShowRequisition(false);
    resetRequisitionForm();
  }

  function updateRequisitionItem(
    index: number,
    field: keyof RequisitionItemForm,
    value: string
  ) {
    setRequisitionItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  function addRequisitionItem() {
    setRequisitionItems((current) => [
      ...current,
      emptyRequisitionItem(),
    ]);
  }

  function removeRequisitionItem(index: number) {
    setRequisitionItems((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter(
        (_, itemIndex) => itemIndex !== index
      );
    });
  }

  async function submitRequisition(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!requisitionForm.title.trim()) {
      setError("Requisition title is required.");
      return;
    }

    if (requisitionItems.length === 0) {
      setError("Add at least one requisition item.");
      return;
    }

    const invalidItem = requisitionItems.find(
      (item) =>
        !item.description.trim() ||
        Number(item.quantity) <= 0 ||
        !item.unit.trim()
    );

    if (invalidItem) {
      setError(
        "Each item needs a description, valid quantity and unit."
      );
      return;
    }

    try {
      setSavingRequisition(true);
      setError("");
      setSuccess("");

      await createPurchaseRequisition({
        title: requisitionForm.title.trim(),
        priority: requisitionForm.priority,
        requiredDate:
          requisitionForm.requiredDate
            ? `${requisitionForm.requiredDate}T00:00:00.000Z`
            : undefined,
        notes:
          requisitionForm.notes.trim() || undefined,

        items: requisitionItems.map(
          (item, index) => ({
            lineNumber: index + 1,
            description: item.description.trim(),
            quantity: Number(item.quantity),
            unit: item.unit.trim(),
            estimatedUnitPrice:
              item.estimatedUnitPrice.trim()
                ? Number(item.estimatedUnitPrice)
                : undefined,
            remarks:
              item.remarks.trim() || undefined,
          })
        ),
      });

      setShowRequisition(false);
      resetRequisitionForm();

      setSuccess(
        "Purchase requisition created successfully."
      );

      setTab("requisitions");
      setSearch("");

      await loadData(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to create purchase requisition"
      );
    } finally {
      setSavingRequisition(false);
    }
  }

  /* ============================================================
     REQUISITION STATUS WORKFLOW
  ============================================================ */

  async function changeRequisitionStatus(
    requisition: PurchaseRequisition,
    status: PurchaseRequisitionStatus
  ) {
    let rejectionReason: string | undefined;

    if (status === "REJECTED") {
      rejectionReason = window.prompt(
        "Enter rejection reason:"
      )?.trim();

      if (!rejectionReason) {
        return;
      }
    }

    try {
      setUpdatingRequisitionId(requisition.id);
      setError("");
      setSuccess("");

      await updatePurchaseRequisition(
        requisition.id,
        {
          status,
          ...(rejectionReason
            ? { rejectionReason }
            : {}),
        }
      );

      setSuccess(
        `${requisition.requisitionNumber} moved to ${formatStatus(
          status
        )}.`
      );

      await loadData(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to update purchase requisition"
      );
    } finally {
      setUpdatingRequisitionId(null);
    }
  }

  function renderRequisitionActions(
    requisition: PurchaseRequisition
  ) {
    const busy =
      updatingRequisitionId === requisition.id;

    return (
      <div className="procurement-row-actions">
        {requisition.status === "DRAFT" && (
          <button
            type="button"
            className="row-action-button"
            disabled={busy}
            onClick={() =>
              void changeRequisitionStatus(
                requisition,
                "SUBMITTED"
              )
            }
            title="Submit requisition"
          >
            <Check size={15} />
            Submit
          </button>
        )}

        {requisition.status === "SUBMITTED" && (
          <>
            <button
              type="button"
              className="row-action-button success"
              disabled={busy}
              onClick={() =>
                void changeRequisitionStatus(
                  requisition,
                  "APPROVED"
                )
              }
              title="Approve requisition"
            >
              <Check size={15} />
              Approve
            </button>

            <button
              type="button"
              className="row-action-button danger"
              disabled={busy}
              onClick={() =>
                void changeRequisitionStatus(
                  requisition,
                  "REJECTED"
                )
              }
              title="Reject requisition"
            >
              <Ban size={15} />
              Reject
            </button>
          </>
        )}

        {requisition.status === "REJECTED" && (
          <button
            type="button"
            className="row-action-button"
            disabled={busy}
            onClick={() =>
              void changeRequisitionStatus(
                requisition,
                "DRAFT"
              )
            }
          >
            Move to Draft
          </button>
        )}

        {busy && (
          <RefreshCw
            size={15}
            className="spin"
          />
        )}
      </div>
    );
  }

  async function changeWorkflowStatus(
    kind: "rfq" | "quotation" | "order" | "grn",
    id: string,
    status: RfqStatus | VendorQuotationStatus | PurchaseOrderStatus | GrnStatus
  ) {
    try {
      setUpdatingWorkflowId(id);
      setError("");
      setSuccess("");
      if (kind === "rfq") await updateProcurementRfq(id, { status: status as RfqStatus });
      if (kind === "quotation") await updateVendorQuotation(id, { status: status as VendorQuotationStatus });
      if (kind === "order") await updatePurchaseOrder(id, { status: status as PurchaseOrderStatus });
      if (kind === "grn") await updateGoodsReceiptNote(id, { status: status as GrnStatus });
      setSuccess(`Status updated to ${formatStatus(status)}.`);
      await loadData(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update status");
    } finally {
      setUpdatingWorkflowId(null);
    }
  }

  async function postGrn(grn: GoodsReceiptNote) {
    if (!window.confirm(`Post ${grn.grnNumber} to inventory? This will update stock.`)) return;
    try {
      setUpdatingWorkflowId(grn.id);
      setError("");
      setSuccess("");
      await postGoodsReceiptNote(grn.id);
      setSuccess(`${grn.grnNumber} posted to inventory successfully.`);
      await loadData(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to post GRN");
    } finally {
      setUpdatingWorkflowId(null);
    }
  }

  function renderWorkflowActions(row: unknown) {
    if (tab === "rfqs") {
      const v = row as ProcurementRfq;
      const next: Partial<Record<RfqStatus, RfqStatus>> = { DRAFT: "SENT", QUOTES_RECEIVED: "EVALUATED", AWARDED: "CLOSED" };
      const target = next[v.status];
      return target ? <button className="row-action-button" disabled={updatingWorkflowId === v.id} onClick={() => void changeWorkflowStatus("rfq", v.id, target)}>{formatStatus(target)}</button> : null;
    }
    if (tab === "quotations") {
      const v = row as VendorQuotation;
      return v.status === "RECEIVED" ? <button className="row-action-button" disabled={updatingWorkflowId === v.id} onClick={() => void changeWorkflowStatus("quotation", v.id, "UNDER_REVIEW")}>Review</button>
        : v.status === "UNDER_REVIEW" ? <button className="row-action-button success" disabled={updatingWorkflowId === v.id} onClick={() => void changeWorkflowStatus("quotation", v.id, "SELECTED")}>Select</button> : null;
    }
    if (tab === "orders") {
      const v = row as PurchaseOrder;
      const next: Partial<Record<PurchaseOrderStatus, PurchaseOrderStatus>> = { DRAFT: "APPROVED", APPROVED: "SENT", RECEIVED: "CLOSED", PARTIALLY_RECEIVED: "CLOSED" };
      const target = next[v.status];
      return target ? <button className="row-action-button" disabled={updatingWorkflowId === v.id} onClick={() => void changeWorkflowStatus("order", v.id, target)}>{formatStatus(target)}</button> : null;
    }
    if (tab === "grns") {
      const v = row as GoodsReceiptNote;
      const next: Partial<Record<GrnStatus, GrnStatus>> = { DRAFT: "RECEIVED", RECEIVED: "INSPECTED" };
      const target = next[v.status];
      return <div className="procurement-row-actions">
        {target && <button className="row-action-button" disabled={updatingWorkflowId === v.id} onClick={() => void changeWorkflowStatus("grn", v.id, target)}>{formatStatus(target)}</button>}
        {v.status === "INSPECTED" && <><button className="row-action-button success" onClick={() => void changeWorkflowStatus("grn", v.id, "ACCEPTED")}>Accept</button><button className="row-action-button danger" onClick={() => void changeWorkflowStatus("grn", v.id, "REJECTED")}>Reject</button></>}
        {(v.status === "ACCEPTED" || v.status === "PARTIALLY_ACCEPTED") && !v.postedAt && <button className="row-action-button success" disabled={updatingWorkflowId === v.id} onClick={() => void postGrn(v)}>Post Inventory</button>}
      </div>;
    }
    return null;
  }

  /* ============================================================
     TABS
  ============================================================ */

  const tabs: Array<[Tab, string]> = [
    [
      "vendors",
      `Vendors (${vendors.length})`,
    ],
    [
      "requisitions",
      `Requisitions (${requisitions.length})`,
    ],
    [
      "rfqs",
      `RFQs (${rfqs.length})`,
    ],
    [
      "quotations",
      `Quotations (${quotations.length})`,
    ],
    [
      "orders",
      `Purchase Orders (${orders.length})`,
    ],
    [
      "grns",
      `GRNs (${grns.length})`,
    ],
  ];

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="page-content procurement-page">
        <div
          className="card"
          style={{ padding: 30 }}
        >
          Loading procurement...
        </div>
      </div>
    );
  }

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <div className="page-content procurement-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">
            PROCUREMENT CONTROL
          </span>

          <h1>Procurement</h1>

          <p>
            Manage vendors, requisitions, RFQs,
            quotations, purchase orders and goods
            receipts.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
          }}
        >
          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              void loadData(true)
            }
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "spin"
                  : undefined
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          {tab === "vendors" && (
            <button
              className="primary-button"
              type="button"
              onClick={() =>
                setShowVendor(true)
              }
            >
              <Plus size={18} />
              New Vendor
            </button>
          )}

          {tab === "requisitions" && (
            <button
              className="primary-button"
              type="button"
              onClick={
                openRequisitionModal
              }
            >
              <Plus size={18} />
              New Requisition
            </button>
          )}

          {(["rfqs", "quotations", "orders", "grns"] as Tab[]).includes(tab) && (
            <button className="primary-button" type="button" onClick={() => setShowWorkflow(tab as "rfqs" | "quotations" | "orders" | "grns")}>
              <Plus size={18} />
              {tab === "rfqs" ? "New RFQ" : tab === "quotations" ? "New Quotation" : tab === "orders" ? "New Purchase Order" : "New GRN"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="procurement-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="procurement-alert success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* ========================================================
          SUMMARY
      ======================================================== */}

      <div className="summary-grid">
        <Summary
          icon={<Building2 size={20} />}
          label="Active Vendors"
          value={
            vendors.filter(
              (v) => v.status === "ACTIVE"
            ).length
          }
        />

        <Summary
          icon={<ClipboardList size={20} />}
          label="Open Requisitions"
          value={
            requisitions.filter(
              (v) =>
                ![
                  "CLOSED",
                  "CANCELLED",
                ].includes(v.status)
            ).length
          }
        />

        <Summary
          icon={<FileText size={20} />}
          label="Open RFQs"
          value={
            rfqs.filter(
              (v) =>
                ![
                  "CLOSED",
                  "CANCELLED",
                ].includes(v.status)
            ).length
          }
        />

        <Summary
          icon={<ShoppingCart size={20} />}
          label="Open POs"
          value={
            orders.filter(
              (v) =>
                ![
                  "CLOSED",
                  "CANCELLED",
                ].includes(v.status)
            ).length
          }
        />

        <Summary
          icon={<PackageCheck size={20} />}
          label="GRNs"
          value={grns.length}
        />
      </div>


      <ProcurementIntelligencePanel
        vendors={vendors}
        rfqs={rfqs}
        quotations={quotations}
        orders={orders}
        grns={grns}
      />

      <ProcurementModule6Panel vendors={vendors} />

      {/* ========================================================
          MAIN DATA CARD
      ======================================================== */}

      <section className="card">
        <div
          style={{
            padding: 18,
            borderBottom:
              "1px solid #e5e7eb",
          }}
        >
          <div
            className="tabs"
            style={{
              marginBottom: 14,
            }}
          >
            {tabs.map(
              ([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={
                    tab === key
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setTab(key);
                    setSearch("");
                    setError("");
                    setSuccess("");
                  }}
                >
                  {label}
                </button>
              )
            )}
          </div>

          <div className="search-box">
            <Search size={17} />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder={`Search ${tab}...`}
            />
          </div>
        </div>

        <div className="table-wrapper">
          {rows.length === 0 ? (
            <div className="empty-state">
              <Truck size={34} />

              <h3>
                No {tab} found
              </h3>

              <p>
                {tab === "requisitions"
                  ? "Create your first purchase requisition to begin the procurement workflow."
                  : "There are no records to display."}
              </p>

              {tab === "requisitions" && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    openRequisitionModal
                  }
                  style={{
                    marginTop: 10,
                  }}
                >
                  <Plus size={17} />
                  New Requisition
                </button>
              )}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  {headers(tab).map(
                    (header) => (
                      <th key={header}>
                        {header}
                      </th>
                    )
                  )}

                  {tab !== "vendors" && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => {
                  const id = (
                    row as {
                      id: string;
                    }
                  ).id;

                  return (
                    <tr key={id}>
                      {cells(
                        tab,
                        row
                      ).map(
                        (cell, index) => (
                          <td
                            key={index}
                          >
                            {cell}
                          </td>
                        )
                      )}

                      {tab !== "vendors" && (
                        <td>
                          {tab === "requisitions"
                            ? renderRequisitionActions(row as PurchaseRequisition)
                            : renderWorkflowActions(row)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ========================================================
          NEW VENDOR MODAL
      ======================================================== */}

      {showVendor && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  SUPPLIER MASTER
                </span>

                <h2>
                  New Vendor
                </h2>

                <p>
                  Add a supplier to
                  Procurement.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() =>
                  setShowVendor(false)
                }
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={submitVendor}
            >
              <div className="form-grid">
                <Field label="Vendor Name *">
                  <input
                    required
                    value={
                      vendorForm.name
                    }
                    onChange={(e) =>
                      setVendorForm(
                        (v) => ({
                          ...v,
                          name: e.target
                            .value,
                        })
                      )
                    }
                  />
                </Field>

                <Field label="Contact Person">
                  <input
                    value={
                      vendorForm.contactPerson
                    }
                    onChange={(e) =>
                      setVendorForm(
                        (v) => ({
                          ...v,
                          contactPerson:
                            e.target
                              .value,
                        })
                      )
                    }
                  />
                </Field>

                <Field label="Email">
                  <input
                    type="email"
                    value={
                      vendorForm.email
                    }
                    onChange={(e) =>
                      setVendorForm(
                        (v) => ({
                          ...v,
                          email: e.target
                            .value,
                        })
                      )
                    }
                  />
                </Field>

                <Field label="Phone">
                  <input
                    value={
                      vendorForm.phone
                    }
                    onChange={(e) =>
                      setVendorForm(
                        (v) => ({
                          ...v,
                          phone: e.target
                            .value,
                        })
                      )
                    }
                  />
                </Field>

                <Field label="GST Number">
                  <input
                    value={
                      vendorForm.gstNumber
                    }
                    onChange={(e) =>
                      setVendorForm(
                        (v) => ({
                          ...v,
                          gstNumber:
                            e.target
                              .value,
                        })
                      )
                    }
                  />
                </Field>

                <Field label="City">
                  <input
                    value={
                      vendorForm.city
                    }
                    onChange={(e) =>
                      setVendorForm(
                        (v) => ({
                          ...v,
                          city: e.target
                            .value,
                        })
                      )
                    }
                  />
                </Field>

                <Field label="State">
                  <input
                    value={
                      vendorForm.state
                    }
                    onChange={(e) =>
                      setVendorForm(
                        (v) => ({
                          ...v,
                          state: e.target
                            .value,
                        })
                      )
                    }
                  />
                </Field>

                <Field label="Country">
                  <input
                    value={
                      vendorForm.country
                    }
                    onChange={(e) =>
                      setVendorForm(
                        (v) => ({
                          ...v,
                          country:
                            e.target
                              .value,
                        })
                      )
                    }
                  />
                </Field>

                <Field label="Payment Terms">
                  <input
                    value={
                      vendorForm.paymentTerms
                    }
                    onChange={(e) =>
                      setVendorForm(
                        (v) => ({
                          ...v,
                          paymentTerms:
                            e.target
                              .value,
                        })
                      )
                    }
                  />
                </Field>

                <Field label="Notes">
                  <textarea
                    rows={3}
                    value={
                      vendorForm.notes
                    }
                    onChange={(e) =>
                      setVendorForm(
                        (v) => ({
                          ...v,
                          notes: e.target
                            .value,
                        })
                      )
                    }
                  />
                </Field>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowVendor(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    savingVendor
                  }
                >
                  <Plus size={17} />

                  {savingVendor
                    ? "Creating..."
                    : "Create Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          NEW PURCHASE REQUISITION MODAL
      ======================================================== */}

      {showRequisition && (
        <div className="modal-overlay">
          <div
            className="modal requisition-modal"
            style={{
              maxWidth: 1050,
            }}
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  PURCHASE REQUEST
                </span>

                <h2>
                  New Purchase Requisition
                </h2>

                <p>
                  Create an internal request
                  for materials, components
                  or services.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={
                  closeRequisitionModal
                }
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                submitRequisition
              }
            >
              {/* Basic information */}

              <div className="form-grid">
                <Field label="Requisition Title *">
                  <input
                    required
                    placeholder="e.g. Raw material requirement - September"
                    value={
                      requisitionForm.title
                    }
                    onChange={(e) =>
                      setRequisitionForm(
                        (current) => ({
                          ...current,
                          title: e.target
                            .value,
                        })
                      )
                    }
                  />
                </Field>

                <Field label="Priority">
                  <select
                    value={
                      requisitionForm.priority
                    }
                    onChange={(e) =>
                      setRequisitionForm(
                        (current) => ({
                          ...current,
                          priority:
                            e.target
                              .value as typeof current.priority,
                        })
                      )
                    }
                  >
                    <option value="LOW">
                      Low
                    </option>

                    <option value="MEDIUM">
                      Medium
                    </option>

                    <option value="HIGH">
                      High
                    </option>

                    <option value="URGENT">
                      Urgent
                    </option>
                  </select>
                </Field>

                <Field label="Required Date">
                  <input
                    type="date"
                    min={todayDate()}
                    value={
                      requisitionForm.requiredDate
                    }
                    onChange={(e) =>
                      setRequisitionForm(
                        (current) => ({
                          ...current,
                          requiredDate:
                            e.target
                              .value,
                        })
                      )
                    }
                  />
                </Field>

                <Field label="Notes">
                  <textarea
                    rows={3}
                    placeholder="Additional procurement instructions..."
                    value={
                      requisitionForm.notes
                    }
                    onChange={(e) =>
                      setRequisitionForm(
                        (current) => ({
                          ...current,
                          notes: e.target
                            .value,
                        })
                      )
                    }
                  />
                </Field>
              </div>

              {/* Items */}

              <div
                className="requisition-items-section"
                style={{
                  marginTop: 28,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    gap: 15,
                    marginBottom: 13,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin:
                          "0 0 4px",
                        color:
                          "#17243b",
                      }}
                    >
                      Requisition Items
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color:
                          "#7b899d",
                        fontSize: 13,
                      }}
                    >
                      Add the materials
                      or services you
                      need to purchase.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      addRequisitionItem
                    }
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>

                <div
                  className="requisition-items-table"
                  style={{
                    overflowX:
                      "auto",
                    border:
                      "1px solid #dce5f0",
                    borderRadius: 13,
                  }}
                >
                  <table>
                    <thead>
                      <tr>
                        <th
                          style={{
                            width: 55,
                          }}
                        >
                          #
                        </th>

                        <th>
                          Description *
                        </th>

                        <th
                          style={{
                            width: 120,
                          }}
                        >
                          Quantity *
                        </th>

                        <th
                          style={{
                            width: 130,
                          }}
                        >
                          Unit *
                        </th>

                        <th
                          style={{
                            width: 170,
                          }}
                        >
                          Estimated Unit Price
                        </th>

                        <th>
                          Remarks
                        </th>

                        <th
                          style={{
                            width: 55,
                          }}
                        />
                      </tr>
                    </thead>

                    <tbody>
                      {requisitionItems.map(
                        (
                          item,
                          index
                        ) => (
                          <tr
                            key={
                              index
                            }
                          >
                            <td>
                              <strong>
                                {index +
                                  1}
                              </strong>
                            </td>

                            <td>
                              <input
                                required
                                placeholder="Material / component / service"
                                value={
                                  item.description
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateRequisitionItem(
                                    index,
                                    "description",
                                    e.target
                                      .value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                required
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={
                                  item.quantity
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateRequisitionItem(
                                    index,
                                    "quantity",
                                    e.target
                                      .value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                required
                                placeholder="Nos"
                                value={
                                  item.unit
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateRequisitionItem(
                                    index,
                                    "unit",
                                    e.target
                                      .value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={
                                  item.estimatedUnitPrice
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateRequisitionItem(
                                    index,
                                    "estimatedUnitPrice",
                                    e.target
                                      .value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                placeholder="Optional"
                                value={
                                  item.remarks
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateRequisitionItem(
                                    index,
                                    "remarks",
                                    e.target
                                      .value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <button
                                type="button"
                                className="icon-button"
                                title="Remove item"
                                disabled={
                                  requisitionItems.length ===
                                  1
                                }
                                onClick={() =>
                                  removeRequisitionItem(
                                    index
                                  )
                                }
                              >
                                <Trash2
                                  size={
                                    16
                                  }
                                />
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeRequisitionModal
                  }
                  disabled={
                    savingRequisition
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    savingRequisition
                  }
                >
                  {savingRequisition ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="spin"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Create Requisition
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWorkflow && (
        <WorkflowModal
          kind={showWorkflow}
          vendors={vendors}
          requisitions={requisitions}
          rfqs={rfqs}
          quotations={quotations}
          orders={orders}
          onClose={() => setShowWorkflow(null)}
          onDone={async (message) => { setShowWorkflow(null); setSuccess(message); await loadData(true); }}
          onError={setError}
        />
      )}
    </div>
  );
}

type WorkflowKind = "rfqs" | "quotations" | "orders" | "grns";

function isoDate(value: string) {
  return value ? `${value}T00:00:00.000Z` : undefined;
}

function WorkflowModal({
  kind, vendors, requisitions, rfqs, quotations, orders, onClose, onDone, onError,
}: {
  kind: WorkflowKind;
  vendors: Vendor[];
  requisitions: PurchaseRequisition[];
  rfqs: ProcurementRfq[];
  quotations: VendorQuotation[];
  orders: PurchaseOrder[];
  onClose: () => void;
  onDone: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [vendorIds, setVendorIds] = useState<string[]>([]);
  const [quotationNumber, setQuotationNumber] = useState("");
  const [issueDate, setIssueDate] = useState(todayDate());
  const [dueDate, setDueDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [challanNumber, setChallanNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [freightAmount, setFreightAmount] = useState("0");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [prices, setPrices] = useState<Record<string, { price: string; tax: string; days: string }>>({});
  const [receipts, setReceipts] = useState<Record<string, { received: string; accepted: string; rejected: string }>>({});

  const activeVendors = vendors.filter((v) => v.status === "ACTIVE");
  const approvedPrs = requisitions.filter((r) => r.status === "APPROVED" || r.status === "RFQ_CREATED");
  const selectedPr = requisitions.find((r) => r.id === sourceId);
  const selectedRfq = rfqs.find((r) => r.id === sourceId);
  const selectedQuote = quotations.find((q) => q.id === sourceId);
  const selectedOrder = orders.find((o) => o.id === sourceId);

  const quoteRfqs = rfqs.filter((r) => ["SENT", "QUOTES_RECEIVED", "EVALUATED"].includes(r.status));
  const selectedQuotes = quotations.filter((q) => q.status === "SELECTED");
  const receivableOrders = orders.filter((o) => o.status === "SENT" || o.status === "PARTIALLY_RECEIVED");

  useEffect(() => {
    setVendorId("");
    setPrices({});
    setReceipts({});
    if (kind === "orders") {
      const q = quotations.find((x) => x.id === sourceId);
      if (q) setVendorId(q.vendorId);
    }
  }, [sourceId, kind, quotations]);

  function toggleVendor(id: string) {
    setVendorIds((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSaving(true);
      onError("");

      if (kind === "rfqs") {
        if (!selectedPr) throw new Error("Select a purchase requisition.");
        if (!vendorIds.length) throw new Error("Select at least one vendor.");
        await createProcurementRfq({
          purchaseRequisitionId: selectedPr.id,
          issueDate: isoDate(issueDate),
          dueDate: isoDate(dueDate),
          notes: notes.trim() || undefined,
          vendorIds,
          items: selectedPr.items.map((item, index) => ({
            purchaseRequisitionItemId: item.id,
            inventoryItemId: item.inventoryItemId || undefined,
            lineNumber: index + 1,
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit,
            remarks: item.remarks || undefined,
          })),
        });
        await onDone("RFQ created successfully.");
        return;
      }

      if (kind === "quotations") {
        if (!selectedRfq) throw new Error("Select an RFQ.");
        if (!vendorId) throw new Error("Select an invited vendor.");
        if (!quotationNumber.trim()) throw new Error("Vendor quotation number is required.");
        await createVendorQuotation({
          quotationNumber: quotationNumber.trim(),
          rfqId: selectedRfq.id,
          vendorId,
          quotationDate: isoDate(issueDate),
          validUntil: isoDate(validUntil),
          currency: "INR",
          freightAmount: Number(freightAmount || 0),
          paymentTerms: paymentTerms.trim() || undefined,
          deliveryTerms: deliveryTerms.trim() || undefined,
          notes: notes.trim() || undefined,
          items: selectedRfq.items.map((item) => ({
            rfqItemId: item.id,
            quantity: Number(item.quantity),
            unitPrice: Number(prices[item.id]?.price || 0),
            taxPercent: Number(prices[item.id]?.tax || 0),
            deliveryDays: prices[item.id]?.days ? Number(prices[item.id].days) : undefined,
          })),
        });
        await onDone("Vendor quotation recorded successfully.");
        return;
      }

      if (kind === "orders") {
        if (!selectedQuote) throw new Error("Select a vendor quotation.");
        const sourceRfq = rfqs.find((r) => r.id === selectedQuote.rfqId);
        await createPurchaseOrder({
          vendorId: selectedQuote.vendorId,
          vendorQuotationId: selectedQuote.id,
          purchaseRequisitionId: sourceRfq?.purchaseRequisitionId,
          orderDate: isoDate(issueDate),
          expectedDeliveryDate: isoDate(expectedDeliveryDate),
          currency: selectedQuote.currency || "INR",
          freightAmount: Number(freightAmount || selectedQuote.freightAmount || 0),
          paymentTerms: paymentTerms.trim() || selectedQuote.paymentTerms || undefined,
          deliveryTerms: deliveryTerms.trim() || selectedQuote.deliveryTerms || undefined,
          notes: notes.trim() || undefined,
          items: selectedQuote.items.map((item, index) => ({
            purchaseRequisitionItemId: item.rfqItem?.purchaseRequisitionItemId || undefined,
            inventoryItemId: item.rfqItem?.inventoryItemId || undefined,
            lineNumber: index + 1,
            description: item.rfqItem?.description || `Item ${index + 1}`,
            quantity: Number(item.quantity),
            unit: item.rfqItem?.unit || "Nos",
            unitPrice: Number(item.unitPrice),
            taxPercent: Number(item.taxPercent),
            remarks: item.remarks || undefined,
          })),
        });
        await onDone("Purchase order created successfully.");
        return;
      }

      if (!selectedOrder) throw new Error("Select a purchase order.");
      const eligible = selectedOrder.items.filter((item) => item.inventoryItemId);
      if (!eligible.length) throw new Error("This PO has no inventory-linked items, so a GRN cannot update inventory.");
      await createGoodsReceiptNote({
        purchaseOrderId: selectedOrder.id,
        receiptDate: isoDate(issueDate),
        challanNumber: challanNumber.trim() || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        items: eligible.map((item) => {
          const remaining = Math.max(0, Number(item.quantity) - Number(item.receivedQuantity));
          const received = Number(receipts[item.id]?.received || remaining);
          const accepted = Number(receipts[item.id]?.accepted || received);
          const rejected = Number(receipts[item.id]?.rejected || 0);
          return {
            purchaseOrderItemId: item.id,
            inventoryItemId: item.inventoryItemId!,
            receivedQuantity: received,
            acceptedQuantity: accepted,
            rejectedQuantity: rejected,
            unitCost: Number(item.unitPrice),
          };
        }),
      });
      await onDone("GRN created successfully.");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Unable to save procurement document");
    } finally {
      setSaving(false);
    }
  }

  const title = kind === "rfqs" ? "New RFQ" : kind === "quotations" ? "New Vendor Quotation" : kind === "orders" ? "New Purchase Order" : "New Goods Receipt Note";

  return (
    <div className="modal-overlay">
      <div className="modal procurement-workflow-modal" style={{ maxWidth: 1100 }}>
        <div className="modal-header">
          <div><span className="eyebrow">PROCUREMENT WORKFLOW</span><h2>{title}</h2><p>Complete the document details below.</p></div>
          <button type="button" className="icon-button" onClick={onClose} disabled={saving}><X size={20} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="form-grid">
            {kind === "rfqs" && <Field label="Approved Purchase Requisition *"><select required value={sourceId} onChange={(e) => setSourceId(e.target.value)}><option value="">Select requisition</option>{approvedPrs.map((r) => <option key={r.id} value={r.id}>{r.requisitionNumber} — {r.title}</option>)}</select></Field>}
            {kind === "quotations" && <Field label="RFQ *"><select required value={sourceId} onChange={(e) => setSourceId(e.target.value)}><option value="">Select RFQ</option>{quoteRfqs.map((r) => <option key={r.id} value={r.id}>{r.rfqNumber}</option>)}</select></Field>}
            {kind === "orders" && <Field label="Selected Vendor Quotation *"><select required value={sourceId} onChange={(e) => setSourceId(e.target.value)}><option value="">Select quotation</option>{selectedQuotes.map((q) => <option key={q.id} value={q.id}>{q.quotationNumber} — {q.vendor?.name || q.vendorId} — {money(q.totalAmount)}</option>)}</select></Field>}
            {kind === "grns" && <Field label="Purchase Order *"><select required value={sourceId} onChange={(e) => setSourceId(e.target.value)}><option value="">Select sent PO</option>{receivableOrders.map((o) => <option key={o.id} value={o.id}>{o.poNumber} — {o.vendor?.name || o.vendorId}</option>)}</select></Field>}
            {kind === "quotations" && <Field label="Vendor Quotation Number *"><input required value={quotationNumber} onChange={(e) => setQuotationNumber(e.target.value)} placeholder="Supplier quote reference" /></Field>}
            {kind === "quotations" && <Field label="Invited Vendor *"><select required value={vendorId} onChange={(e) => setVendorId(e.target.value)}><option value="">Select vendor</option>{(selectedRfq?.vendors || []).map((x) => <option key={x.vendorId} value={x.vendorId}>{x.vendor?.name || x.vendorId}</option>)}</select></Field>}
            <Field label={kind === "grns" ? "Receipt Date" : kind === "orders" ? "Order Date" : kind === "quotations" ? "Quotation Date" : "Issue Date"}><input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></Field>
            {kind === "rfqs" && <Field label="Quotation Due Date"><input type="date" min={issueDate} value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>}
            {kind === "quotations" && <Field label="Valid Until"><input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></Field>}
            {kind === "orders" && <Field label="Expected Delivery"><input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} /></Field>}
            {(kind === "quotations" || kind === "orders") && <Field label="Freight Amount"><input type="number" min="0" step="0.01" value={freightAmount} onChange={(e) => setFreightAmount(e.target.value)} /></Field>}
            {(kind === "quotations" || kind === "orders") && <Field label="Payment Terms"><input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} /></Field>}
            {(kind === "quotations" || kind === "orders") && <Field label="Delivery Terms"><input value={deliveryTerms} onChange={(e) => setDeliveryTerms(e.target.value)} /></Field>}
            {kind === "grns" && <><Field label="Challan Number"><input value={challanNumber} onChange={(e) => setChallanNumber(e.target.value)} /></Field><Field label="Invoice Number"><input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} /></Field></>}
            <Field label="Notes"><textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          </div>

          {kind === "rfqs" && <div className="workflow-section"><h3>Select Vendors *</h3><div className="vendor-check-grid">{activeVendors.map((v) => <label key={v.id} className="vendor-check"><input type="checkbox" checked={vendorIds.includes(v.id)} onChange={() => toggleVendor(v.id)} /><span><strong>{v.name}</strong><small>{v.vendorCode}</small></span></label>)}</div>{!activeVendors.length && <p className="workflow-hint">Create an active vendor first.</p>}</div>}

          {kind === "rfqs" && selectedPr && <ItemsPreview title="RFQ Items" items={selectedPr.items.map((i) => ({ description: i.description, quantity: i.quantity, unit: i.unit }))} />}

          {kind === "quotations" && selectedRfq && <div className="workflow-section"><h3>Quotation Prices</h3><div className="table-wrapper"><table><thead><tr><th>Item</th><th>Qty</th><th>Unit Price *</th><th>Tax %</th><th>Delivery Days</th></tr></thead><tbody>{selectedRfq.items.map((i) => <tr key={i.id}><td>{i.description}</td><td>{String(i.quantity)} {i.unit}</td><td><input required type="number" min="0" step="0.01" value={prices[i.id]?.price || ""} onChange={(e) => setPrices((p) => ({ ...p, [i.id]: { price: e.target.value, tax: p[i.id]?.tax || "0", days: p[i.id]?.days || "" } }))} /></td><td><input type="number" min="0" step="0.01" value={prices[i.id]?.tax || "0"} onChange={(e) => setPrices((p) => ({ ...p, [i.id]: { price: p[i.id]?.price || "", tax: e.target.value, days: p[i.id]?.days || "" } }))} /></td><td><input type="number" min="0" value={prices[i.id]?.days || ""} onChange={(e) => setPrices((p) => ({ ...p, [i.id]: { price: p[i.id]?.price || "", tax: p[i.id]?.tax || "0", days: e.target.value } }))} /></td></tr>)}</tbody></table></div></div>}

          {kind === "orders" && selectedQuote && <ItemsPreview title="Purchase Order Items" items={selectedQuote.items.map((i) => ({ description: i.rfqItem?.description || "Item", quantity: i.quantity, unit: i.rfqItem?.unit || "Nos", extra: `${money(i.unitPrice)} + ${String(i.taxPercent)}% tax` }))} />}

          {kind === "grns" && selectedOrder && <div className="workflow-section"><h3>Receipt Quantities</h3><p className="workflow-hint">Only inventory-linked PO items can be received into stock.</p><div className="table-wrapper"><table><thead><tr><th>Item</th><th>Remaining</th><th>Received *</th><th>Accepted *</th><th>Rejected</th></tr></thead><tbody>{selectedOrder.items.filter((i) => i.inventoryItemId).map((i) => { const remaining = Math.max(0, Number(i.quantity) - Number(i.receivedQuantity)); return <tr key={i.id}><td>{i.description}</td><td>{remaining} {i.unit}</td><td><input required type="number" min="0.001" max={remaining} step="0.001" value={receipts[i.id]?.received ?? String(remaining)} onChange={(e) => setReceipts((p) => ({ ...p, [i.id]: { received: e.target.value, accepted: p[i.id]?.accepted ?? e.target.value, rejected: p[i.id]?.rejected ?? "0" } }))} /></td><td><input required type="number" min="0" step="0.001" value={receipts[i.id]?.accepted ?? String(remaining)} onChange={(e) => setReceipts((p) => ({ ...p, [i.id]: { received: p[i.id]?.received ?? String(remaining), accepted: e.target.value, rejected: p[i.id]?.rejected ?? "0" } }))} /></td><td><input type="number" min="0" step="0.001" value={receipts[i.id]?.rejected ?? "0"} onChange={(e) => setReceipts((p) => ({ ...p, [i.id]: { received: p[i.id]?.received ?? String(remaining), accepted: p[i.id]?.accepted ?? String(remaining), rejected: e.target.value } }))} /></td></tr>; })}</tbody></table></div></div>}

          <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? <><RefreshCw size={17} className="spin" />Saving...</> : <><Plus size={17} />Create</>}</button></div>
        </form>
      </div>
    </div>
  );
}

function ItemsPreview({ title, items }: { title: string; items: Array<{ description: string; quantity: string | number; unit: string; extra?: string }> }) {
  return <div className="workflow-section"><h3>{title}</h3><div className="table-wrapper"><table><thead><tr><th>#</th><th>Description</th><th>Quantity</th><th>Details</th></tr></thead><tbody>{items.map((i, index) => <tr key={`${i.description}-${index}`}><td>{index + 1}</td><td>{i.description}</td><td>{String(i.quantity)} {i.unit}</td><td>{i.extra || "—"}</td></tr>)}</tbody></table></div></div>;
}

/* ================================================================
   TABLE HEADERS
================================================================ */

function headers(tab: Tab) {
  if (tab === "vendors") {
    return [
      "Code",
      "Vendor",
      "Contact",
      "Location",
      "Status",
    ];
  }

  if (tab === "requisitions") {
    return [
      "PR Number",
      "Title",
      "Priority",
      "Required",
      "Status",
    ];
  }

  if (tab === "rfqs") {
    return [
      "RFQ Number",
      "Due Date",
      "Vendors",
      "Quotations",
      "Status",
    ];
  }

  if (tab === "quotations") {
    return [
      "Quotation",
      "Vendor",
      "Date",
      "Amount",
      "Status",
    ];
  }

  if (tab === "orders") {
    return [
      "PO Number",
      "Vendor",
      "Order Date",
      "Amount",
      "Status",
    ];
  }

  return [
    "GRN Number",
    "Vendor",
    "Receipt Date",
    "PO",
    "Status",
  ];
}

/* ================================================================
   TABLE CELLS
================================================================ */

function cells(
  tab: Tab,
  row: unknown
): React.ReactNode[] {
  if (tab === "vendors") {
    const v = row as Vendor;

    return [
      v.vendorCode,
      v.name,
      v.contactPerson ||
        v.email ||
        "—",
      [v.city, v.state]
        .filter(Boolean)
        .join(", ") || "—",
      <Badge
        key="status"
        status={v.status}
      />,
    ];
  }

  if (tab === "requisitions") {
    const v =
      row as PurchaseRequisition;

    return [
      <strong key="number">
        {v.requisitionNumber}
      </strong>,

      <div
        key="title"
        className="procurement-title-cell"
      >
        <strong>
          {v.title}
        </strong>

        <span>
          {v.items?.length ?? 0}{" "}
          item
          {(v.items?.length ?? 0) !==
          1
            ? "s"
            : ""}
        </span>
      </div>,

      <Badge
        key="priority"
        status={v.priority}
      />,

      date(v.requiredDate),

      <Badge
        key="status"
        status={v.status}
      />,
    ];
  }

  if (tab === "rfqs") {
    const v =
      row as ProcurementRfq;

    return [
      v.rfqNumber,
      date(v.dueDate),
      v.vendors?.length ?? 0,
      v.quotations?.length ?? 0,
      <Badge
        key="status"
        status={v.status}
      />,
    ];
  }

  if (tab === "quotations") {
    const v =
      row as VendorQuotation;

    return [
      v.quotationNumber,
      v.vendor?.name ?? "—",
      date(v.quotationDate),
      money(v.totalAmount),
      <Badge
        key="status"
        status={v.status}
      />,
    ];
  }

  if (tab === "orders") {
    const v =
      row as PurchaseOrder;

    return [
      v.poNumber,
      v.vendor?.name ?? "—",
      date(v.orderDate),
      money(v.totalAmount),
      <Badge
        key="status"
        status={v.status}
      />,
    ];
  }

  const v =
    row as GoodsReceiptNote;

  return [
    v.grnNumber,
    v.vendor?.name ?? "—",
    date(v.receiptDate),
    v.purchaseOrder?.poNumber ??
      "—",
    <Badge
      key="status"
      status={v.status}
    />,
  ];
}

/* ================================================================
   SUMMARY CARD
================================================================ */

function Summary({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="summary-card">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      {icon}
    </div>
  );
}

/* ================================================================
   STATUS BADGE
================================================================ */

function Badge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={`status-badge ${status
        .toLowerCase()
        .replaceAll("_", "-")}`}
    >
      {formatStatus(status)}
    </span>
  );
}

/* ================================================================
   FORM FIELD
================================================================ */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span>{label}</span>
      {children}
    </label>
  );
}