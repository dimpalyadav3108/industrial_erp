import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Eye,
  FileCheck2,
  FileText,
  Plus,
  Search,
  Send,
  X,
} from "lucide-react";
import { getEstimates } from "../services/estimate.service";
import {
  createQuotation,
  getQuotations,
  updateQuotationStatus,
} from "../services/quotation.service";
import type { Estimate } from "../types/estimate";
import type {
  CreateQuotationPayload,
  Quotation,
  QuotationStatus,
} from "../types/quotation";

const statusLabels: Record<QuotationStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
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

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Quotation | null>(null);
  const [estimateId, setEstimateId] = useState("");
  const [status, setStatus] = useState<QuotationStatus>("DRAFT");
  const [validUntil, setValidUntil] = useState("");
  const [paymentTerms, setPaymentTerms] = useState(
    "50% advance, balance before dispatch"
  );
  const [deliveryTerms, setDeliveryTerms] = useState(
    "4-6 weeks from receipt of purchase order"
  );
  const [termsAndConditions, setTermsAndConditions] = useState(
    "Prices are exclusive of statutory charges unless specified."
  );
  const [notes, setNotes] = useState("");

  const loadData = useCallback(async (searchValue = "") => {
    try {
      setLoading(true);
      setError("");
      const [quotationRecords, estimateRecords] = await Promise.all([
        getQuotations(searchValue),
        getEstimates(),
      ]);
      setQuotations(quotationRecords);
      setEstimates(
        estimateRecords.filter((estimate) =>
          ["APPROVED", "CONVERTED"].includes(estimate.status)
        )
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load quotations"
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
      total: quotations.length,
      drafts: quotations.filter((record) => record.status === "DRAFT").length,
      sent: quotations.filter((record) => record.status === "SENT").length,
      accepted: quotations.filter((record) =>
        ["ACCEPTED", "CONVERTED"].includes(record.status)
      ).length,
      value: quotations.reduce(
        (sum, record) => sum + Number(record.totalAmount),
        0
      ),
    }),
    [quotations]
  );

  const chosenEstimate = useMemo(
    () => estimates.find((estimate) => estimate.id === estimateId) ?? null,
    [estimateId, estimates]
  );

  const resetForm = () => {
    setEstimateId("");
    setStatus("DRAFT");
    setValidUntil("");
    setPaymentTerms("50% advance, balance before dispatch");
    setDeliveryTerms("4-6 weeks from receipt of purchase order");
    setTermsAndConditions(
      "Prices are exclusive of statutory charges unless specified."
    );
    setNotes("");
    setError("");
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!estimateId) {
      setError("Please select an approved estimate");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload: CreateQuotationPayload = {
        estimateId,
        status,
        ...(validUntil ? { validUntil } : {}),
        ...(paymentTerms ? { paymentTerms } : {}),
        ...(deliveryTerms ? { deliveryTerms } : {}),
        ...(termsAndConditions ? { termsAndConditions } : {}),
        ...(notes ? { notes } : {}),
      };
      await createQuotation(payload);
      setShowForm(false);
      resetForm();
      await loadData(search);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to create quotation"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (
    quotation: Quotation,
    nextStatus: QuotationStatus
  ) => {
    try {
      setBusyId(quotation.id);
      setError("");
      const updated = await updateQuotationStatus(quotation.id, nextStatus);
      setQuotations((current) =>
        current.map((record) =>
          record.id === updated.id ? updated : record
        )
      );
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Unable to update status"
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="module-page quotation-page">
      <div className="module-heading">
        <div>
          <span className="page-eyebrow">COMMERCIAL PROPOSALS</span>
          <h1>Quotations</h1>
          <p>Create customer proposals from approved cost estimates.</p>
        </div>
        <button
          className="primary-action"
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus size={19} /> New quotation
        </button>
      </div>

      <div className="quotation-summary-grid">
        <article><FileText size={24} /><div><strong>{summary.total}</strong><span>Total quotations</span></div></article>
        <article><FileCheck2 size={24} /><div><strong>{summary.drafts}</strong><span>Drafts</span></div></article>
        <article><Send size={24} /><div><strong>{summary.sent}</strong><span>Sent</span></div></article>
        <article><FileCheck2 size={24} /><div><strong>{summary.accepted}</strong><span>Accepted</span></div></article>
        <article><FileText size={24} /><div><strong>{money(summary.value)}</strong><span>Quoted value</span></div></article>
      </div>

      <div className="directory-card">
        <div className="directory-header">
          <div><h2>Quotation register</h2><p>{quotations.length} records shown</p></div>
          <form className="directory-search" onSubmit={(event) => { event.preventDefault(); void loadData(search); }}>
            <Search size={19} />
            <input value={search} placeholder="Search quotation, estimate or customer..." onChange={(event) => setSearch(event.target.value)} />
            <button type="submit">Search</button>
          </form>
        </div>

        {error && !showForm && <div className="page-error">{error}</div>}
        {loading ? (
          <div className="empty-state"><div className="loading-spinner" /><h3>Loading quotations...</h3></div>
        ) : quotations.length === 0 ? (
          <div className="empty-state"><span className="empty-state-icon"><FileText size={34} /></span><h3>No quotations found</h3><p>Create a customer quotation from an approved estimate.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table quotation-table">
              <thead><tr><th>Quotation</th><th>Customer / Lead</th><th>Estimate</th><th>Status</th><th>Total</th><th>Valid until</th><th>Action</th></tr></thead>
              <tbody>
                {quotations.map((quotation) => (
                  <tr key={quotation.id}>
                    <td><div className="lead-title-cell"><strong>{quotation.quotationNumber}</strong><span>{date(quotation.issueDate)}</span></div></td>
                    <td><div className="lead-title-cell"><strong>{quotation.estimate.lead.customer?.companyName || "No customer"}</strong><span>{quotation.estimate.lead.title}</span></div></td>
                    <td>{quotation.estimate.estimateNumber} · V{quotation.version}</td>
                    <td><select className="quotation-status-select" value={quotation.status} disabled={busyId === quotation.id} onChange={(event) => void handleStatus(quotation, event.target.value as QuotationStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td>
                    <td><strong>{money(quotation.totalAmount)}</strong></td>
                    <td>{date(quotation.validUntil)}</td>
                    <td><button className="row-action-button" type="button" title="View quotation" onClick={() => setSelected(quotation)}><Eye size={17} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && setShowForm(false)}>
          <div className="quotation-form-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div><span className="page-eyebrow">NEW PROPOSAL</span><h2>Create quotation</h2><p>Use an approved estimate and add the commercial terms.</p></div>
              <button className="icon-button" type="button" onClick={() => setShowForm(false)}><X size={21} /></button>
            </div>
            <form onSubmit={handleCreate}>
              {error && <div className="page-error">{error}</div>}
              <div className="quotation-top-fields">
                <label>Approved estimate<select required value={estimateId} onChange={(event) => setEstimateId(event.target.value)}><option value="">Select estimate</option>{estimates.map((estimate) => <option key={estimate.id} value={estimate.id}>{estimate.estimateNumber} — {estimate.lead.title} — {money(estimate.totalAmount)}</option>)}</select></label>
                <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as QuotationStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label>Valid until<input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} /></label>
              </div>

              {chosenEstimate && (
                <div className="quotation-estimate-preview">
                  <span>Estimate <strong>{chosenEstimate.estimateNumber}</strong></span>
                  <span>Customer <strong>{chosenEstimate.lead.customer?.companyName || "No customer"}</strong></span>
                  <span>Subtotal <strong>{money(chosenEstimate.subtotal)}</strong></span>
                  <span>Tax <strong>{money(chosenEstimate.taxAmount)}</strong></span>
                  <span>Total <strong>{money(chosenEstimate.totalAmount)}</strong></span>
                </div>
              )}

              <div className="quotation-text-fields">
                <label>Payment terms<textarea rows={2} value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} /></label>
                <label>Delivery terms<textarea rows={2} value={deliveryTerms} onChange={(event) => setDeliveryTerms(event.target.value)} /></label>
                <label className="full-field">Terms and conditions<textarea rows={3} value={termsAndConditions} onChange={(event) => setTermsAndConditions(event.target.value)} /></label>
                <label className="full-field">Internal notes<textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
              </div>
              <div className="modal-actions"><button className="secondary-action" type="button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-action" type="submit" disabled={saving}>{saving ? "Creating..." : "Create quotation"}</button></div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
          <div className="quotation-detail-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header"><div><span className="page-eyebrow">QUOTATION DETAILS</span><h2>{selected.quotationNumber}</h2><p>{selected.estimate.lead.customer?.companyName || "No customer"} · Version {selected.version}</p></div><button className="icon-button" type="button" onClick={() => setSelected(null)}><X size={21} /></button></div>
            <div className="quotation-detail-meta"><span>Lead<strong>{selected.estimate.lead.title}</strong></span><span>Estimate<strong>{selected.estimate.estimateNumber}</strong></span><span>Status<strong>{statusLabels[selected.status]}</strong></span><span>Valid until<strong>{date(selected.validUntil)}</strong></span></div>
            <div className="quotation-detail-items">{selected.estimate.items.map((item) => <div key={item.id}><span>{item.itemType}</span><strong>{item.description}</strong><small>{item.quantity} {item.unit} × {money(item.unitRate)}</small><b>{money(item.amount)}</b></div>)}</div>
            <div className="quotation-terms"><div><span>Payment terms</span><p>{selected.paymentTerms || "Not specified"}</p></div><div><span>Delivery terms</span><p>{selected.deliveryTerms || "Not specified"}</p></div><div><span>Terms and conditions</span><p>{selected.termsAndConditions || "Not specified"}</p></div></div>
            <div className="quotation-detail-total"><span>Subtotal: {money(selected.subtotal)}</span><span>Tax: {money(selected.taxAmount)}</span><strong>Total: {money(selected.totalAmount)}</strong></div>
          </div>
        </div>
      )}
    </section>
  );
}

