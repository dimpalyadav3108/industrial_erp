import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Eye,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { getProductionOrders } from "../services/production.service";
import {
  createQualityInspection,
  getQualityInspections,
  updateQualityCheck,
} from "../services/quality.service";
import type { ProductionOrder } from "../types/production";
import type {
  CreateQualityCheckPayload,
  CreateQualityInspectionPayload,
  QualityCheckResult,
  QualityInspection,
  QualityInspectionType,
} from "../types/quality";

const typeLabels: Record<QualityInspectionType, string> = {
  IN_PROCESS: "In-process",
  FINAL: "Final inspection",
};

const statusLabels = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  PASSED: "Passed",
  FAILED: "Failed",
  ON_HOLD: "On hold",
} as const;

const resultLabels: Record<QualityCheckResult, string> = {
  PENDING: "Pending",
  PASS: "Pass",
  FAIL: "Fail",
  NOT_APPLICABLE: "N/A",
};

const displayDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Not scheduled";

const apiDate = (value: string) =>
  new Date(`${value}T00:00:00.000Z`).toISOString();

const defaultChecks = (): CreateQualityCheckPayload[] => [
  { parameter: "Visual inspection", specification: "No visible damage or workmanship defect" },
  { parameter: "Wiring and terminal check", specification: "As per approved electrical drawing" },
  { parameter: "Functional testing", specification: "All control functions operate correctly" },
  { parameter: "Safety and earthing", specification: "Continuity and insulation are acceptable" },
  { parameter: "Documentation verification", specification: "Drawings and test reports are complete" },
];

