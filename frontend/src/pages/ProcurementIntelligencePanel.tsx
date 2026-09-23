import { useMemo, useState } from "react";
import { BarChart3, CheckCircle2, IndianRupee, PackageCheck, Timer, Users } from "lucide-react";

import type {
  GoodsReceiptNote,
  ProcurementRfq,
  PurchaseOrder,
  Vendor,
  VendorQuotation,
} from "../types/procurement";

type Props = {
  vendors: Vendor[];
  rfqs: ProcurementRfq[];
  quotations: VendorQuotation[];
  orders: PurchaseOrder[];
  grns: GoodsReceiptNote[];
};

const n = (value: unknown) => Number(value ?? 0);

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const pct = (value: number) => `${value.toFixed(1)}%`;

export default function ProcurementIntelligencePanel({
  vendors,
  rfqs,
  quotations,
  orders,
  grns,
}: Props) {
  const [open, setOpen] = useState(true);
  const [selectedRfqId, setSelectedRfqId] = useState("");

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "CANCELLED"),
    [orders]
  );

  const totalSpend = useMemo(
    () => activeOrders.reduce((sum, o) => sum + n(o.totalAmount), 0),
    [activeOrders]
  );

  const receiptQuality = useMemo(() => {
    let received = 0;
    let accepted = 0;
    let rejected = 0;
    for (const grn of grns) {
      for (const item of grn.items ?? []) {
        received += n(item.receivedQuantity);
        accepted += n(item.acceptedQuantity);
        rejected += n(item.rejectedQuantity);
      }
    }
    return {
      received,
      accepted,
      rejected,
      acceptance: received > 0 ? (accepted / received) * 100 : 0,
    };
  }, [grns]);

  const openPoCount = activeOrders.filter(
    (o) => !["RECEIVED", "CLOSED"].includes(o.status)
  ).length;

  const postedGrns = grns.filter((g) => Boolean(g.postedAt)).length;

  const vendorRows = useMemo(() => {
    return vendors
      .map((vendor) => {
        const vendorOrders = activeOrders.filter((o) => o.vendorId === vendor.id);
        const vendorGrns = grns.filter((g) => g.vendorId === vendor.id);
        const vendorQuotes = quotations.filter((q) => q.vendorId === vendor.id);

        let received = 0;
        let accepted = 0;
        for (const grn of vendorGrns) {
          for (const item of grn.items ?? []) {
            received += n(item.receivedQuantity);
            accepted += n(item.acceptedQuantity);
          }
        }

        const deliveryValues = vendorQuotes
          .map((q) => q.deliveryDays)
          .filter((v): v is number => typeof v === "number");

        return {
          id: vendor.id,
          code: vendor.vendorCode,
          name: vendor.name,
          status: vendor.status,
          rating: vendor.rating == null ? null : n(vendor.rating),
          poCount: vendorOrders.length,
          spend: vendorOrders.reduce((sum, o) => sum + n(o.totalAmount), 0),
          grnCount: vendorGrns.length,
          acceptance: received > 0 ? (accepted / received) * 100 : null,
          avgDelivery:
            deliveryValues.length > 0
              ? deliveryValues.reduce((a, b) => a + b, 0) / deliveryValues.length
              : null,
        };
      })
      .sort((a, b) => b.spend - a.spend);
  }, [vendors, activeOrders, grns, quotations]);

  const comparableRfqs = useMemo(
    () =>
      rfqs.filter(
        (rfq) =>
          quotations.filter((q) => q.rfqId === rfq.id).length >= 2
      ),
    [rfqs, quotations]
  );

  const selectedRfq =
    comparableRfqs.find((r) => r.id === selectedRfqId) ?? comparableRfqs[0];

  const comparison = useMemo(() => {
    if (!selectedRfq) return [];
    return quotations
      .filter((q) => q.rfqId === selectedRfq.id)
      .map((q) => ({
        id: q.id,
        quotationNumber: q.quotationNumber,
        vendor: q.vendor?.name ?? vendors.find((v) => v.id === q.vendorId)?.name ?? "Vendor",
        total: n(q.totalAmount),
        freight: n(q.freightAmount),
        deliveryDays: q.deliveryDays,
        status: q.status,
        paymentTerms: q.paymentTerms,
      }))
      .sort((a, b) => a.total - b.total);
  }, [selectedRfq, quotations, vendors]);

  const lowestPrice = comparison.length
    ? Math.min(...comparison.map((q) => q.total))
    : null;
  const deliveryNumbers = comparison
    .map((q) => q.deliveryDays)
    .filter((v): v is number => typeof v === "number");
  const shortestDelivery = deliveryNumbers.length
    ? Math.min(...deliveryNumbers)
    : null;

  return (
    <section className="procurement-intelligence">
      <div className="pi-header">
        <div>
          <span className="eyebrow">PROCUREMENT INTELLIGENCE</span>
          <h2>Vendor Performance & Quote Comparison</h2>
          <p>Live purchasing, receipt-quality and supplier comparison metrics from your ERP data.</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => setOpen((v) => !v)}>
          <BarChart3 size={17} />
          {open ? "Hide Analytics" : "Show Analytics"}
        </button>
      </div>

      {open && (
        <>
          <div className="pi-kpis">
            <Metric icon={<IndianRupee size={18} />} label="PO Value" value={money(totalSpend)} />
            <Metric icon={<Timer size={18} />} label="Open POs" value={String(openPoCount)} />
            <Metric icon={<CheckCircle2 size={18} />} label="Receipt Acceptance" value={pct(receiptQuality.acceptance)} />
            <Metric icon={<PackageCheck size={18} />} label="Posted GRNs" value={`${postedGrns}/${grns.length}`} />
            <Metric icon={<Users size={18} />} label="Active Vendors" value={String(vendors.filter((v) => v.status === "ACTIVE").length)} />
          </div>

          <div className="pi-grid">
            <div className="pi-card">
              <div className="pi-card-title">
                <div>
                  <h3>Vendor scorecard</h3>
                  <p>Commercial activity and incoming-material acceptance.</p>
                </div>
              </div>
              <div className="pi-table-wrap">
                <table className="pi-table">
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>POs</th>
                      <th>PO Value</th>
                      <th>GRNs</th>
                      <th>Acceptance</th>
                      <th>Avg. Lead</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorRows.map((v) => (
                      <tr key={v.id}>
                        <td><strong>{v.name}</strong><small>{v.code}</small></td>
                        <td>{v.poCount}</td>
                        <td>{money(v.spend)}</td>
                        <td>{v.grnCount}</td>
                        <td>{v.acceptance == null ? "—" : pct(v.acceptance)}</td>
                        <td>{v.avgDelivery == null ? "—" : `${v.avgDelivery.toFixed(0)} days`}</td>
                        <td>{v.rating == null ? "—" : `${v.rating.toFixed(1)}/5`}</td>
                      </tr>
                    ))}
                    {!vendorRows.length && (
                      <tr><td colSpan={7} className="pi-empty">No vendor data yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pi-card">
              <div className="pi-card-title pi-compare-title">
                <div>
                  <h3>RFQ quotation comparison</h3>
                  <p>Compare supplier price and quoted delivery time.</p>
                </div>
                <select
                  value={selectedRfq?.id ?? ""}
                  onChange={(e) => setSelectedRfqId(e.target.value)}
                  disabled={!comparableRfqs.length}
                >
                  {!comparableRfqs.length && <option value="">No comparable RFQ</option>}
                  {comparableRfqs.map((r) => (
                    <option key={r.id} value={r.id}>{r.rfqNumber}</option>
                  ))}
                </select>
              </div>

              {comparison.length ? (
                <div className="pi-quote-list">
                  {comparison.map((q) => (
                    <div className="pi-quote" key={q.id}>
                      <div>
                        <strong>{q.vendor}</strong>
                        <small>{q.quotationNumber} · {q.status.replaceAll("_", " ")}</small>
                      </div>
                      <div className="pi-quote-values">
                        <span>
                          <small>Total</small>
                          <strong>{money(q.total)}</strong>
                          {q.total === lowestPrice && <em>Lowest price</em>}
                        </span>
                        <span>
                          <small>Delivery</small>
                          <strong>{q.deliveryDays == null ? "—" : `${q.deliveryDays} days`}</strong>
                          {q.deliveryDays != null && q.deliveryDays === shortestDelivery && <em>Shortest lead</em>}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pi-empty">
                  Add at least two quotations to the same RFQ to compare suppliers.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="pi-metric">
      <span className="pi-metric-icon">{icon}</span>
      <span><small>{label}</small><strong>{value}</strong></span>
    </div>
  );
}
