import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "./components/AppLayout";

import { CustomersPage } from "./pages/CustomersPage";
import { DashboardPage } from "./pages/DashboardPage";
import DispatchPage from "./pages/DispatchPage";
import EngineeringPage from "./pages/EngineeringPage";
import EstimationPage from "./pages/EstimationPage";
import FinancePage from "./pages/FinancePage";
import HrPage from "./pages/HrPage";
import InstallationPage from "./pages/InstallationPage";
import InventoryPage from "./pages/InventoryPage";
import IotDashboardPage from "./pages/IotDashboardPage";
import LeadsPage from "./pages/LeadsPage";
import { LoginPage } from "./pages/LoginPage";
import ProcurementPage from "./pages/ProcurementPage";
import ProjectPage from "./pages/ProjectPage";
import ProductionPage from "./pages/ProductionPage";
import QualityPage from "./pages/QualityPage";
import QuotationsPage from "./pages/QuotationsPage";
import SalesPage from "./pages/SalesPage";
import ServicePage from "./pages/ServicePage";
import SettingsPage from "./pages/SettingsPage";

import { getStoredUser } from "./services/auth.service";

import "./App.css";

function ProtectedRoute({ children }: { children: ReactNode }) {
  return getStoredUser() ? children : <Navigate to="/" replace />;
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
        <Route path="/" element={<LoginRoute />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/estimation" element={<EstimationPage />} />
          <Route path="/quotations" element={<QuotationsPage />} />
          <Route path="/engineering" element={<EngineeringPage />} />
          <Route path="/procurement" element={<ProcurementPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/projects" element={<ProjectPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/quality" element={<QualityPage />} />
          <Route path="/dispatch" element={<DispatchPage />} />
          <Route path="/installations" element={<InstallationPage />} />
          <Route path="/service" element={<ServicePage />} />
          <Route path="/service-amc" element={<ServicePage />} />
          <Route path="/finance" element={<FinancePage />} />

          {/* HR & Payroll */}
          <Route path="/hr" element={<HrPage />} />

          {/* IoT & Management Dashboard */}
          <Route path="/iot" element={<IotDashboardPage />} />

          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;