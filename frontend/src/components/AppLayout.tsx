// Interactive ERP topbar: module search, notifications and account menu
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  Bell,
  BadgeIndianRupee,
  Boxes,
  Calculator,
  ClipboardCheck,
  DraftingCompass,
  Factory,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Search,
  ReceiptText,
  Settings,
  ShoppingCart,
  Target,
  Truck,
  Users,
  Wrench,
  UserRoundCog,
  Radio,
} from "lucide-react";

import {
  getStoredUser,
  logout,
} from "../services/auth.service";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "CRM & Customers",
    icon: Users,
    path: "/customers",
  },
  {
    label: "Leads & Enquiries",
    icon: Target,
    path: "/leads",
  },
  {
    label: "Estimation",
    icon: Calculator,
    path: "/estimation",
  },
  {
    label: "Quotations",
    icon: FileText,
    path: "/quotations",
  },

  // Engineering module
  {
    label: "Engineering",
    icon: DraftingCompass,
    path: "/engineering",
  },

  // Procurement module
  {
    label: "Procurement",
    icon: ShoppingCart,
    path: "/procurement",
  },

  // Sales Orders & Invoicing
  {
    label: "Sales & Invoicing",
    icon: ReceiptText,
    path: "/sales",
  },
  // Project & Milestone Management
  {
    label: "Projects & Milestones",
    icon: FolderKanban,
    path: "/projects",
  },


  {
    label: "Inventory",
    icon: Boxes,
    path: "/inventory",
  },
  {
    label: "Production",
    icon: Factory,
    path: "/production",
  },
  {
    label: "Quality",
    icon: ClipboardCheck,
    path: "/quality",
  },
  {
    label: "Dispatch",
    icon: Truck,
    path: "/dispatch",
  },
  {
    label: "Installation & Commissioning",
    icon: Wrench,
    path: "/installations",
  },
  {
    label: "Service & AMC",
    icon: Wrench,
    path: "/service",
  },
  {
    label: "Finance & Accounts",
    icon: BadgeIndianRupee,
    path: "/finance",
  },
  {
    label: "HR & Payroll",
    icon: UserRoundCog,
    path: "/hr",
  },
  {
    label: "IoT & Management",
    icon: Radio,
    path: "/iot",
  },
];

const searchableItems = [
  ...menuItems,
  {
    label: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

export function AppLayout() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [searchQuery, setSearchQuery] =
    useState("");

  const [
    showSearchResults,
    setShowSearchResults,
  ] = useState(false);

  const [
    showNotifications,
    setShowNotifications,
  ] = useState(false);

  const [showAccount, setShowAccount] =
    useState(false);

  const searchResults = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    if (!query) {
      return searchableItems;
    }

    return searchableItems.filter((item) =>
      item.label.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  function goTo(path: string) {
    navigate(path);

    setSearchQuery("");
    setShowSearchResults(false);
    setShowNotifications(false);
    setShowAccount(false);
  }

  function handleSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (searchResults[0]) {
      goTo(searchResults[0].path);
    }
  }

  function handleLogout() {
    logout();

    navigate("/", {
      replace: true,
    });
  }

  const displayName = user
    ? [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
    : "Administrator";

  return (
    <div className="dashboard-shell">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">
        <div className="sidebar-brand">
          <Factory size={25} />

          <div>
            <strong>
              Industrial ERP
            </strong>

            <span>
              Operations control
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-label">
            Workspace
          </span>

          {menuItems.map(
            ({
              label,
              icon: Icon,
              path,
            }) => (
              <NavLink
                key={path}
                to={path}
                className={({
                  isActive,
                }) =>
                  `nav-item ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                <Icon size={19} />

                <span>
                  {label}
                </span>
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/settings"
            className={({
              isActive,
            }) =>
              `nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
          >
            <Settings size={19} />

            <span>
              Settings
            </span>
          </NavLink>

          <button
            className="nav-item logout-item"
            type="button"
            onClick={handleLogout}
          >
            <LogOut size={19} />

            <span>
              Sign out
            </span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="dashboard-main">
        {/* ===================================================
            TOPBAR
        =================================================== */}

        <header className="topbar">
          <form
            className="search-box topbar-search"
            onSubmit={handleSearch}
          >
            <Search size={18} />

            <input
              value={searchQuery}
              placeholder="Search modules..."
              onFocus={() =>
                setShowSearchResults(
                  true
                )
              }
              onChange={(event) => {
                setSearchQuery(
                  event.target.value
                );

                setShowSearchResults(
                  true
                );
              }}
              aria-label="Search ERP modules"
            />

            {showSearchResults &&
              searchQuery.trim() && (
                <div className="topbar-search-results">
                  {searchResults.length >
                  0 ? (
                    searchResults.map(
                      ({
                        label,
                        icon: Icon,
                        path,
                      }) => (
                        <button
                          type="button"
                          key={path}
                          onClick={() =>
                            goTo(path)
                          }
                        >
                          <Icon
                            size={17}
                          />

                          <span>
                            {label}
                          </span>
                        </button>
                      )
                    )
                  ) : (
                    <div className="topbar-empty-result">
                      No matching
                      module found
                    </div>
                  )}
                </div>
              )}
          </form>

          <div className="topbar-actions">
            {/* ===============================================
                NOTIFICATIONS
            =============================================== */}

            <div className="topbar-menu-wrap">
              <button
                className="icon-button"
                type="button"
                aria-label="Notifications"
                aria-expanded={
                  showNotifications
                }
                onClick={() => {
                  setShowNotifications(
                    (current) =>
                      !current
                  );

                  setShowAccount(false);

                  setShowSearchResults(
                    false
                  );
                }}
              >
                <Bell size={20} />

                <span className="notification-dot" />
              </button>

              {showNotifications && (
                <div className="topbar-popover notification-popover">
                  <div className="popover-heading">
                    <strong>
                      Notifications
                    </strong>

                    <span>
                      System updates
                    </span>
                  </div>

                  <div className="notification-empty">
                    <Bell size={24} />

                    <strong>
                      No new
                      notifications
                    </strong>

                    <span>
                      Your ERP is
                      operating normally.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ===============================================
                ACCOUNT
            =============================================== */}

            <div className="topbar-menu-wrap">
              <button
                className="user-summary account-button"
                type="button"
                aria-expanded={
                  showAccount
                }
                onClick={() => {
                  setShowAccount(
                    (current) =>
                      !current
                  );

                  setShowNotifications(
                    false
                  );

                  setShowSearchResults(
                    false
                  );
                }}
              >
                <div className="user-avatar">
                  {user?.firstName?.[0] ||
                    "A"}
                </div>

                <div>
                  <strong>
                    {displayName}
                  </strong>

                  <span>
                    {user?.roles.join(
                      ", "
                    ) || "ADMIN"}
                  </span>
                </div>
              </button>

              {showAccount && (
                <div className="topbar-popover account-popover">
                  <div className="account-popover-user">
                    <div className="user-avatar">
                      {user
                        ?.firstName?.[0] ||
                        "A"}
                    </div>

                    <div>
                      <strong>
                        {displayName}
                      </strong>

                      <span>
                        {user?.roles.join(
                          ", "
                        ) || "ADMIN"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      goTo(
                        "/settings"
                      )
                    }
                  >
                    <Settings
                      size={17}
                    />

                    Account settings
                  </button>

                  <button
                    type="button"
                    className="popover-signout"
                    onClick={
                      handleLogout
                    }
                  >
                    <LogOut size={17} />

                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Current ERP module */}
        <Outlet />
      </main>
    </div>
  );
}