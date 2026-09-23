import { useEffect, useState } from "react";
import { Boxes, MapPin, PackageCheck, RotateCcw, ShieldCheck } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` });

type Row = Record<string, any>;

export default function InventoryStoresPanel() {
  const [locations, setLocations] = useState<Row[]>([]);
  const [trace, setTrace] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    const [l, t] = await Promise.all([
      fetch(`${API}/inventory/stores/locations`, { headers: auth() }).then(r => r.json()),
      fetch(`${API}/inventory/stores/traceability?search=${encodeURIComponent(search)}`, { headers: auth() }).then(r => r.json()),
    ]);
    setLocations(l.data || []);
    setTrace(t.data || []);
  };

  useEffect(() => { void load(); }, []);

  return <div className="directory-card" style={{ marginTop: 24 }}>
    <div className="directory-header">
      <div><h2><Boxes size={20} style={{ verticalAlign: "middle" }} /> Inventory & Stores Control</h2><p>Warehouses, WIP, finished goods, traceability, reservations and returns</p></div>
      <div className="directory-search"><input value={search} placeholder="Search batch / serial / boiler serial..." onChange={e => setSearch(e.target.value)} /><button type="button" onClick={() => void load()}>Search</button></div>
    </div>
    {message && <div className="page-success">{message}</div>}
    <div className="inventory-summary-grid">
      {locations.map(l => <article key={l.id}><MapPin size={20} /><div><strong>{l.name}</strong><span>{l.code}</span></div></article>)}
    </div>
    <div style={{ overflowX: "auto", marginTop: 18 }}>
      <table className="data-table"><thead><tr><th>Item</th><th>Type</th><th>Batch/Lot</th><th>Serial</th><th>Boiler Serial</th><th>Location</th><th>Qty</th><th>Reserved</th><th>Status</th></tr></thead>
      <tbody>{trace.map(r => <tr key={r.id}><td>{r.itemCode} — {r.name}</td><td>{r.stockType}</td><td>{r.batchNumber || r.lotNumber || "—"}</td><td>{r.serialNumber || "—"}</td><td>{r.boilerSerialNumber || "—"}</td><td>{r.locationName || "Unassigned"}</td><td>{r.quantity}</td><td>{r.reservedQuantity}</td><td>{r.status}</td></tr>)}</tbody></table>
      {!trace.length && <div className="empty-state">No traceable stock records yet. Use the store APIs to record GRN stock, WIP, finished goods or serialised boilers.</div>}
    </div>
    <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
      <button className="secondary-action" type="button" onClick={() => setMessage("GRN → Incoming QC → Store flow is supported through Goods Receipt Notes and traceability records.")}><PackageCheck size={17}/> GRN → QC → Store</button>
      <button className="secondary-action" type="button" onClick={() => setMessage("Production Material Issue uses the existing inventory stock movement flow.")}><ShieldCheck size={17}/> Production Issue</button>
      <button className="secondary-action" type="button" onClick={() => setMessage("Finished Goods can be tracked in FG Boiler Yard / FG Heater Yard using stockType and location.")}><Boxes size={17}/> Finished Goods</button>
      <button className="secondary-action" type="button" onClick={() => setMessage("Material Return endpoint is available at /inventory/stores/returns.")}><RotateCcw size={17}/> Material Return</button>
    </div>
  </div>;
}
