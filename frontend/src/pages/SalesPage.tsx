import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  FormEvent,
  ReactNode,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";

import {
  createSalesInvoice,
  createSalesOrder,
  createSalesPayment,
  getEligibleSalesQuotations,
  getSalesInvoices,
  getSalesOrders,
  updateSalesInvoice,
  updateSalesOrder,
} from "../services/sales.service";

import type {
  EligibleQuotation,
  PaymentMethod,
  SalesInvoice,
  SalesOrder,
} from "../types/sales";

import "./SalesPage.css";

type Tab = "orders" | "invoices" | "payments";

const money = (value: unknown) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(value ?? 0));

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-IN") : "—";

const formatText = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

export default function SalesPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [quotes, setQuotes] = useState<EligibleQuotation[]>([]);

  const [tab, setTab] = useState<Tab>("orders");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modal, setModal] = useState<
    "order" | "invoice" | "payment" | null
  >(null);

  const [selectedQuote, setSelectedQuote] = useState("");
  const [selectedOrder, setSelectedOrder] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState("");

  const [po, setPo] = useState("");
  const [delivery, setDelivery] = useState("");
  const [due, setDue] = useState("");

  const [amount, setAmount] = useState("");
  const [method, setMethod] =
    useState<PaymentMethod>("BANK_TRANSFER");
  const [reference, setReference] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");

      const [orderData, invoiceData, quotationData] =
        await Promise.all([
          getSalesOrders(),
          getSalesInvoices(),
          getEligibleSalesQuotations(),
        ]);

      setOrders(orderData);
      setInvoices(invoiceData);
      setQuotes(quotationData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load sales data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const payments = useMemo(
    () =>
      invoices.flatMap((invoice) =>
        invoice.payments.map((payment) => ({
          ...payment,
          invoiceNumber: invoice.invoiceNumber,
          customer: invoice.customer.companyName,
        }))
      ),
    [invoices]
  );

  const query = search.toLowerCase();

  const orderRows = orders.filter((order) =>
    `${order.salesOrderNumber} ${order.customer.companyName} ${order.status}`
      .toLowerCase()
      .includes(query)
  );

  const invoiceRows = invoices.filter((invoice) =>
    `${invoice.invoiceNumber} ${invoice.customer.companyName} ${invoice.status}`
      .toLowerCase()
      .includes(query)
  );

  const paymentRows = payments.filter((payment) =>
    `${payment.paymentNumber} ${payment.invoiceNumber} ${payment.customer}`
      .toLowerCase()
      .includes(query)
  );

  const visibleCount =
    tab === "orders"
      ? orderRows.length
      : tab === "invoices"
        ? invoiceRows.length
        : paymentRows.length;

  const outstanding = invoices.reduce(
    (total, invoice) =>
      total + Number(invoice.balanceAmount),
    0
  );

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function openModal(
    value: "order" | "invoice" | "payment"
  ) {
    clearMessages();

    if (value === "order") {
      setSelectedQuote("");
      setPo("");
      setDelivery("");
    }

    if (value === "invoice") {
      setSelectedOrder("");
      setDue("");
    }

    if (value === "payment") {
      setSelectedInvoice("");
      setAmount("");
      setMethod("BANK_TRANSFER");
      setReference("");
    }

    setModal(value);
  }

  async function saveOrder(event: FormEvent) {
    event.preventDefault();

    const quote = quotes.find(
      (item) => item.id === selectedQuote
    );

    if (!quote?.estimate.lead.customer) {
      setError(
        "Select an accepted quotation with a customer."
      );
      return;
    }

    try {
      setError("");

      await createSalesOrder({
        quotationId: quote.id,
        customerId: quote.estimate.lead.customer.id,

        ...(po
          ? { customerPoNumber: po }
          : {}),

        ...(delivery
          ? { expectedDeliveryDate: delivery }
          : {}),

        ...(quote.paymentTerms
          ? { paymentTerms: quote.paymentTerms }
          : {}),

        ...(quote.deliveryTerms
          ? { deliveryTerms: quote.deliveryTerms }
          : {}),

        ...(quote.estimate.lead.customer.billingAddress
          ? {
              billingAddress:
                quote.estimate.lead.customer.billingAddress,
            }
          : {}),

        ...(quote.estimate.lead.customer.shippingAddress
          ? {
              shippingAddress:
                quote.estimate.lead.customer.shippingAddress,
            }
          : {}),

        items: quote.estimate.items.map(
          (item, index) => ({
            lineNumber: index + 1,
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit,
            unitPrice: Number(item.unitRate),
            taxPercent: Number(quote.taxPercent),
            discountPercent: 0,
          })
        ),
      });

      setModal(null);
      setSuccess(
        "Sales order created successfully."
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create sales order"
      );
    }
  }

  async function saveInvoice(event: FormEvent) {
    event.preventDefault();

    try {
      setError("");

      await createSalesInvoice({
        salesOrderId: selectedOrder,
        ...(due ? { dueDate: due } : {}),
      });

      setModal(null);
      setSuccess("Invoice created successfully.");

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create invoice"
      );
    }
  }

  async function savePayment(event: FormEvent) {
    event.preventDefault();

    if (Number(amount) <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }

    try {
      setError("");

      await createSalesPayment({
        invoiceId: selectedInvoice,
        amount: Number(amount),
        method,

        ...(reference
          ? { referenceNumber: reference }
          : {}),
      });

      setModal(null);
      setSuccess(
        "Payment recorded successfully."
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to record payment"
      );
    }
  }

  async function changeOrderStatus(
    orderId: string,
    status:
      | "CONFIRMED"
      | "READY_TO_INVOICE"
  ) {
    try {
      clearMessages();

      await updateSalesOrder(orderId, {
        status,
      });

      setSuccess(
        status === "CONFIRMED"
          ? "Sales order confirmed successfully."
          : "Sales order is ready to invoice."
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update sales order"
      );
    }
  }

  async function issueInvoice(invoiceId: string) {
    try {
      clearMessages();

      await updateSalesInvoice(invoiceId, {
        status: "ISSUED",
      });

      setSuccess(
        "Invoice issued successfully."
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to issue invoice"
      );
    }
  }

  if (loading) {
    return (
      <div className="sales-page">
        <div className="sales-card">
          <div className="sales-empty">
            Loading sales data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-page">
      <div className="sales-header">
        <div>
          <span className="sales-eyebrow">
            SALES CONTROL
          </span>

          <h1>Sales &amp; Invoicing</h1>

          <p>
            Convert accepted quotations into sales
            orders, invoices and payments.
          </p>
        </div>

        <div className="sales-actions">
          <button
            type="button"
            className="sales-secondary-btn"
            onClick={() => void load()}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          {tab === "orders" && (
            <button
              type="button"
              className="sales-primary-btn"
              onClick={() => openModal("order")}
            >
              <Plus size={17} />
              New Sales Order
            </button>
          )}

          {tab === "invoices" && (
            <button
              type="button"
              className="sales-primary-btn"
              onClick={() => openModal("invoice")}
            >
              <Plus size={17} />
              New Invoice
            </button>
          )}

          {tab === "payments" && (
            <button
              type="button"
              className="sales-primary-btn"
              onClick={() => openModal("payment")}
            >
              <Plus size={17} />
              Record Payment
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="sales-alert sales-alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="sales-alert sales-alert-success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="sales-summary-grid">
        <SummaryCard
          label="Sales Orders"
          value={orders.length}
          icon={<ShoppingBag size={21} />}
        />

        <SummaryCard
          label="Invoices"
          value={invoices.length}
          icon={<FileText size={21} />}
        />

        <SummaryCard
          label="Outstanding"
          value={money(outstanding)}
          icon={<CircleDollarSign size={22} />}
        />
      </div>

      <section className="sales-card">
        <div className="sales-toolbar">
          <div className="sales-tabs">
            <button
              type="button"
              className={`sales-tab ${
                tab === "orders" ? "active" : ""
              }`}
              onClick={() => setTab("orders")}
            >
              Orders
            </button>

            <button
              type="button"
              className={`sales-tab ${
                tab === "invoices" ? "active" : ""
              }`}
              onClick={() => setTab("invoices")}
            >
              Invoices
            </button>

            <button
              type="button"
              className={`sales-tab ${
                tab === "payments" ? "active" : ""
              }`}
              onClick={() => setTab("payments")}
            >
              Payments
            </button>
          </div>

          <div className="sales-search">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={`Search ${tab}...`}
            />
          </div>
        </div>

        <div className="sales-table-wrap">
          <table className="sales-table">
            <thead>
              {tab === "orders" && (
                <tr>
                  <th>SO Number</th>
                  <th>Customer</th>
                  <th>Order Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              )}

              {tab === "invoices" && (
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              )}

              {tab === "payments" && (
                <tr>
                  <th>Payment</th>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                </tr>
              )}
            </thead>

            <tbody>
              {tab === "orders" &&
                orderRows.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>
                        {order.salesOrderNumber}
                      </strong>
                    </td>

                    <td>
                      {order.customer.companyName}
                    </td>

                    <td>
                      {formatDate(order.orderDate)}
                    </td>

                    <td>
                      <strong>
                        {money(order.totalAmount)}
                      </strong>
                    </td>

                    <td>
                      <StatusBadge
                        status={order.status}
                      />
                    </td>

                    <td>
                      {order.status === "DRAFT" ? (
                        <button
                          type="button"
                          className="sales-secondary-btn"
                          onClick={() =>
                            void changeOrderStatus(
                              order.id,
                              "CONFIRMED"
                            )
                          }
                        >
                          Confirm
                        </button>
                      ) : ["CONFIRMED", "IN_PROGRESS"].includes(
                          order.status
                        ) ? (
                        <button
                          type="button"
                          className="sales-secondary-btn"
                          onClick={() =>
                            void changeOrderStatus(
                              order.id,
                              "READY_TO_INVOICE"
                            )
                          }
                        >
                          Ready to Invoice
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}

              {tab === "invoices" &&
                invoiceRows.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <strong>
                        {invoice.invoiceNumber}
                      </strong>
                    </td>

                    <td>
                      {invoice.customer.companyName}
                    </td>

                    <td>
                      {formatDate(invoice.invoiceDate)}
                    </td>

                    <td>
                      <strong>
                        {money(invoice.totalAmount)}
                      </strong>
                    </td>

                    <td>
                      {money(invoice.balanceAmount)}
                    </td>

                    <td>
                      <StatusBadge
                        status={invoice.status}
                      />
                    </td>

                    <td>
                      {invoice.status === "DRAFT" ? (
                        <button
                          type="button"
                          className="sales-secondary-btn"
                          onClick={() =>
                            void issueInvoice(invoice.id)
                          }
                        >
                          Issue
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}

              {tab === "payments" &&
                paymentRows.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <strong>
                        {payment.paymentNumber}
                      </strong>
                    </td>

                    <td>
                      {payment.invoiceNumber}
                    </td>

                    <td>
                      {payment.customer}
                    </td>

                    <td>
                      {formatDate(
                        payment.paymentDate
                      )}
                    </td>

                    <td>
                      <strong>
                        {money(payment.amount)}
                      </strong>
                    </td>

                    <td>
                      {formatText(payment.method)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {visibleCount === 0 && (
            <div className="sales-empty">
              No {tab} found.
            </div>
          )}
        </div>
      </section>

      {modal && (
        <div className="sales-modal-overlay">
          <div className="sales-modal">
            <div className="sales-modal-header">
              <h2>
                {modal === "order"
                  ? "New Sales Order"
                  : modal === "invoice"
                    ? "New Invoice"
                    : "Record Payment"}
              </h2>

              <button
                type="button"
                className="sales-close-btn"
                onClick={() => setModal(null)}
              >
                <X size={19} />
              </button>
            </div>

            {modal === "order" && (
              <form onSubmit={saveOrder}>
                <Field label="Accepted Quotation *">
                  <select
                    required
                    value={selectedQuote}
                    onChange={(event) =>
                      setSelectedQuote(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select quotation
                    </option>

                    {quotes.map((quote) => (
                      <option
                        value={quote.id}
                        key={quote.id}
                      >
                        {quote.quotationNumber} —{" "}
                        {quote.estimate.lead.customer
                          ?.companyName ??
                          "No customer"}{" "}
                        — {money(quote.totalAmount)}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Customer PO Number">
                  <input
                    value={po}
                    onChange={(event) =>
                      setPo(event.target.value)
                    }
                    placeholder="Enter customer PO number"
                  />
                </Field>

                <Field label="Expected Delivery">
                  <input
                    type="date"
                    value={delivery}
                    onChange={(event) =>
                      setDelivery(
                        event.target.value
                      )
                    }
                  />
                </Field>

                <SubmitButton text="Create Sales Order" />
              </form>
            )}

            {modal === "invoice" && (
              <form onSubmit={saveInvoice}>
                <Field label="Sales Order *">
                  <select
                    required
                    value={selectedOrder}
                    onChange={(event) =>
                      setSelectedOrder(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select order
                    </option>

                    {orders
                      .filter(
                        (order) =>
                          [
                            "CONFIRMED",
                            "IN_PROGRESS",
                            "READY_TO_INVOICE",
                          ].includes(order.status) &&
                          !order.invoices?.some(
                            (invoice) =>
                              invoice.status !==
                              "CANCELLED"
                          )
                      )
                      .map((order) => (
                        <option
                          value={order.id}
                          key={order.id}
                        >
                          {order.salesOrderNumber} —{" "}
                          {
                            order.customer
                              .companyName
                          }
                        </option>
                      ))}
                  </select>
                </Field>

                <Field label="Due Date">
                  <input
                    type="date"
                    value={due}
                    onChange={(event) =>
                      setDue(event.target.value)
                    }
                  />
                </Field>

                <SubmitButton text="Create Invoice" />
              </form>
            )}

            {modal === "payment" && (
              <form onSubmit={savePayment}>
                <Field label="Issued Invoice *">
                  <select
                    required
                    value={selectedInvoice}
                    onChange={(event) =>
                      setSelectedInvoice(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Select invoice
                    </option>

                    {invoices
                      .filter(
                        (invoice) =>
                          [
                            "ISSUED",
                            "PARTIALLY_PAID",
                            "OVERDUE",
                          ].includes(
                            invoice.status
                          ) &&
                          Number(
                            invoice.balanceAmount
                          ) > 0
                      )
                      .map((invoice) => (
                        <option
                          value={invoice.id}
                          key={invoice.id}
                        >
                          {invoice.invoiceNumber} —{" "}
                          Balance{" "}
                          {money(
                            invoice.balanceAmount
                          )}
                        </option>
                      ))}
                  </select>
                </Field>

                <Field label="Amount *">
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(event) =>
                      setAmount(event.target.value)
                    }
                    placeholder="Enter payment amount"
                  />
                </Field>

                <Field label="Payment Method">
                  <select
                    value={method}
                    onChange={(event) =>
                      setMethod(
                        event.target
                          .value as PaymentMethod
                      )
                    }
                  >
                    <option value="BANK_TRANSFER">
                      Bank Transfer
                    </option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">
                      Cheque
                    </option>
                    <option value="CASH">
                      Cash
                    </option>
                    <option value="CARD">
                      Card
                    </option>
                    <option value="OTHER">
                      Other
                    </option>
                  </select>
                </Field>

                <Field label="Reference Number">
                  <input
                    value={reference}
                    onChange={(event) =>
                      setReference(
                        event.target.value
                      )
                    }
                    placeholder="Transaction / cheque reference"
                  />
                </Field>

                <SubmitButton text="Record Payment" />
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="sales-summary-card">
      <div>
        <span className="sales-summary-label">
          {label}
        </span>

        <strong className="sales-summary-value">
          {value}
        </strong>
      </div>

      <div className="sales-summary-icon">
        {icon}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span className="sales-status">
      {formatText(status)}
    </span>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="sales-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SubmitButton({
  text,
}: {
  text: string;
}) {
  return (
    <div className="sales-submit">
      <button
        className="sales-primary-btn"
        type="submit"
      >
        <Plus size={17} />
        {text}
      </button>
    </div>
  );
}