export default function QualityPage() {
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<QualityInspection | null>(null);
  const [productionOrderId, setProductionOrderId] = useState("");
  const [inspectionType, setInspectionType] = useState<QualityInspectionType>("FINAL");
  const [scheduledDate, setScheduledDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [checks, setChecks] = useState(defaultChecks());
  const [observations, setObservations] = useState<Record<string, string>>({});

  const loadData = useCallback(async (searchValue = "") => {
    try {
      setLoading(true);
      setError("");
      const [inspectionRecords, productionRecords] = await Promise.all([
        getQualityInspections(searchValue),
        getProductionOrders(),
      ]);
      setInspections(inspectionRecords);
      setProductionOrders(
        productionRecords.filter((order) => order.status !== "CANCELLED")
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load quality inspections"
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
      total: inspections.length,
      pending: inspections.filter((item) => item.status === "PENDING").length,
      progress: inspections.filter((item) => item.status === "IN_PROGRESS").length,
      passed: inspections.filter((item) => item.status === "PASSED").length,
      failed: inspections.filter((item) => item.status === "FAILED").length,
    }),
    [inspections]
  );

  const selectedOrder = useMemo(
    () =>
      productionOrders.find((order) => order.id === productionOrderId) ?? null,
    [productionOrderId, productionOrders]
  );

  const resetForm = () => {
    setProductionOrderId("");
    setInspectionType("FINAL");
    setScheduledDate("");
    setRemarks("");
    setChecks(defaultChecks());
    setError("");
  };

  const openDetails = (inspection: QualityInspection) => {
    setSelected(inspection);
    setObservations(
      Object.fromEntries(
        inspection.checks.map((check) => [check.id, check.observedValue || ""])
      )
    );
  };

  const changeCheck = (
    index: number,
    field: "parameter" | "specification",
    value: string
  ) => {
    setChecks((current) =>
      current.map((check, checkIndex) =>
        checkIndex === index ? { ...check, [field]: value } : check
      )
    );
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productionOrderId) {
      setError("Please select a production order");
      return;
    }
    if (checks.some((check) => !check.parameter.trim())) {
      setError("Every checklist row must have a parameter");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload: CreateQualityInspectionPayload = {
        productionOrderId,
        inspectionType,
        ...(scheduledDate ? { scheduledDate: apiDate(scheduledDate) } : {}),
        ...(remarks ? { remarks } : {}),
        checks: checks.map((check) => ({
          parameter: check.parameter.trim(),
          ...(check.specification?.trim()
            ? { specification: check.specification.trim() }
            : {}),
        })),
      };
      await createQualityInspection(payload);
      setShowForm(false);
      resetForm();
      await loadData(search);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to create quality inspection"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCheckResult = async (
    inspection: QualityInspection,
    checkId: string,
    result: QualityCheckResult
  ) => {
    try {
      setBusyId(checkId);
      setError("");
      const updated = await updateQualityCheck(inspection.id, checkId, {
        result,
        observedValue: observations[checkId] || undefined,
      });
      setInspections((current) =>
        current.map((record) => (record.id === updated.id ? updated : record))
      );
      openDetails(updated);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update checklist"
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="module-page quality-page">
      <div className="module-heading">
        <div><span className="page-eyebrow">QUALITY ASSURANCE</span><h1>Quality</h1><p>Plan inspections, record checklist results and control acceptance.</p></div>
        <button className="primary-action" type="button" onClick={() => { resetForm(); setShowForm(true); }}><Plus size={19} /> New inspection</button>
      </div>

      <div className="quality-summary-grid">
        <article><ClipboardCheck size={24} /><div><strong>{summary.total}</strong><span>Total inspections</span></div></article>
        <article><Clock3 size={24} /><div><strong>{summary.pending}</strong><span>Pending</span></div></article>
        <article><ClipboardCheck size={24} /><div><strong>{summary.progress}</strong><span>In progress</span></div></article>
        <article><CheckCircle2 size={24} /><div><strong>{summary.passed}</strong><span>Passed</span></div></article>
        <article><AlertTriangle size={24} /><div><strong>{summary.failed}</strong><span>Failed</span></div></article>
      </div>

      <div className="directory-card">
        <div className="directory-header">
          <div><h2>Inspection register</h2><p>{inspections.length} records shown</p></div>
          <form className="directory-search" onSubmit={(event) => { event.preventDefault(); void loadData(search); }}><Search size={19} /><input value={search} placeholder="Search inspection, production or customer..." onChange={(event) => setSearch(event.target.value)} /><button type="submit">Search</button></form>
        </div>
        {error && !showForm && !selected && <div className="page-error">{error}</div>}
        {loading ? (
          <div className="empty-state"><div className="loading-spinner" /><h3>Loading inspections...</h3></div>
        ) : inspections.length === 0 ? (
          <div className="empty-state"><span className="empty-state-icon"><ClipboardCheck size={34} /></span><h3>No inspections found</h3><p>Create an inspection for a production order.</p></div>
        ) : (
          <div className="table-scroll"><table className="data-table quality-table"><thead><tr><th>Inspection</th><th>Production / Customer</th><th>Type</th><th>Scheduled</th><th>Checks</th><th>Status</th><th>Action</th></tr></thead><tbody>{inspections.map((inspection) => {
            const completedChecks = inspection.checks.filter((check) => check.result !== "PENDING").length;
            return <tr key={inspection.id}><td><div className="lead-title-cell"><strong>{inspection.inspectionNumber}</strong><span>{displayDate(inspection.createdAt)}</span></div></td><td><div className="lead-title-cell"><strong>{inspection.productionOrder.productionNumber}</strong><span>{inspection.productionOrder.title}</span><small>{inspection.productionOrder.quotation.estimate.lead.customer?.companyName || "No customer"}</small></div></td><td>{typeLabels[inspection.inspectionType]}</td><td>{displayDate(inspection.scheduledDate)}</td><td>{completedChecks}/{inspection.checks.length}</td><td><span className={`quality-status ${inspection.status.toLowerCase()}`}>{statusLabels[inspection.status]}</span></td><td><button className="row-action-button" type="button" onClick={() => openDetails(inspection)}><Eye size={17} /></button></td></tr>;
          })}</tbody></table></div>
        )}
      </div>

      {showForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && setShowForm(false)}><div className="quality-form-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
          <div className="modal-header"><div><span className="page-eyebrow">NEW INSPECTION</span><h2>Create quality inspection</h2><p>Select a production order and define its acceptance checks.</p></div><button className="icon-button" type="button" onClick={() => setShowForm(false)}><X size={21} /></button></div>
          <form onSubmit={handleCreate}>{error && <div className="page-error">{error}</div>}
            <div className="quality-form-grid"><label className="wide-field">Production order<select required value={productionOrderId} onChange={(event) => setProductionOrderId(event.target.value)}><option value="">Select production order</option>{productionOrders.map((order) => <option key={order.id} value={order.id}>{order.productionNumber} — {order.title}</option>)}</select></label><label>Inspection type<select value={inspectionType} onChange={(event) => setInspectionType(event.target.value as QualityInspectionType)}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Scheduled date<input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} /></label></div>
            {selectedOrder && <div className="quality-source-preview"><span>Production<strong>{selectedOrder.productionNumber}</strong></span><span>Product<strong>{selectedOrder.title}</strong></span><span>Customer<strong>{selectedOrder.quotation.estimate.lead.customer?.companyName || "No customer"}</strong></span></div>}
            <div className="quality-check-heading"><div><h3>Inspection checklist</h3><p>Define every parameter and its acceptance specification.</p></div><button className="secondary-action" type="button" onClick={() => setChecks((current) => [...current, { parameter: "", specification: "" }])}><Plus size={17} /> Add check</button></div>
            <div className="quality-check-editor">{checks.map((check, index) => <div key={index}><span>{index + 1}</span><input required placeholder="Quality parameter" value={check.parameter} onChange={(event) => changeCheck(index, "parameter", event.target.value)} /><input placeholder="Acceptance specification" value={check.specification || ""} onChange={(event) => changeCheck(index, "specification", event.target.value)} /><button className="icon-button" type="button" disabled={checks.length === 1} onClick={() => setChecks((current) => current.filter((_, checkIndex) => checkIndex !== index))}><Trash2 size={17} /></button></div>)}</div>
            <label className="quality-remarks">Remarks<textarea rows={3} value={remarks} onChange={(event) => setRemarks(event.target.value)} /></label>
            <div className="modal-actions"><button className="secondary-action" type="button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-action" type="submit" disabled={saving}>{saving ? "Creating..." : "Create inspection"}</button></div>
          </form>
        </div></div>
      )}

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}><div className="quality-detail-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
          <div className="modal-header"><div><span className="page-eyebrow">INSPECTION DETAILS</span><h2>{selected.inspectionNumber}</h2><p>{selected.productionOrder.productionNumber} · {typeLabels[selected.inspectionType]}</p></div><button className="icon-button" type="button" onClick={() => setSelected(null)}><X size={21} /></button></div>
          {error && <div className="page-error">{error}</div>}
          <div className="quality-detail-meta"><span>Product<strong>{selected.productionOrder.title}</strong></span><span>Customer<strong>{selected.productionOrder.quotation.estimate.lead.customer?.companyName || "No customer"}</strong></span><span>Status<strong>{statusLabels[selected.status]}</strong></span><span>Scheduled<strong>{displayDate(selected.scheduledDate)}</strong></span></div>
          <div className="quality-result-list"><h3>Checklist results</h3>{selected.checks.map((check) => <div className="quality-result-row" key={check.id}><span>{check.sequence}</span><div><strong>{check.parameter}</strong><small>{check.specification || "No specification"}</small></div><input placeholder="Observed value" value={observations[check.id] || ""} onChange={(event) => setObservations((current) => ({ ...current, [check.id]: event.target.value }))} /><select value={check.result} disabled={busyId === check.id} onChange={(event) => void handleCheckResult(selected, check.id, event.target.value as QualityCheckResult)}>{Object.entries(resultLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>)}</div>
        </div></div>
      )}
    </section>
  );
}
