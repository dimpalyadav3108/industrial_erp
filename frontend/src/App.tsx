import type { ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AppLayout } from "./components/AppLayout";

import { CustomersPage } from "./pages/CustomersPage";
import { DashboardPage } from "./pages/DashboardPage";
import DispatchPage from "./pages/DispatchPage";
import EngineeringPage from "./pages/EngineeringPage";
import EstimationPage from "./pages/EstimationPage";
import InventoryPage from "./pages/InventoryPage";
import LeadsPage from "./pages/LeadsPage";
import { LoginPage } from "./pages/LoginPage";
import ProductionPage from "./pages/ProductionPage";
import QualityPage from "./pages/QualityPage";
import QuotationsPage from "./pages/QuotationsPage";
import ServicePage from "./pages/ServicePage";
import SettingsPage from "./pages/SettingsPage";

import { getStoredUser } from "./services/auth.service";

import "./App.css";

function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  return getStoredUser() ? (
    children
  ) : (
    <Navigate to="/" replace />
  );
}

function LoginRoute() {
  return getStoredUser() ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <LoginPage />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/" element={<LoginRoute />} />

        {/* Protected ERP */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/customers"
            element={<CustomersPage />}
          />

          <Route
            path="/leads"
            element={<LeadsPage />}
          />

          <Route
            path="/estimation"
            element={<EstimationPage />}
          />

          <Route
            path="/quotations"
            element={<QuotationsPage />}
          />

          {/* Engineering */}
          <Route
            path="/engineering"
            element={<EngineeringPage />}
          />

          <Route
            path="/inventory"
            element={<InventoryPage />}
          />

          <Route
            path="/production"
            element={<ProductionPage />}
          />

          <Route
            path="/quality"
            element={<QualityPage />}
          />

          <Route
            path="/dispatch"
            element={<DispatchPage />}
          />

          <Route
            path="/service"
            element={<ServicePage />}
          />

          <Route
            path="/service-amc"
            element={<ServicePage />}
          />

          <Route
            path="/settings"
            element={<SettingsPage />}
          />
        </Route>

        {/* Unknown URL */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;