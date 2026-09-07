import {
  BarChart3,
  Calculator,
  ClipboardCheck,
  Truck,
} from "lucide-react";
import { getStoredUser } from "../services/auth.service";

export function DashboardPage() {
  const user = getStoredUser();

  return (
    <section className="dashboard-content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Operations overview</span>
          <h1>Good day, {user?.firstName || "Administrator"}</h1>
          <p>
            Here is the current position of your manufacturing operations.
          </p>
        </div>

        <button className="primary-action">Create new enquiry</button>
      </div>

      <div className="metric-grid">
        <article className="metric-card">
          <span>Active enquiries</span>
          <strong>24</strong>
          <small>6 require estimation</small>
        </article>

        <article className="metric-card">
          <span>Open quotations</span>
          <strong>18</strong>
          <small>₹4.8 Cr pipeline value</small>
        </article>

        <article className="metric-card">
          <span>Projects in execution</span>
          <strong>12</strong>
          <small>9 currently on schedule</small>
        </article>

        <article className="metric-card">
          <span>Production jobs</span>
          <strong>31</strong>
          <small>7 awaiting inspection</small>
        </article>
      </div>

      <div className="dashboard-grid">
        <article className="content-card overview-card">
          <div className="card-heading">
            <div>
              <span>Monthly performance</span>
              <h2>Order and production overview</h2>
            </div>
            <BarChart3 size={22} />
          </div>

          <div className="chart-placeholder">
            {[42, 58, 48, 72, 65, 86, 76, 92].map(
              (height, index) => (
                <span
                  key={index}
                  style={{ height: `${height}%` }}
                />
              )
            )}
          </div>
        </article>

        <article className="content-card">
          <div className="card-heading">
            <div>
              <span>Attention required</span>
              <h2>Priority actions</h2>
            </div>
          </div>

          <ul className="action-list">
            <li>
              <ClipboardCheck size={18} />
              <div>
                <strong>3 inspections pending</strong>
                <span>Quality department</span>
              </div>
            </li>

            <li>
              <Truck size={18} />
              <div>
                <strong>2 dispatches due today</strong>
                <span>Logistics department</span>
              </div>
            </li>

            <li>
              <Calculator size={18} />
              <div>
                <strong>6 estimates awaiting review</strong>
                <span>Commercial department</span>
              </div>
            </li>
          </ul>
        </article>
      </div>
    </section>
  );
}