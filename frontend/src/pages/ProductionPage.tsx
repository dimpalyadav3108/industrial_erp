import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  CircleCheck,
  Clock3,
  Eye,
  Factory,
  PauseCircle,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  createProductionOrder,
  getProductionOrders,
  updateProductionOperation,
  updateProductionOrderStatus,
} from "../services/production.service";
import { getQuotations } from "../services/quotation.service";
import type {
  CreateProductionOperationPayload,
  CreateProductionOrderPayload,
  ProductionOperationStatus,
  ProductionOrder,
  ProductionOrderStatus,
  ProductionPriority,
} from "../types/production";
import type { Quotation } from "../types/quotation";

const orderStatusLabels: Record<ProductionOrderStatus, string> = {
  PLANNED: "Planned",
  RELEASED: "Released",
  IN_PROGRESS: "In progress",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const operationStatusLabels: Record<ProductionOperationStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  SKIPPED: "Skipped",
};

const priorityLabels: Record<ProductionPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

const displayDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Not specified";

const apiDate = (value: string) =>
  new Date(`${value}T00:00:00.000Z`).toISOString();

const emptyOperation = (): CreateProductionOperationPayload => ({
  name: "",
  workCenter: "",
});

const initialOperations = (): CreateProductionOperationPayload[] => [
  { name: "Engineering and drawing approval", workCenter: "Engineering" },
  { name: "Panel assembly and wiring", workCenter: "Assembly" },
  { name: "Testing and quality inspection", workCenter: "Testing" },
];

