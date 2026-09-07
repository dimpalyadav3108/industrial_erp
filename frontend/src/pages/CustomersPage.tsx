import { useEffect, useState, type FormEvent } from "react";
import {
  Building2,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import {
  createCustomer,
  getCustomers,
} from "../services/customer.service";
import type {
  CreateCustomerInput,
  Customer,
  CustomerStatus,
} from "../types/customer";

const initialForm: CreateCustomerInput = {
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  gstNumber: "",
  billingAddress: "",
  shippingAddress: "",
  city: "",
  state: "",
  country: "India",
  status: "PROSPECT",
};

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<CreateCustomerInput>(initialForm);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function loadCustomers(searchValue = "") {
    setIsLoading(true);
    setError("");

    try {
      const result = await getCustomers(searchValue);
      setCustomers(result.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load customers"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCustomers();
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadCustomers(search);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const result = await createCustomer(form);
      setCustomers((current) => [result.data, ...current]);
      setForm(initialForm);
      setShowForm(false);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create customer"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="dashboard-content customer-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CRM management</span>
          <h1>Customers</h1>
          <p>
            Manage prospects, active customers and their enquiry history.
          </p>
        </div>

        <button
          className="primary-action"
          onClick={() => {
            setError("");
            setShowForm(true);
          }}
        >
          <Plus size={18} />
          Add customer
        </button>
      </div>

      <div className="customer-summary">
        <article className="summary-card">
          <Users size={21} />
          <div>
            <strong>{customers.length}</strong>
            <span>Total customers</span>
          </div>
        </article>

        <article className="summary-card">
          <Building2 size={21} />
          <div>
            <strong>
              {
                customers.filter(
                  (customer) => customer.status === "ACTIVE"
                ).length
              }
            </strong>
            <span>Active accounts</span>
          </div>
        </article>

        <article className="summary-card">
          <Plus size={21} />
          <div>
            <strong>
              {
                customers.filter(
                  (customer) => customer.status === "PROSPECT"
                ).length
              }
            </strong>
            <span>Prospects</span>
          </div>
        </article>
      </div>

      <article className="content-card customer-list-card">
        <div className="customer-toolbar">
          <div>
            <h2>Customer directory</h2>
            <span>{customers.length} records shown</span>
          </div>

          <form className="customer-search" onSubmit={handleSearch}>
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search company or contact..."
            />
            <button type="submit">Search</button>
          </form>
        </div>

        {error && !showForm && (
          <div className="login-error">{error}</div>
        )}

        {isLoading ? (
          <div className="table-state">
            <LoaderCircle className="spin" size={25} />
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <Building2 size={34} />
            <h3>No customers found</h3>
            <p>Create your first customer to begin managing CRM records.</p>
            <button
              className="primary-action"
              onClick={() => setShowForm(true)}
            >
              <Plus size={17} />
              Add first customer
            </button>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="customer-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Leads</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="company-cell">
                        <div className="company-icon">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <strong>{customer.companyName}</strong>
                          <span>{customer.customerCode}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="contact-cell">
                        <strong>
                          {customer.contactPerson || "Not provided"}
                        </strong>
                        {customer.email && (
                          <span>
                            <Mail size={13} />
                            {customer.email}
                          </span>
                        )}
                        {customer.phone && (
                          <span>
                            <Phone size={13} />
                            {customer.phone}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="location-cell">
                        <MapPin size={14} />
                        {[customer.city, customer.state]
                          .filter(Boolean)
                          .join(", ") || customer.country}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${customer.status.toLowerCase()}`}
                      >
                        {customer.status}
                      </span>
                    </td>

                    <td>{customer._count?.leads ?? 0}</td>

                    <td>
                      {new Date(customer.createdAt).toLocaleDateString(
                        "en-IN"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setShowForm(false)}
        >
          <div
            className="customer-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">New CRM record</span>
                <h2>Add customer</h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form className="customer-form" onSubmit={handleCreate}>
              <div className="form-field full-width">
                <label htmlFor="companyName">Company name *</label>
                <input
                  id="companyName"
                  value={form.companyName}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      companyName: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="contactPerson">Contact person</label>
                <input
                  id="contactPerson"
                  value={form.contactPerson}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      contactPerson: event.target.value,
                    })
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="gstNumber">GST number</label>
                <input
                  id="gstNumber"
                  value={form.gstNumber}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      gstNumber: event.target.value.toUpperCase(),
                    })
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  value={form.city}
                  onChange={(event) =>
                    setForm({ ...form, city: event.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="state">State</label>
                <input
                  id="state"
                  value={form.state}
                  onChange={(event) =>
                    setForm({ ...form, state: event.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as CustomerStatus,
                    })
                  }
                >
                  <option value="PROSPECT">Prospect</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="BLACKLISTED">Blacklisted</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="country">Country</label>
                <input
                  id="country"
                  value={form.country}
                  onChange={(event) =>
                    setForm({ ...form, country: event.target.value })
                  }
                  required
                />
              </div>

              <div className="form-field full-width">
                <label htmlFor="billingAddress">Billing address</label>
                <textarea
                  id="billingAddress"
                  value={form.billingAddress}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      billingAddress: event.target.value,
                    })
                  }
                />
              </div>

              {error && <div className="login-error full-width">{error}</div>}

              <div className="modal-actions full-width">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-action"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="spin" size={17} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Create customer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}