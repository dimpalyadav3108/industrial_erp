import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Calculator,
  FileText,
  Send,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../services/auth.service";
import { getCustomers } from "../services/customer.service";
import { getEstimates } from "../services/estimate.service";
import { getLeads } from "../services/lead.service";
import { getQuotations } from "../services/quotation.service";
import type { Customer } from "../types/customer";
import type { Estimate } from "../types/estimate";
import type { Lead } from "../types/lead";
import type { Quotation } from "../types/quotation";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export function DashboardPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [customerRecords, leadRecords, estimateRecords, quotationRecords] =
        await Promise.all([
          getCustomers(),
          getLeads(),
          getEstimates(),
          getQuotations(),
        ]);

      setCustomers(customerRecords.data);
      setLeads(leadRecords);
      setEstimates(estimateRecords);
      setQuotations(quotationRecords);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load dashboard information"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const metrics = useMemo(() => {
    const activeLeads = leads.filter(
      (lead) => !["WON", "LOST"].includes(lead.status)
    ).length;
    const openQuotations = quotations.filter((quotation) =>
      ["DRAFT", "SENT"].includes(quotation.status)
    ).length;
    const wonLeads = leads.filter((lead) => lead.status === "WON").length;
    const quotedValue = quotations.reduce(
      (total, quotation) => total + Number(quotation.totalAmount),
      0
    );

    return {
      activeLeads,
      openQuotations,
      wonLeads,
      quotedValue,
      activeCustomers: customers.filter(
        (customer) => customer.status === "ACTIVE"
      ).length,
      pendingEstimates: estimates.filter(
        (estimate) => estimate.status === "IN_REVIEW"
      ).length,
      draftQuotations: quotations.filter(
        (quotation) => quotation.status === "DRAFT"
      ).length,
      sentQuotations: quotations.filter(
        (quotation) => quotation.status === "SENT"
      ).length,
      acceptedQuotations: quotations.filter((quotation) =>
        ["ACCEPTED", "CONVERTED"].includes(quotation.status)
      ).length,
    };
  }, [customers, estimates, leads, quotations]);

  const pipeline = useMemo(
    () => [
      { label: "New", value: leads.filter((lead) => lead.status === "NEW").length },
      { label: "Qualified", value: leads.filter((lead) => lead.status === "QUALIFIED").length },
      { label: "Estimation", value: leads.filter((lead) => ["TECHNICAL_REVIEW", "ESTIMATION"].includes(lead.status)).length },
      { label: "Quoted", value: leads.filter((lead) => lead.status === "QUOTATION_SENT").length },
      { label: "Won", value: leads.filter((lead) => lead.status === "WON").length },
      { label: "Lost", value: leads.filter((lead) => lead.status === "LOST").length },
    ],
    [leads]
  );

  const maxPipeline = Math.max(1, ...pipeline.map((item) => item.value));

  return (
    <section className="dashboard-content live-dashboard">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Live operations overview</span>
          <h1>Good day, {user?.firstName || "Administrator"}</h1>
          <p>Here is the current position of your commercial operations.</p>
        </div>

        <button
          className="primary-action"
          type="button"
          onClick={() => navigate("/leads")}
        >
          Create new enquiry
        </button>
      </div>

      {error && <div className="page-error dashboard-error">{error}</div>}

      <div className="metric-grid">
        <article className="metric-card">
          <span>Active enquiries</span>
          <strong>{loading ? "—" : metrics.activeLeads}</strong>
          <small>{metrics.pendingEstimates} estimates awaiting review</small>
        </article>

        <article className="metric-card">
          <span>Open quotations</span>
          <strong>{loading ? "—" : metrics.openQuotations}</strong>
          <small>{money(metrics.quotedValue)} total quoted value</small>
        </article>

        <article className="metric-card">
          <span>Total customers</span>
          <strong>{loading ? "—" : customers.length}</strong>
          <small>{metrics.activeCustomers} active accounts</small>
        </article>

        <article className="metric-card">
          <span>Opportunities won</span>
          <strong>{loading ? "—" : metrics.wonLeads}</strong>
          <small>{metrics.acceptedQuotations} accepted quotations</small>
        </article>
      </div>

      <div className="dashboard-grid">
        <article className="content-card overview-card">
          <div className="card-heading">
            <div>
              <span>Current pipeline</span>
              <h2>Enquiries by commercial stage</h2>
            </div>
            <BarChart3 size={22} />
          </div>

          <div className="live-pipeline-chart">
            {pipeline.map((item) => (
              <div className="pipeline-column" key={item.label}>
                <strong>{item.value}</strong>
                <div>
                  <span
                    style={{
                      height: `${Math.max(8, (item.value / maxPipeline) * 100)}%`,
                    }}
                  />
                </div>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card">
          <div className="card-heading">
            <div>
              <span>Attention required</span>
              <h2>Commercial actions</h2>
            </div>
          </div>

          <ul className="action-list">
            <li>
              <Calculator size={18} />
              <div>
                <strong>{metrics.pendingEstimates} estimates awaiting review</strong>
                <span>Estimation department</span>
              </div>
            </li>

            <li>
              <FileText size={18} />
              <div>
                <strong>{metrics.draftQuotations} quotations in draft</strong>
                <span>Commercial department</span>
              </div>
            </li>

            <li>
              <Send size={18} />
              <div>
                <strong>{metrics.sentQuotations} quotations awaiting response</strong>
                <span>Sales follow-up</span>
              </div>
            </li>
          </ul>
        </article>
      </div>

      <div className="dashboard-quick-links">
        <button type="button" onClick={() => navigate("/customers")}><Users size={18} /> Customers</button>
        <button type="button" onClick={() => navigate("/leads")}><Target size={18} /> Leads</button>
        <button type="button" onClick={() => navigate("/estimation")}><Calculator size={18} /> Estimates</button>
        <button type="button" onClick={() => navigate("/quotations")}><Trophy size={18} /> Quotations</button>
      </div>
    </section>
  );
}

