import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Calculator,
  Eye,
  FileCheck2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { getLeads } from "../services/lead.service";
import {
  createEstimate,
  getEstimates,
  updateEstimateStatus,
} from "../services/estimate.service";
import type { Lead } from "../types/lead";
import type {
  CreateEstimatePayload,
  Estimate,
  EstimateItemType,
  EstimateStatus,
} from "../types/estimate";

interface ItemForm {
  itemType: EstimateItemType;
  description: string;
  quantity: string;
  unit: string;
  unitRate: string;
}

const newItem = (): ItemForm => ({
  itemType: "MATERIAL",
  description: "",
  quantity: "1",
  unit: "Nos",
  unitRate: "",
});

const statusLabels: Record<EstimateStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CONVERTED: "Converted",
};

const money = (value: number | string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Not specified";

export default function EstimationPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Estimate | null>(null);
  const [leadId, setLeadId] = useState("");
  const [status, setStatus] = useState<EstimateStatus>("DRAFT");
  const [marginPercent, setMarginPercent] = useState("10");
  const [taxPercent, setTaxPercent] = useState("18");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemForm[]>([newItem()]);

  const loadData = useCallback(async (searchValue = "") => {
    try {
      setLoading(true);
      setError("");
      const [estimateRecords, leadRecords] = await Promise.all([
        getEstimates(searchValue),
        getLeads(),
      ]);
      setEstimates(estimateRecords);
      setLeads(
        leadRecords.filter((lead) =>
          ["QUALIFIED", "TECHNICAL_REVIEW", "ESTIMATION"].includes(lead.status)
        )
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load estimates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const liveTotals = useMemo(() => {
    const base = items.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0) * Number(item.unitRate || 0),
      0
    );
    const subtotal = base + base * (Number(marginPercent || 0) / 100);
    const tax = subtotal * (Number(taxPercent || 0) / 100);
    return { base, subtotal, tax, total: subtotal + tax };
  }, [items, marginPercent, taxPercent]);

  const summary = useMemo(
    () => ({
      total: estimates.length,
      drafts: estimates.filter((record) => record.status === "DRAFT").length,
      approved: estimates.filter((record) => record.status === "APPROVED").length,
      value: estimates.reduce((sum, record) => sum + Number(record.totalAmount), 0),
    }),
    [estimates]
  );

  const resetForm = () => {
    setLeadId("");
    setStatus("DRAFT");
    setMarginPercent("10");
    setTaxPercent("18");
    setValidUntil("");
    setNotes("");
    setItems([newItem()]);
    setError("");
  };

  const updateItem = (index: number, field: keyof ItemForm, value: string) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!leadId) {
      setError("Please select a qualified lead");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload: CreateEstimatePayload = {
        leadId,
        status,
        marginPercent: Number(marginPercent),
        taxPercent: Number(taxPercent),
        ...(validUntil ? { validUntil } : {}),
        ...(notes ? { notes } : {}),
        items: items.map((item) => ({
          itemType: item.itemType,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitRate: Number(item.unitRate),
        })),
      };
      await createEstimate(payload);
      setShowForm(false);
      resetForm();
      await loadData(search);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to create estimate");
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (estimate: Estimate, nextStatus: EstimateStatus) => {
    try {
      setBusyId(estimate.id);
      setError("");
      const updated = await updateEstimateStatus(estimate.id, nextStatus);
      setEstimates((current) =>
        current.map((record) => (record.id === updated.id ? updated : record))
      );
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Unable to update status");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="module-page estimation-page">
      <div className="module-heading">
        <div>
          <span className="page-eyebrow">COST ENGINEERING</span>
          <h1>Estimation</h1>
          <p>Create itemized project costs, margins, taxes and approval versions.</p>
        </div>
        <button
          className="primary-action"
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus size={19} /> New estimate
        </button>
      </div>

      <div className="estimation-summary-grid">
        <article><Calculator size={24} /><div><strong>{summary.total}</strong><span>Total estimates</span></div></article>
        <article><FileCheck2 size={24} /><div><strong>{summary.drafts}</strong><span>Drafts</span></div></article>
        <article><FileCheck2 size={24} /><div><strong>{summary.approved}</strong><span>Approved</span></div></article>
        <article><Calculator size={24} /><div><strong>{money(summary.value)}</strong><span>Estimated value</span></div></article>
      </div>

      <div className="directory-card">
        <div className="directory-header">
          <div><h2>Estimate register</h2><p>{estimates.length} records shown</p></div>
          <form
            className="directory-search"
            onSubmit={(event) => {
              event.preventDefault();
              void loadData(search);
            }}
          >
            <Search size={19} />
            <input value={search} placeholder="Search estimate, lead or customer..." onChange={(event) => setSearch(event.target.value)} />
            <button type="submit">Search</button>
          </form>
        </div>
        {error && !showForm && <div className="page-error">{error}</div>}
        {loading ? (
          <div className="empty-state"><div className="loading-spinner" /><h3>Loading estimates...</h3></div>
        ) : estimates.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon"><Calculator size={34} /></span>
            <h3>No estimates found</h3>
            <p>Create a cost estimate for a qualified sales enquiry.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table estimate-table">
              <thead><tr><th>Estimate</th><th>Lead / Customer</th><th>Version</th><th>Status</th><th>Total</th><th>Valid until</th><th>Action</th></tr></thead>
              <tbody>
                {estimates.map((estimate) => (
                  <tr key={estimate.id}>
                    <td><div className="lead-title-cell"><strong>{estimate.estimateNumber}</strong><span>{date(estimate.createdAt)}</span></div></td>
                    <td><div className="lead-title-cell"><strong>{estimate.lead.title}</strong><span>{estimate.lead.customer?.companyName || "No customer"}</span></div></td>
                    <td>V{estimate.version}</td>
                    <td>
                      <select className="estimate-status-select" value={estimate.status} disabled={busyId === estimate.id} onChange={(event) => void handleStatus(estimate, event.target.value as EstimateStatus)}>
                        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </td>
                    <td><strong>{money(estimate.totalAmount)}</strong></td>
                    <td>{date(estimate.validUntil)}</td>
                    <td><button className="row-action-button" type="button" title="View estimate" onClick={() => setSelected(estimate)}><Eye size={17} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && setShowForm(false)}>
          <div className="estimate-form-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div><span className="page-eyebrow">NEW COST SHEET</span><h2>Create estimate</h2><p>Add materials, labour, overheads and commercial percentages.</p></div>
              <button className="icon-button" type="button" onClick={() => setShowForm(false)}><X size={21} /></button>
            </div>
            <form onSubmit={handleCreate}>
              {error && <div className="page-error">{error}</div>}
              <div className="estimate-top-fields">
                <label>Qualified lead<select required value={leadId} onChange={(event) => setLeadId(event.target.value)}><option value="">Select lead</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.leadNumber} — {lead.title}</option>)}</select></label>
                <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as EstimateStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label>Margin %<input type="number" min="0" max="100" value={marginPercent} onChange={(event) => setMarginPercent(event.target.value)} /></label>
                <label>Tax %<input type="number" min="0" max="100" value={taxPercent} onChange={(event) => setTaxPercent(event.target.value)} /></label>
                <label>Valid until<input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} /></label>
              </div>

              <div className="estimate-items-heading"><div><h3>Cost items</h3><p>Quantity × rate is calculated automatically.</p></div><button className="secondary-action" type="button" onClick={() => setItems((current) => [...current, newItem()])}><Plus size={16} /> Add item</button></div>
              <div className="estimate-items">
                {items.map((item, index) => (
                  <div className="estimate-item-row" key={index}>
                    <select value={item.itemType} onChange={(event) => updateItem(index, "itemType", event.target.value)}><option value="MATERIAL">Material</option><option value="LABOUR">Labour</option><option value="OVERHEAD">Overhead</option><option value="SERVICE">Service</option></select>
                    <input required placeholder="Description" value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} />
                    <input required type="number" min="0.001" step="0.001" placeholder="Qty" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} />
                    <input required placeholder="Unit" value={item.unit} onChange={(event) => updateItem(index, "unit", event.target.value)} />
                    <input required type="number" min="0" step="0.01" placeholder="Rate" value={item.unitRate} onChange={(event) => updateItem(index, "unitRate", event.target.value)} />
                    <strong>{money(Number(item.quantity || 0) * Number(item.unitRate || 0))}</strong>
                    <button className="row-action-button danger" type="button" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <label className="estimate-notes">Notes<textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
              <div className="estimate-live-totals"><span>Base <strong>{money(liveTotals.base)}</strong></span><span>Subtotal <strong>{money(liveTotals.subtotal)}</strong></span><span>Tax <strong>{money(liveTotals.tax)}</strong></span><span>Total <strong>{money(liveTotals.total)}</strong></span></div>
              <div className="modal-actions"><button className="secondary-action" type="button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-action" type="submit" disabled={saving}>{saving ? "Creating..." : "Create estimate"}</button></div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
          <div className="estimate-detail-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header"><div><span className="page-eyebrow">ESTIMATE DETAILS</span><h2>{selected.estimateNumber}</h2><p>{selected.lead.title} · Version {selected.version}</p></div><button className="icon-button" type="button" onClick={() => setSelected(null)}><X size={21} /></button></div>
            <div className="estimate-detail-items">{selected.items.map((item) => <div key={item.id}><span>{item.itemType}</span><strong>{item.description}</strong><small>{item.quantity} {item.unit} × {money(item.unitRate)}</small><b>{money(item.amount)}</b></div>)}</div>
            <div className="estimate-detail-total"><span>Subtotal: {money(selected.subtotal)}</span><span>Tax: {money(selected.taxAmount)}</span><strong>Total: {money(selected.totalAmount)}</strong></div>
          </div>
        </div>
      )}
    </section>
  );
}
