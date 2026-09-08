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
import EstimationPage from "./pages/EstimationPage";
import LeadsPage from "./pages/LeadsPage";
import { LoginPage } from "./pages/LoginPage";
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
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;