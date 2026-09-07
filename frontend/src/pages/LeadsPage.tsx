import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  Plus,
  Search,
  Target,
  X,
} from "lucide-react";
import { createLead, getLeads } from "../services/lead.service";
import { getCustomers } from "../services/customer.service";
import type { Customer } from "../types/customer";
import type {
  CreateLeadPayload,
  Lead,
  LeadPriority,
  LeadStatus,
} from "../types/lead";

interface LeadFormState {
  title: string;
  customerId: string;
  description: string;
  source: string;
  priority: LeadPriority;
  status: LeadStatus;
  estimatedValue: string;
  expectedCloseDate: string;
}

const initialForm: LeadFormState = {
  title: "",
  customerId: "",
  description: "",
  source: "",
  priority: "MEDIUM",
  status: "NEW",
  estimatedValue: "",
  expectedCloseDate: "",
};

const statusLabels: Record<LeadStatus, string> = {
  NEW: "New",
  QUALIFIED: "Qualified",
  TECHNICAL_REVIEW: "Technical review",
  ESTIMATION: "Estimation",
  QUOTATION_SENT: "Quotation sent",
  WON: "Won",
  LOST: "Lost",
  ON_HOLD: "On hold",
};

const formatCurrency = (value: string | null) => {
  if (!value) return "Not specified";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const formatDate = (value: string | null) => {
  if (!value) return "Not specified";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<LeadFormState>(initialForm);

  const loadData = useCallback(async (searchValue = "") => {
    try {
      setLoading(true);
      setError("");

      const [leadRecords, customerRecords] = await Promise.all([
        getLeads(searchValue),
        getCustomers(),
      ]);

      setLeads(leadRecords);
      setCustomers(customerRecords.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load sales enquiries"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const statistics = useMemo(() => {
    const activeStatuses: LeadStatus[] = [
      "NEW",
      "QUALIFIED",
      "TECHNICAL_REVIEW",
      "ESTIMATION",
      "QUOTATION_SENT",
    ];

    const active = leads.filter((lead) =>
      activeStatuses.includes(lead.status)
    ).length;

    const won = leads.filter((lead) => lead.status === "WON").length;

    const pipelineValue = leads
      .filter((lead) => activeStatuses.includes(lead.status))
      .reduce(
        (total, lead) => total + Number(lead.estimatedValue ?? 0),
        0
      );

    return {
      total: leads.length,
      active,
      won,
      pipelineValue,
    };
  }, [leads]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadData(search);
  };

  const handleCreateLead = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!form.customerId) {
      setError("Please select a customer");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: CreateLeadPayload = {
        title: form.title,
        customerId: form.customerId,
        priority: form.priority,
        status: form.status,
        ...(form.description
          ? { description: form.description }
          : {}),
        ...(form.source ? { source: form.source } : {}),
        ...(form.estimatedValue
          ? { estimatedValue: Number(form.estimatedValue) }
          : {}),
        ...(form.expectedCloseDate
          ? { expectedCloseDate: form.expectedCloseDate }
          : {}),
      };

      await createLead(payload);

      setForm(initialForm);
      setShowModal(false);
      await loadData(search);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create lead"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="module-page leads-page">
      <div className="module-heading">
        <div>
          <span className="page-eyebrow">SALES PIPELINE</span>
          <h1>Leads & Enquiries</h1>
          <p>
            Track opportunities from the first enquiry through quotation
            and conversion.
          </p>
        </div>

        <button
          className="primary-action"
          type="button"
          onClick={() => {
            setError("");
            setShowModal(true);
          }}
        >
          <Plus size={20} />
          Add enquiry
        </button>
      </div>

      <div className="summary-grid leads-summary-grid">
        <article className="summary-card">
          <span className="summary-icon">
            <BriefcaseBusiness size={25} />
          </span>
          <div>
            <strong>{statistics.total}</strong>
            <span>Total enquiries</span>
          </div>
        </article>

        <article className="summary-card">
          <span className="summary-icon">
            <Target size={25} />
          </span>
          <div>
            <strong>{statistics.active}</strong>
            <span>Active opportunities</span>
          </div>
        </article>

        <article className="summary-card">
          <span className="summary-icon">
            <CircleDollarSign size={25} />
          </span>
          <div>
            <strong>{formatCurrency(String(statistics.pipelineValue))}</strong>
            <span>Pipeline value</span>
          </div>
        </article>

        <article className="summary-card">
          <span className="summary-icon">
            <CalendarDays size={25} />
          </span>
          <div>
            <strong>{statistics.won}</strong>
            <span>Orders won</span>
          </div>
        </article>
      </div>

      <div className="directory-card">
        <div className="directory-header">
          <div>
            <h2>Enquiry register</h2>
            <p>{leads.length} records shown</p>
          </div>

          <form className="directory-search" onSubmit={handleSearch}>
            <Search size={20} />

            <input
              type="search"
              value={search}
              placeholder="Search lead, title or customer..."
              onChange={(event) => setSearch(event.target.value)}
            />

            <button type="submit">Search</button>
          </form>
        </div>

        {error && <div className="page-error">{error}</div>}

        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" />
            <h3>Loading enquiries...</h3>
          </div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <Target size={35} />
            </span>
            <h3>No enquiries found</h3>
            <p>Create your first enquiry to begin building the pipeline.</p>
            <button
              className="primary-action"
              type="button"
              onClick={() => setShowModal(true)}
            >
              <Plus size={19} />
              Add first enquiry
            </button>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table leads-table">
              <thead>
                <tr>
                  <th>Enquiry</th>
                  <th>Customer</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th>Expected close</th>
                </tr>
              </thead>

              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div className="lead-title-cell">
                        <strong>{lead.title}</strong>
                        <span>{lead.leadNumber}</span>
                      </div>
                    </td>

                    <td>
                      <div className="lead-title-cell">
                        <strong>{lead.customer.companyName}</strong>
                        <span>{lead.customer.customerCode}</span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`priority-badge priority-${lead.priority.toLowerCase()}`}
                      >
                        {lead.priority}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-badge status-${lead.status.toLowerCase()}`}
                      >
                        {statusLabels[lead.status]}
                      </span>
                    </td>

                    <td>{formatCurrency(lead.estimatedValue)}</td>
                    <td>{formatDate(lead.expectedCloseDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setShowModal(false)}
        >
          <div
            className="form-modal lead-form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="page-eyebrow">NEW OPPORTUNITY</span>
                <h2 id="lead-modal-title">Create sales enquiry</h2>
                <p>Add the commercial details of the new opportunity.</p>
              </div>

              <button
                className="icon-button"
                type="button"
                aria-label="Close"
                onClick={() => setShowModal(false)}
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleCreateLead}>
              <div className="form-grid">
                <label className="full-field">
                  Enquiry title
                  <input
                    required
                    minLength={3}
                    value={form.title}
                    placeholder="Example: Boiler automation upgrade"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="full-field">
                  Customer
                  <select
                    required
                    value={form.customerId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        customerId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.companyName}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Priority
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        priority: event.target.value as LeadPriority,
                      }))
                    }
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </label>

                <label>
                  Status
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as LeadStatus,
                      }))
                    }
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Estimated value
                  <input
                    type="number"
                    min="0"
                    value={form.estimatedValue}
                    placeholder="₹ 0"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        estimatedValue: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Expected close date
                  <input
                    type="date"
                    value={form.expectedCloseDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        expectedCloseDate: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="full-field">
                  Lead source
                  <input
                    value={form.source}
                    placeholder="Website, referral, exhibition..."
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        source: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="full-field">
                  Description
                  <textarea
                    rows={4}
                    value={form.description}
                    placeholder="Add project requirements and initial notes..."
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="primary-action"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Creating..." : "Create enquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}