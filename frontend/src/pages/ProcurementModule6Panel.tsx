import { useState } from "react";
import { createMaterialPlan, createVendorPortalDocument, createVendorRating } from "../services/procurement.service";
import type { Vendor } from "../types/procurement";

export default function ProcurementModule6Panel({ vendors }: { vendors: Vendor[] }) {
  const [vendorId, setVendorId] = useState(vendors[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [planTitle, setPlanTitle] = useState("");
  const [shortageValue, setShortageValue] = useState("0");
  const [docType, setDocType] = useState("QUALITY_CERTIFICATE");
  const [fileName, setFileName] = useState("");
  const [scores, setScores] = useState({ qualityScore: "90", deliveryScore: "90", priceScore: "90", serviceScore: "90" });

  async function savePlan() {
    if (!planTitle.trim()) return setMessage("Enter an MRP plan title.");
    await createMaterialPlan({ title: planTitle.trim(), shortageValue: Number(shortageValue || 0) });
    setPlanTitle(""); setShortageValue("0"); setMessage("MRP material plan created successfully.");
  }

  async function uploadDocument() {
    if (!vendorId || !fileName.trim()) return setMessage("Select vendor and enter a file name.");
    await createVendorPortalDocument(vendorId, { documentType: docType, fileName: fileName.trim() });
    setFileName(""); setMessage("Vendor portal document recorded successfully.");
  }

  async function rateVendor() {
    if (!vendorId) return setMessage("Select a vendor.");
    await createVendorRating(vendorId, {
      qualityScore: Number(scores.qualityScore), deliveryScore: Number(scores.deliveryScore),
      priceScore: Number(scores.priceScore), serviceScore: Number(scores.serviceScore),
    });
    setMessage("Vendor rating saved and vendor score updated.");
  }

  return <section className="card" style={{ marginTop: 18 }}>
    <div style={{ padding: 18 }}>
      <span className="eyebrow">MODULE 6</span>
      <h2 style={{ margin: "6px 0" }}>MRP, Vendor Portal & Rating Engine</h2>
      <p style={{ marginTop: 0 }}>Material shortage planning, vendor document uploads and supplier performance scoring.</p>
      {message && <div className="procurement-alert success" style={{ marginBottom: 14 }}>{message}</div>}
      <div className="form-grid">
        <label><span>MRP Plan / Material Requirement</span><input value={planTitle} onChange={e => setPlanTitle(e.target.value)} placeholder="e.g. Boiler SO-1001 material plan" /></label>
        <label><span>Material Shortage Value</span><input type="number" min="0" value={shortageValue} onChange={e => setShortageValue(e.target.value)} /></label>
        <div><button className="primary-button" type="button" onClick={() => void savePlan()}>Create MRP Plan</button></div>
      </div>
      <hr style={{ margin: "22px 0" }} />
      <div className="form-grid">
        <label><span>Vendor</span><select value={vendorId} onChange={e => setVendorId(e.target.value)}><option value="">Select vendor</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.vendorCode} — {v.name}</option>)}</select></label>
        <label><span>Portal Document Type</span><select value={docType} onChange={e => setDocType(e.target.value)}><option value="INVOICE">Invoice</option><option value="DISPATCH_UPDATE">Dispatch Update</option><option value="QUALITY_CERTIFICATE">Quality Certificate</option><option value="OTHER">Other</option></select></label>
        <label><span>File Name / Reference</span><input value={fileName} onChange={e => setFileName(e.target.value)} placeholder="certificate.pdf" /></label>
        <div><button className="secondary-button" type="button" onClick={() => void uploadDocument()}>Vendor Portal Upload</button></div>
      </div>
      <hr style={{ margin: "22px 0" }} />
      <div className="form-grid">
        {(["qualityScore", "deliveryScore", "priceScore", "serviceScore"] as const).map(key => <label key={key}><span>{key.replace("Score", " Score")}</span><input type="number" min="0" max="100" value={scores[key]} onChange={e => setScores(s => ({ ...s, [key]: e.target.value }))} /></label>)}
        <div><button className="secondary-button" type="button" onClick={() => void rateVendor()}>Save Vendor Rating</button></div>
      </div>
      <div style={{ marginTop: 18, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["Plate Suppliers", "Tube Suppliers", "Valve Suppliers", "Burner Suppliers", "Fabricators", "Transport Vendors", "PR Approval", "RFQ", "Vendor Comparison", "Purchase Order", "Material Receipt", "QC → Store Entry"] as const).map(item => <span key={item} className="status-badge">{item}</span>)}
      </div>
    </div>
  </section>;
}
