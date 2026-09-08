import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  Eye,
  PackagePlus,
  Plus,
  Search,
  Warehouse,
  X,
} from "lucide-react";
import {
  createInventoryItem,
  createStockMovement,
  getInventoryItem,
  getInventoryItems,
} from "../services/inventory.service";
import type {
  CreateInventoryItemPayload,
  CreateStockMovementPayload,
  InventoryItem,
  InventoryItemType,
  StockMovementType,
} from "../types/inventory";

const itemTypeLabels: Record<InventoryItemType, string> = {
  RAW_MATERIAL: "Raw material",
  COMPONENT: "Component",
  CONSUMABLE: "Consumable",
  FINISHED_GOOD: "Finished good",
};

const movementLabels: Record<StockMovementType, string> = {
  RECEIPT: "Stock receipt",
  ISSUE: "Stock issue",
  ADJUSTMENT_IN: "Adjustment in",
  ADJUSTMENT_OUT: "Adjustment out",
  RETURN_IN: "Return in",
  RETURN_OUT: "Return out",
};

const inboundMovements: StockMovementType[] = [
  "RECEIPT",
  "ADJUSTMENT_IN",
  "RETURN_IN",
];

const money = (value: number | string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const dateTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const initialItemForm = {
  name: "",
  description: "",
  itemType: "RAW_MATERIAL" as InventoryItemType,
  category: "",
  unit: "Nos",
  openingStock: "0",
  reorderLevel: "0",
  unitCost: "0",
  location: "",
};

const initialMovementForm = {
  movementType: "RECEIPT" as StockMovementType,
  quantity: "",
  unitCost: "",
  referenceType: "PURCHASE",
  referenceNumber: "",
  notes: "",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showItemForm, setShowItemForm] = useState(false);
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [itemForm, setItemForm] = useState(initialItemForm);
  const [movementForm, setMovementForm] = useState(initialMovementForm);

  const loadItems = useCallback(async (searchValue = "") => {
    try {
      setLoading(true);
      setError("");
      setItems(await getInventoryItems(searchValue));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load inventory items"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const summary = useMemo(() => {
    const activeItems = items.filter((item) => item.isActive);
    return {
      total: activeItems.length,
      lowStock: activeItems.filter(
        (item) => Number(item.currentStock) <= Number(item.reorderLevel)
      ).length,
      quantity: activeItems.reduce(
        (total, item) => total + Number(item.currentStock),
        0
      ),
      value: activeItems.reduce(
        (total, item) =>
          total + Number(item.currentStock) * Number(item.unitCost),
        0
      ),
    };
  }, [items]);

  const handleCreateItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      const payload: CreateInventoryItemPayload = {
        name: itemForm.name,
        itemType: itemForm.itemType,
        unit: itemForm.unit,
        openingStock: Number(itemForm.openingStock),
        reorderLevel: Number(itemForm.reorderLevel),
        unitCost: Number(itemForm.unitCost),
        ...(itemForm.description ? { description: itemForm.description } : {}),
        ...(itemForm.category ? { category: itemForm.category } : {}),
        ...(itemForm.location ? { location: itemForm.location } : {}),
      };
      await createInventoryItem(payload);
      setShowItemForm(false);
      setItemForm(initialItemForm);
      await loadItems(search);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to create inventory item"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleMovement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!movementItem) return;

    try {
      setSaving(true);
      setError("");
      const payload: CreateStockMovementPayload = {
        movementType: movementForm.movementType,
        quantity: Number(movementForm.quantity),
        ...(movementForm.unitCost
          ? { unitCost: Number(movementForm.unitCost) }
          : {}),
        ...(movementForm.referenceType
          ? { referenceType: movementForm.referenceType }
          : {}),
        ...(movementForm.referenceNumber
          ? { referenceNumber: movementForm.referenceNumber }
          : {}),
        ...(movementForm.notes ? { notes: movementForm.notes } : {}),
      };
      await createStockMovement(movementItem.id, payload);
      setMovementItem(null);
      setMovementForm(initialMovementForm);
      await loadItems(search);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to record stock movement"
      );
    } finally {
      setSaving(false);
    }
  };

  const openDetails = async (item: InventoryItem) => {
    try {
      setError("");
      setSelected(await getInventoryItem(item.id));
    } catch (detailError) {
      setError(
        detailError instanceof Error
          ? detailError.message
          : "Unable to load item history"
      );
    }
  };

  const isLowStock = (item: InventoryItem) =>
    Number(item.currentStock) <= Number(item.reorderLevel);

  return (
    <section className="module-page inventory-page">
      <div className="module-heading">
        <div>
          <span className="page-eyebrow">MATERIAL CONTROL</span>
          <h1>Inventory</h1>
          <p>Control material balances, valuation, receipts, issues and returns.</p>
        </div>
        <button
          className="primary-action"
          type="button"
          onClick={() => {
            setItemForm(initialItemForm);
            setError("");
            setShowItemForm(true);
          }}
        >
          <Plus size={19} /> New item
        </button>
      </div>

      <div className="inventory-summary-grid">
        <article><Boxes size={24} /><div><strong>{summary.total}</strong><span>Active items</span></div></article>
        <article><AlertTriangle size={24} /><div><strong>{summary.lowStock}</strong><span>Low stock items</span></div></article>
        <article><Warehouse size={24} /><div><strong>{summary.quantity.toLocaleString("en-IN")}</strong><span>Total quantity</span></div></article>
        <article><PackagePlus size={24} /><div><strong>{money(summary.value)}</strong><span>Stock value</span></div></article>
      </div>

      <div className="directory-card">
        <div className="directory-header">
          <div><h2>Item register</h2><p>{items.length} records shown</p></div>
          <form className="directory-search" onSubmit={(event) => { event.preventDefault(); void loadItems(search); }}>
            <Search size={19} />
            <input value={search} placeholder="Search code, item, category or location..." onChange={(event) => setSearch(event.target.value)} />
            <button type="submit">Search</button>
          </form>
        </div>

        {error && !showItemForm && !movementItem && <div className="page-error">{error}</div>}
        {loading ? (
          <div className="empty-state"><div className="loading-spinner" /><h3>Loading inventory...</h3></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><span className="empty-state-icon"><Boxes size={34} /></span><h3>No inventory items found</h3><p>Create the first material or component item.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table inventory-table">
              <thead><tr><th>Item</th><th>Type / Category</th><th>Stock</th><th>Reorder level</th><th>Unit cost</th><th>Location</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr className={isLowStock(item) ? "low-stock-row" : ""} key={item.id}>
                    <td><div className="lead-title-cell"><strong>{item.name}</strong><span>{item.itemCode}</span></div></td>
                    <td><div className="lead-title-cell"><strong>{itemTypeLabels[item.itemType]}</strong><span>{item.category || "Uncategorized"}</span></div></td>
                    <td><strong className={isLowStock(item) ? "stock-low" : "stock-ok"}>{Number(item.currentStock).toLocaleString("en-IN")} {item.unit}</strong></td>
                    <td>{Number(item.reorderLevel).toLocaleString("en-IN")} {item.unit}</td>
                    <td>{money(item.unitCost)}</td>
                    <td>{item.location || "Not assigned"}</td>
                    <td><div className="inventory-row-actions"><button className="row-action-button" type="button" title="View stock history" onClick={() => void openDetails(item)}><Eye size={17} /></button><button className="row-action-button stock-action" type="button" title="Record stock movement" onClick={() => { setMovementItem(item); setMovementForm(initialMovementForm); setError(""); }}><ArrowLeftRight size={17} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showItemForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && setShowItemForm(false)}>
          <div className="inventory-form-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header"><div><span className="page-eyebrow">NEW STOCK ITEM</span><h2>Create inventory item</h2><p>Add identification, valuation and opening-stock information.</p></div><button className="icon-button" type="button" onClick={() => setShowItemForm(false)}><X size={21} /></button></div>
            <form onSubmit={handleCreateItem}>
              {error && <div className="page-error">{error}</div>}
              <div className="inventory-form-grid">
                <label className="full-field">Item name<input required minLength={2} value={itemForm.name} placeholder="Example: Siemens S7-1200 PLC" onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))} /></label>
                <label>Item type<select value={itemForm.itemType} onChange={(event) => setItemForm((current) => ({ ...current, itemType: event.target.value as InventoryItemType }))}>{Object.entries(itemTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label>Category<input value={itemForm.category} placeholder="Automation" onChange={(event) => setItemForm((current) => ({ ...current, category: event.target.value }))} /></label>
                <label>Unit<input required value={itemForm.unit} placeholder="Nos, Kg, Mtr..." onChange={(event) => setItemForm((current) => ({ ...current, unit: event.target.value }))} /></label>
                <label>Opening stock<input required type="number" min="0" step="0.001" value={itemForm.openingStock} onChange={(event) => setItemForm((current) => ({ ...current, openingStock: event.target.value }))} /></label>
                <label>Reorder level<input required type="number" min="0" step="0.001" value={itemForm.reorderLevel} onChange={(event) => setItemForm((current) => ({ ...current, reorderLevel: event.target.value }))} /></label>
                <label>Unit cost<input required type="number" min="0" step="0.01" value={itemForm.unitCost} onChange={(event) => setItemForm((current) => ({ ...current, unitCost: event.target.value }))} /></label>
                <label>Storage location<input value={itemForm.location} placeholder="Rack A-01" onChange={(event) => setItemForm((current) => ({ ...current, location: event.target.value }))} /></label>
                <label className="full-field">Description<textarea rows={3} value={itemForm.description} placeholder="Technical specification or purchasing description" onChange={(event) => setItemForm((current) => ({ ...current, description: event.target.value }))} /></label>
              </div>
              <div className="modal-actions"><button className="secondary-action" type="button" onClick={() => setShowItemForm(false)}>Cancel</button><button className="primary-action" type="submit" disabled={saving}>{saving ? "Creating..." : "Create item"}</button></div>
            </form>
          </div>
        </div>
      )}

      {movementItem && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && setMovementItem(null)}>
          <div className="stock-movement-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header"><div><span className="page-eyebrow">STOCK TRANSACTION</span><h2>{movementItem.name}</h2><p>Available: {Number(movementItem.currentStock).toLocaleString("en-IN")} {movementItem.unit}</p></div><button className="icon-button" type="button" onClick={() => setMovementItem(null)}><X size={21} /></button></div>
            <form onSubmit={handleMovement}>
              {error && <div className="page-error">{error}</div>}
              <div className="movement-form-grid">
                <label>Movement type<select value={movementForm.movementType} onChange={(event) => setMovementForm((current) => ({ ...current, movementType: event.target.value as StockMovementType }))}>{Object.entries(movementLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label>Quantity<input required type="number" min="0.001" step="0.001" value={movementForm.quantity} onChange={(event) => setMovementForm((current) => ({ ...current, quantity: event.target.value }))} /></label>
                <label>Unit cost (optional)<input type="number" min="0" step="0.01" value={movementForm.unitCost} onChange={(event) => setMovementForm((current) => ({ ...current, unitCost: event.target.value }))} /></label>
                <label>Reference type<input value={movementForm.referenceType} placeholder="PURCHASE, JOB, RETURN..." onChange={(event) => setMovementForm((current) => ({ ...current, referenceType: event.target.value }))} /></label>
                <label className="full-field">Reference number<input value={movementForm.referenceNumber} placeholder="PO-2026-001 or JOB-001" onChange={(event) => setMovementForm((current) => ({ ...current, referenceNumber: event.target.value }))} /></label>
                <label className="full-field">Notes<textarea rows={3} value={movementForm.notes} onChange={(event) => setMovementForm((current) => ({ ...current, notes: event.target.value }))} /></label>
              </div>
              <div className={`movement-impact ${inboundMovements.includes(movementForm.movementType) ? "inbound" : "outbound"}`}><span>Projected stock</span><strong>{Math.max(0, Number(movementItem.currentStock) + (inboundMovements.includes(movementForm.movementType) ? 1 : -1) * Number(movementForm.quantity || 0)).toLocaleString("en-IN")} {movementItem.unit}</strong></div>
              <div className="modal-actions"><button className="secondary-action" type="button" onClick={() => setMovementItem(null)}>Cancel</button><button className="primary-action" type="submit" disabled={saving}>{saving ? "Recording..." : "Record movement"}</button></div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
          <div className="inventory-detail-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header"><div><span className="page-eyebrow">ITEM HISTORY</span><h2>{selected.name}</h2><p>{selected.itemCode} · {itemTypeLabels[selected.itemType]}</p></div><button className="icon-button" type="button" onClick={() => setSelected(null)}><X size={21} /></button></div>
            <div className="inventory-detail-meta"><span>Current stock<strong>{Number(selected.currentStock).toLocaleString("en-IN")} {selected.unit}</strong></span><span>Reorder level<strong>{Number(selected.reorderLevel).toLocaleString("en-IN")} {selected.unit}</strong></span><span>Unit cost<strong>{money(selected.unitCost)}</strong></span><span>Location<strong>{selected.location || "Not assigned"}</strong></span></div>
            <div className="movement-history"><h3>Recent movements</h3>{selected.movements?.length ? selected.movements.map((movement) => <div className="movement-history-row" key={movement.id}><span className={inboundMovements.includes(movement.movementType) ? "movement-in" : "movement-out"}>{movementLabels[movement.movementType]}</span><strong>{inboundMovements.includes(movement.movementType) ? "+" : "-"}{Number(movement.quantity).toLocaleString("en-IN")} {selected.unit}</strong><small>Balance: {Number(movement.balanceAfter).toLocaleString("en-IN")} {selected.unit}</small><small>{movement.referenceNumber || movement.referenceType || "No reference"}</small><time>{dateTime(movement.createdAt)}</time></div>) : <div className="history-empty">No stock movements recorded.</div>}</div>
          </div>
        </div>
      )}
    </section>
  );
}