export default function ProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<ProductionOrder | null>(null);
  const [quotationId, setQuotationId] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<ProductionPriority>("MEDIUM");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("Nos");
  const [plannedStartDate, setPlannedStartDate] = useState("");
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [operations, setOperations] = useState(initialOperations());

  const loadData = useCallback(async (searchValue = "") => {
    try {
      setLoading(true);
      setError("");
      const [productionRecords, quotationRecords] = await Promise.all([
        getProductionOrders(searchValue),
        getQuotations(),
      ]);
      setOrders(productionRecords);
      setQuotations(quotationRecords);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load production orders"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const summary = useMemo(
    () => ({
      total: orders.length,
      planned: orders.filter((order) =>
        ["PLANNED", "RELEASED"].includes(order.status)
      ).length,
      active: orders.filter((order) => order.status === "IN_PROGRESS").length,
      held: orders.filter((order) => order.status === "ON_HOLD").length,
      completed: orders.filter((order) => order.status === "COMPLETED").length,
    }),
    [orders]
  );

  const availableQuotations = useMemo(
    () =>
      quotations.filter(
        (quotation) =>
          ["ACCEPTED", "CONVERTED"].includes(quotation.status) &&
          !orders.some((order) => order.quotationId === quotation.id)
      ),
    [orders, quotations]
  );

  const selectedQuotation = useMemo(
    () => quotations.find((quotation) => quotation.id === quotationId) ?? null,
    [quotationId, quotations]
  );

  const resetForm = () => {
    setQuotationId("");
    setTitle("");
    setPriority("MEDIUM");
    setQuantity("1");
    setUnit("Nos");
    setPlannedStartDate("");
    setPlannedEndDate("");
    setNotes("");
    setOperations(initialOperations());
    setError("");
  };

  const selectQuotation = (id: string) => {
    setQuotationId(id);
    const quotation = quotations.find((record) => record.id === id);
    if (quotation) {
      setTitle(quotation.estimate.lead.title);
    }
  };

  const changeOperation = (
    index: number,
    field: "name" | "workCenter",
    value: string
  ) => {
    setOperations((current) =>
      current.map((operation, operationIndex) =>
        operationIndex === index ? { ...operation, [field]: value } : operation
      )
    );
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!quotationId) {
      setError("Please select an accepted quotation");
      return;
    }

    if (operations.some((operation) => !operation.name.trim())) {
      setError("Every operation must have a name");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload: CreateProductionOrderPayload = {
        quotationId,
        title,
        priority,
        quantity: Number(quantity),
        unit,
        ...(plannedStartDate
          ? { plannedStartDate: apiDate(plannedStartDate) }
          : {}),
        ...(plannedEndDate ? { plannedEndDate: apiDate(plannedEndDate) } : {}),
        ...(notes ? { notes } : {}),
        operations: operations.map((operation) => ({
          name: operation.name.trim(),
          ...(operation.workCenter?.trim()
            ? { workCenter: operation.workCenter.trim() }
            : {}),
        })),
      };
      await createProductionOrder(payload);
      setShowForm(false);
      resetForm();
      await loadData(search);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to create production order"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOrderStatus = async (
    order: ProductionOrder,
    status: ProductionOrderStatus
  ) => {
    try {
      setBusyId(order.id);
      setError("");
      const updated = await updateProductionOrderStatus(order.id, status);
      setOrders((current) =>
        current.map((record) => (record.id === updated.id ? updated : record))
      );
      if (selected?.id === updated.id) setSelected(updated);
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Unable to update production status"
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleOperationStatus = async (
    order: ProductionOrder,
    operationId: string,
    status: ProductionOperationStatus
  ) => {
    try {
      setBusyId(operationId);
      setError("");
      const updated = await updateProductionOperation(
        order.id,
        operationId,
        status
      );
      setOrders((current) =>
        current.map((record) => (record.id === updated.id ? updated : record))
      );
      setSelected(updated);
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Unable to update operation"
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="module-page production-page">
      <div className="module-heading">
        <div>
          <span className="page-eyebrow">SHOP FLOOR CONTROL</span>
          <h1>Production</h1>
          <p>Plan manufacturing orders, operations and completion progress.</p>
        </div>
        <button
          className="primary-action"
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus size={19} /> New production order
        </button>
      </div>

      <div className="production-summary-grid">
        <article><Factory size={24} /><div><strong>{summary.total}</strong><span>Total orders</span></div></article>
        <article><Clock3 size={24} /><div><strong>{summary.planned}</strong><span>Planned / released</span></div></article>
        <article><Factory size={24} /><div><strong>{summary.active}</strong><span>In progress</span></div></article>
        <article><PauseCircle size={24} /><div><strong>{summary.held}</strong><span>On hold</span></div></article>
        <article><CircleCheck size={24} /><div><strong>{summary.completed}</strong><span>Completed</span></div></article>
      </div>

      <div className="directory-card">
        <div className="directory-header">
          <div><h2>Production register</h2><p>{orders.length} records shown</p></div>
          <form className="directory-search" onSubmit={(event) => { event.preventDefault(); void loadData(search); }}>
            <Search size={19} />
            <input value={search} placeholder="Search order, quotation or customer..." onChange={(event) => setSearch(event.target.value)} />
            <button type="submit">Search</button>
          </form>
        </div>

        {error && !showForm && <div className="page-error">{error}</div>}
        {loading ? (
          <div className="empty-state"><div className="loading-spinner" /><h3>Loading production...</h3></div>
        ) : orders.length === 0 ? (
          <div className="empty-state"><span className="empty-state-icon"><Factory size={34} /></span><h3>No production orders found</h3><p>Create an order from an accepted quotation.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table production-table">
              <thead><tr><th>Production order</th><th>Customer / Product</th><th>Priority</th><th>Plan</th><th>Progress</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td><div className="lead-title-cell"><strong>{order.productionNumber}</strong><span>{order.quotation.quotationNumber}</span></div></td>
                    <td><div className="lead-title-cell"><strong>{order.title}</strong><span>{order.quotation.estimate.lead.customer?.companyName || "No customer"}</span></div></td>
                    <td><span className={`production-priority ${order.priority.toLowerCase()}`}>{priorityLabels[order.priority]}</span></td>
                    <td><div className="lead-title-cell"><strong>{order.quantity} {order.unit}</strong><span>{displayDate(order.plannedEndDate)}</span></div></td>
                    <td><div className="production-progress"><div><span style={{ width: `${Number(order.progressPercent)}%` }} /></div><strong>{Number(order.progressPercent)}%</strong></div></td>
                    <td><select className="production-status-select" value={order.status} disabled={busyId === order.id} onChange={(event) => void handleOrderStatus(order, event.target.value as ProductionOrderStatus)}>{Object.entries(orderStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td>
                    <td><button className="row-action-button" type="button" title="View production order" onClick={() => setSelected(order)}><Eye size={17} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && setShowForm(false)}>
          <div className="production-form-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div><span className="page-eyebrow">NEW WORK ORDER</span><h2>Create production order</h2><p>Convert an accepted quotation into a manufacturing plan.</p></div>
              <button className="icon-button" type="button" onClick={() => setShowForm(false)}><X size={21} /></button>
            </div>
            <form onSubmit={handleCreate}>
              {error && <div className="page-error">{error}</div>}
              <div className="production-form-grid">
                <label className="wide-field">Accepted quotation<select required value={quotationId} onChange={(event) => selectQuotation(event.target.value)}><option value="">Select quotation</option>{availableQuotations.map((quotation) => <option key={quotation.id} value={quotation.id}>{quotation.quotationNumber} — {quotation.estimate.lead.customer?.companyName || "No customer"} — {quotation.estimate.lead.title}</option>)}</select></label>
                <label className="wide-field">Production title<input required minLength={2} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
                <label>Priority<select value={priority} onChange={(event) => setPriority(event.target.value as ProductionPriority)}>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label>Quantity<input required type="number" min="0.001" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
                <label>Unit<input required value={unit} onChange={(event) => setUnit(event.target.value)} /></label>
                <label>Planned start<input type="date" value={plannedStartDate} onChange={(event) => setPlannedStartDate(event.target.value)} /></label>
                <label>Planned completion<input type="date" min={plannedStartDate || undefined} value={plannedEndDate} onChange={(event) => setPlannedEndDate(event.target.value)} /></label>
              </div>

              {selectedQuotation && (
                <div className="production-source-preview"><span>Customer<strong>{selectedQuotation.estimate.lead.customer?.companyName || "No customer"}</strong></span><span>Lead<strong>{selectedQuotation.estimate.lead.title}</strong></span><span>Quotation<strong>{selectedQuotation.quotationNumber}</strong></span></div>
              )}

              <div className="operation-editor-heading"><div><h3>Production operations</h3><p>Add the shop-floor steps in execution order.</p></div><button className="secondary-action" type="button" onClick={() => setOperations((current) => [...current, emptyOperation()])}><Plus size={17} /> Add operation</button></div>
              <div className="operation-editor-list">
                {operations.map((operation, index) => (
                  <div className="operation-editor-row" key={index}>
                    <span>{index + 1}</span>
                    <input required placeholder="Operation name" value={operation.name} onChange={(event) => changeOperation(index, "name", event.target.value)} />
                    <input placeholder="Work centre" value={operation.workCenter || ""} onChange={(event) => changeOperation(index, "workCenter", event.target.value)} />
                    <button className="icon-button" type="button" disabled={operations.length === 1} onClick={() => setOperations((current) => current.filter((_, operationIndex) => operationIndex !== index))}><Trash2 size={17} /></button>
                  </div>
                ))}
              </div>
              <label className="production-notes">Notes<textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
              <div className="modal-actions"><button className="secondary-action" type="button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-action" type="submit" disabled={saving}>{saving ? "Creating..." : "Create production order"}</button></div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
          <div className="production-detail-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header"><div><span className="page-eyebrow">PRODUCTION DETAILS</span><h2>{selected.productionNumber}</h2><p>{selected.title} · {selected.quantity} {selected.unit}</p></div><button className="icon-button" type="button" onClick={() => setSelected(null)}><X size={21} /></button></div>
            {error && <div className="page-error">{error}</div>}
            <div className="production-detail-meta"><span>Customer<strong>{selected.quotation.estimate.lead.customer?.companyName || "No customer"}</strong></span><span>Quotation<strong>{selected.quotation.quotationNumber}</strong></span><span>Priority<strong>{priorityLabels[selected.priority]}</strong></span><span>Planned completion<strong>{displayDate(selected.plannedEndDate)}</strong></span><span>Progress<strong>{Number(selected.progressPercent)}%</strong></span></div>
            <div className="production-operation-list">
              <h3>Operations</h3>
              {selected.operations.map((operation) => (
                <div key={operation.id} className="production-operation-row">
                  <span className="operation-sequence">{operation.sequence}</span>
                  <div><strong>{operation.name}</strong><small>{operation.workCenter || "No work centre"}</small></div>
                  <select value={operation.status} disabled={busyId === operation.id} onChange={(event) => void handleOperationStatus(selected, operation.id, event.target.value as ProductionOperationStatus)}>{Object.entries(operationStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

