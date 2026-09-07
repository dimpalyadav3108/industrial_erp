import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Bell,
  Boxes,
  Calculator,
  ClipboardCheck,
  Factory,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Target,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { getStoredUser, logout } from "../services/auth.service";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "CRM & Customers", icon: Users, path: "/customers" },
  { label: "Leads & Enquiries", icon: Target, path: "/leads" },
  { label: "Estimation", icon: Calculator, path: "/estimation" },
  { label: "Quotations", icon: FileText, path: "/quotations" },
  { label: "Inventory", icon: Boxes, path: "/inventory" },
  { label: "Production", icon: Factory, path: "/production" },
  { label: "Quality", icon: ClipboardCheck, path: "/quality" },
  { label: "Dispatch", icon: Truck, path: "/dispatch" },
  { label: "Service & AMC", icon: Wrench, path: "/service" },
];

export function AppLayout() {
  const navigate = useNavigate();
  const user = getStoredUser();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Factory size={25} />

          <div>
            <strong>Industrial ERP</strong>
            <span>Operations control</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-label">Workspace</span>

          {menuItems.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" type="button">
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <button
            className="nav-item logout-item"
            type="button"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div className="search-box">
            <Search size={18} />
            <input placeholder="Search projects, customers or jobs..." />
          </div>

          <div className="topbar-actions">
            <button
              className="icon-button"
              type="button"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="notification-dot" />
            </button>

            <div className="user-summary">
              <div className="user-avatar">
                {user?.firstName?.[0] || "A"}
              </div>

              <div>
                <strong>
                  {user
                    ? `${user.firstName} ${user.lastName}`
                    : "Administrator"}
                </strong>

                <span>{user?.roles.join(", ") || "ADMIN"}</span>
              </div>
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}