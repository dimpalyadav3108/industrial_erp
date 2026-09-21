import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, Clock3, Eye, MapPin, PackageCheck, Plus, Search, Send, Truck, X } from "lucide-react";
import { createDispatch, getDispatches, updateDispatchStatus } from "../services/dispatch.service";
import { getQualityInspections } from "../services/quality.service";
import type { CreateDispatchPayload, Dispatch, DispatchStatus, TransportMode } from "../types/dispatch";
import type { QualityInspection } from "../types/quality";

const statusLabels: Record<DispatchStatus, string> = {
  PLANNED: "Planned", READY: "Ready", DISPATCHED: "Dispatched", DELIVERED: "Delivered", CANCELLED: "Cancelled",
};
const transportLabels: Record<TransportMode, string> = {
  ROAD: "Road", AIR: "Air", RAIL: "Rail", COURIER: "Courier", CUSTOMER_PICKUP: "Customer pickup",
};
const displayDate = (value: string | null) => value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "Not set";
const apiDate = (value: string) => new Date(`${value}T00:00:00.000Z`).toISOString();

export default function DispatchPage() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Dispatch | null>(null);
  const [qualityInspectionId, setQualityInspectionId] = useState("");
  const [transportMode, setTransportMode] = useState<TransportMode>("ROAD");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [transporterName, setTransporterName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [destination, setDestination] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [packageCount, setPackageCount] = useState("1");
  const [totalWeight, setTotalWeight] = useState("");
  const [notes, setNotes] = useState("");

  const loadData = useCallback(async (searchValue = "") => {
    try {
      setLoading(true); setError("");
      const [dispatchRecords, inspectionRecords] = await Promise.all([getDispatches(searchValue), getQualityInspections()]);
      setDispatches(dispatchRecords); setInspections(inspectionRecords);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dispatch data");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const eligibleInspections = useMemo(() => inspections.filter((inspection) =>
    inspection.inspectionType === "FINAL" && inspection.status === "PASSED" &&
    !dispatches.some((item) => item.qualityInspectionId === inspection.id)
  ), [dispatches, inspections]);
  const selectedInspection = useMemo(() => eligibleInspections.find((item) => item.id === qualityInspectionId) ?? null, [eligibleInspections, qualityInspectionId]);
  const summary = useMemo(() => ({
    total: dispatches.length,
    planned: dispatches.filter((item) => item.status === "PLANNED").length,
    ready: dispatches.filter((item) => item.status === "READY").length,
    dispatched: dispatches.filter((item) => item.status === "DISPATCHED").length,
    delivered: dispatches.filter((item) => item.status === "DELIVERED").length,
  }), [dispatches]);

  const resetForm = () => {
    setQualityInspectionId(""); setTransportMode("ROAD"); setExpectedDeliveryDate(""); setTransporterName("");
    setVehicleNumber(""); setTrackingNumber(""); setDestination(""); setContactPerson(""); setContactPhone("");
    setPackageCount("1"); setTotalWeight(""); setNotes(""); setError("");
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!qualityInspectionId) { setError("Please select a passed final inspection"); return; }
    try {
      setSaving(true); setError("");
      const payload: CreateDispatchPayload = {
        qualityInspectionId, transportMode, destination: destination.trim(), packageCount: Number(packageCount),
        ...(expectedDeliveryDate ? { expectedDeliveryDate: apiDate(expectedDeliveryDate) } : {}),
        ...(transporterName.trim() ? { transporterName: transporterName.trim() } : {}),
        ...(vehicleNumber.trim() ? { vehicleNumber: vehicleNumber.trim() } : {}),
        ...(trackingNumber.trim() ? { trackingNumber: trackingNumber.trim() } : {}),
        ...(contactPerson.trim() ? { contactPerson: contactPerson.trim() } : {}),
        ...(contactPhone.trim() ? { contactPhone: contactPhone.trim() } : {}),
        ...(totalWeight ? { totalWeight: Number(totalWeight) } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };
      await createDispatch(payload); setShowForm(false); resetForm(); await loadData(search);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to create dispatch");
    } finally { setSaving(false); }
  };

  const handleStatus = async (dispatch: Dispatch, status: DispatchStatus) => {
    try {
      setBusyId(dispatch.id); setError("");
      const updated = await updateDispatchStatus(dispatch.id, status);
      setDispatches((current) => current.map((item) => item.id === updated.id ? updated : item));
      if (selected?.id === updated.id) setSelected(updated);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update dispatch");
    } finally { setBusyId(null); }
  };

  return <section className="module-page dispatch-page">
    <div className="module-heading"><div><span className="page-eyebrow">LOGISTICS CONTROL</span><h1>Dispatch</h1><p>Plan shipments, track delivery and complete customer handover.</p></div><button className="primary-action" type="button" onClick={() => { resetForm(); setShowForm(true); }}><Plus size={19} /> New dispatch</button></div>
    <div className="dispatch-summary-grid">
      <article><PackageCheck size={24} /><div><strong>{summary.total}</strong><span>Total dispatches</span></div></article>
      <article><Clock3 size={24} /><div><strong>{summary.planned}</strong><span>Planned</span></div></article>
      <article><PackageCheck size={24} /><div><strong>{summary.ready}</strong><span>Ready</span></div></article>
      <article><Truck size={24} /><div><strong>{summary.dispatched}</strong><span>Dispatched</span></div></article>
      <article><CheckCircle2 size={24} /><div><strong>{summary.delivered}</strong><span>Delivered</span></div></article>
    </div>
    <div className="directory-card">
      <div className="directory-header"><div><h2>Dispatch register</h2><p>{dispatches.length} records shown</p></div><form className="directory-search" onSubmit={(event) => { event.preventDefault(); void loadData(search); }}><Search size={19} /><input value={search} placeholder="Search dispatch, production, tracking or customer..." onChange={(event) => setSearch(event.target.value)} /><button type="submit">Search</button></form></div>
      {error && !showForm && !selected && <div className="page-error">{error}</div>}
      {loading ? <div className="empty-state"><div className="loading-spinner" /><h3>Loading dispatches...</h3></div> : dispatches.length === 0 ? <div className="empty-state"><span className="empty-state-icon"><Truck size={34} /></span><h3>No dispatches found</h3><p>Create a shipment from a passed final inspection.</p></div> :
        <div className="table-scroll"><table className="data-table dispatch-table"><thead><tr><th>Dispatch</th><th>Customer / Product</th><th>Transport</th><th>Packages</th><th>Expected delivery</th><th>Status</th><th>Action</th></tr></thead><tbody>{dispatches.map((dispatch) => <tr key={dispatch.id}>
          <td><div className="lead-title-cell"><strong>{dispatch.dispatchNumber}</strong><span>{dispatch.productionOrder.productionNumber}</span></div></td>
          <td><div className="lead-title-cell"><strong>{dispatch.productionOrder.quotation.estimate.lead.customer?.companyName || "No customer"}</strong><span>{dispatch.productionOrder.title}</span></div></td>
          <td><div className="lead-title-cell"><strong>{transportLabels[dispatch.transportMode]}</strong><span>{dispatch.trackingNumber || dispatch.vehicleNumber || "Details pending"}</span></div></td>
          <td>{dispatch.packageCount}</td><td>{displayDate(dispatch.expectedDeliveryDate)}</td>
          <td><select className="dispatch-status-select" value={dispatch.status} disabled={busyId === dispatch.id} onChange={(event) => void handleStatus(dispatch, event.target.value as DispatchStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td>
          <td><button className="row-action-button" type="button" onClick={() => setSelected(dispatch)}><Eye size={17} /></button></td>
        </tr>)}</tbody></table></div>}
    </div>

    {showForm && <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && setShowForm(false)}><div className="dispatch-form-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
      <div className="modal-header"><div><span className="page-eyebrow">NEW SHIPMENT</span><h2>Create dispatch</h2><p>Use a passed final inspection and enter the shipment details.</p></div><button className="icon-button" type="button" onClick={() => setShowForm(false)}><X size={21} /></button></div>
      <form onSubmit={handleCreate}>{error && <div className="page-error">{error}</div>}<div className="dispatch-form-grid">
        <label className="span-two">Passed final inspection<select required value={qualityInspectionId} onChange={(event) => setQualityInspectionId(event.target.value)}><option value="">Select inspection</option>{eligibleInspections.map((inspection) => <option key={inspection.id} value={inspection.id}>{inspection.inspectionNumber} — {inspection.productionOrder.productionNumber} — {inspection.productionOrder.title}</option>)}</select></label>
        <label>Transport mode<select value={transportMode} onChange={(event) => setTransportMode(event.target.value as TransportMode)}>{Object.entries(transportLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Expected delivery<input type="date" value={expectedDeliveryDate} onChange={(event) => setExpectedDeliveryDate(event.target.value)} /></label>
        <label>Transporter<input value={transporterName} onChange={(event) => setTransporterName(event.target.value)} placeholder="Transport company" /></label>
        <label>Vehicle number<input value={vehicleNumber} onChange={(event) => setVehicleNumber(event.target.value)} placeholder="Vehicle registration" /></label>
        <label>Tracking number<input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="LR / AWB / tracking no." /></label>
        <label>Package count<input required min="1" type="number" value={packageCount} onChange={(event) => setPackageCount(event.target.value)} /></label>
        <label>Total weight (kg)<input min="0" step="0.001" type="number" value={totalWeight} onChange={(event) => setTotalWeight(event.target.value)} /></label>
        <label>Contact person<input value={contactPerson} onChange={(event) => setContactPerson(event.target.value)} /></label>
        <label>Contact phone<input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} /></label>
        <label className="span-two">Destination<textarea required rows={3} value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Complete delivery address" /></label>
        <label className="span-two">Notes<textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      </div>
      {selectedInspection && <div className="dispatch-source-preview"><span>Production<strong>{selectedInspection.productionOrder.productionNumber}</strong></span><span>Product<strong>{selectedInspection.productionOrder.title}</strong></span><span>Customer<strong>{selectedInspection.productionOrder.quotation.estimate.lead.customer?.companyName || "No customer"}</strong></span></div>}
      {eligibleInspections.length === 0 && <div className="dispatch-notice">No unused passed final inspection is currently available.</div>}
      <div className="modal-actions"><button className="secondary-action" type="button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-action" type="submit" disabled={saving || eligibleInspections.length === 0}>{saving ? "Creating..." : "Create dispatch"}</button></div>
      </form>
    </div></div>}

    {selected && <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}><div className="dispatch-detail-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
      <div className="modal-header"><div><span className="page-eyebrow">DISPATCH DETAILS</span><h2>{selected.dispatchNumber}</h2><p>{selected.productionOrder.productionNumber} · {selected.productionOrder.title}</p></div><button className="icon-button" type="button" onClick={() => setSelected(null)}><X size={21} /></button></div>
      <div className="dispatch-detail-grid"><span><PackageCheck />Status<strong>{statusLabels[selected.status]}</strong></span><span><Truck />Transport<strong>{transportLabels[selected.transportMode]}</strong></span><span><Send />Tracking<strong>{selected.trackingNumber || "Not provided"}</strong></span><span><Clock3 />Expected delivery<strong>{displayDate(selected.expectedDeliveryDate)}</strong></span><span><MapPin />Destination<strong>{selected.destination}</strong></span><span><PackageCheck />Packages / Weight<strong>{selected.packageCount} packages · {selected.totalWeight ? `${selected.totalWeight} kg` : "Weight not set"}</strong></span></div>
    </div></div>}
  </section>;
}
