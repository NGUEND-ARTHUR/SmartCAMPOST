import React from "react";
import CreateFinancePage from "./pages/admin/CreateFinancePage";
import CreateRiskPage from "./pages/admin/CreateRiskPage";
import ApiCoverage from "./pages/debug/ApiCoverage";
import MapViewer from "./pages/maps/MapViewer";
import PickupMap from "./pages/maps/PickupMap";
import TrackingMap from "./pages/maps/TrackingMap";
import RoleMapDashboard from "./pages/maps/RoleMapDashboard";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Common pages
import { Landing } from "./pages/common";
import TrackingPage from "./pages/common/TrackingPage";

// Auth pages
import { Login, LoginOtp, ResetPassword, Register } from "./pages/auth";

// Client pages
import { ClientDashboard } from "./pages/dashboard";
import { ParcelList, CreateParcel, ParcelDetail } from "./pages/parcels";
import { Pickups } from "./pages/pickups";
import { Support } from "./pages/support";

// Courier pages
import { CourierDashboard } from "./pages/dashboard";
import { CourierPickups, PickupDetail } from "./pages/pickups";
import {
  CourierDeliveries,
  DeliveryDetail,
  ConfirmDelivery,
} from "./pages/deliveries";

// Staff/Agent/Admin pages
import {
  AgentDashboard,
  StaffDashboard,
  AdminDashboard,
  FinanceDashboard,
  RiskDashboard,
} from "./pages/dashboard";
import { ScanConsole } from "./pages/scan";
import { ParcelManagement } from "./pages/parcels";
import { PickupsManagement } from "./pages/pickups";
import { Payments, ClientPayments, Refunds } from "./pages/payments";
import { Notifications } from "./pages/notifications";
import { Analytics } from "./pages/analytics";
import { Compliance, RiskAlerts } from "./pages/compliance";

import { ProtectedWrapper } from "./components/auth/ProtectedRoute";
import { RoleLayout } from "./layouts/RoleLayout";
import {
  ClientManagement,
  AgentManagement,
  AgencyManagement,
  StaffManagement,
  CourierManagement,
} from "./pages/users";
import {
  TariffManagement,
  IntegrationManagement,
  UserAccountManagement,
  SelfHealingDashboard,
} from "./pages/admin";
import { AIChatbot } from "./components/chat";
import MtnTest from "./pages/payments/MtnTest";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/login-otp" element={<LoginOtp />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/register" element={<Register />} />

        <Route
          path="/client"
          element={
            <ProtectedWrapper allowedRoles={["CLIENT"]}>
              <RoleLayout role="CLIENT" />
            </ProtectedWrapper>
          }
        >
          <Route index element={<ClientDashboard />} />
          <Route path="parcels" element={<ParcelList />} />
          <Route path="parcels/create" element={<CreateParcel />} />
          <Route path="parcels/:id" element={<ParcelDetail />} />
          <Route path="pickups" element={<Pickups />} />
          <Route path="payments" element={<ClientPayments />} />
          <Route path="map" element={<RoleMapDashboard />} />
          <Route path="support" element={<Support />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route
          path="/courier"
          element={
            <ProtectedWrapper allowedRoles={["COURIER"]}>
              <RoleLayout role="COURIER" />
            </ProtectedWrapper>
          }
        >
          <Route index element={<CourierDashboard />} />
          <Route path="pickups" element={<CourierPickups />} />
          <Route path="pickups/:id" element={<PickupDetail />} />
          <Route path="deliveries" element={<CourierDeliveries />} />
          <Route path="deliveries/:id" element={<DeliveryDetail />} />
          <Route path="deliveries/confirm" element={<ConfirmDelivery />} />
          <Route path="map" element={<RoleMapDashboard />} />
          <Route path="scan" element={<ScanConsole />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route
          path="/agent"
          element={
            <ProtectedWrapper allowedRoles={["AGENT"]}>
              <RoleLayout role="AGENT" />
            </ProtectedWrapper>
          }
        >
          <Route index element={<AgentDashboard />} />
          <Route path="map" element={<RoleMapDashboard />} />
          <Route path="scan" element={<ScanConsole />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route
          path="/staff"
          element={
            <ProtectedWrapper allowedRoles={["STAFF"]}>
              <RoleLayout role="STAFF" />
            </ProtectedWrapper>
          }
        >
          <Route index element={<StaffDashboard />} />
          <Route path="pickups" element={<PickupsManagement />} />
          <Route path="parcels" element={<ParcelManagement />} />
          <Route path="parcels/:id" element={<ParcelDetail />} />
          <Route path="tracking" element={<TrackingPage />} />
          <Route path="map" element={<RoleMapDashboard />} />
          <Route path="scan" element={<ScanConsole />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedWrapper allowedRoles={["ADMIN"]}>
              <RoleLayout role="ADMIN" />
            </ProtectedWrapper>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="api-coverage" element={<ApiCoverage />} />
          <Route path="parcels" element={<ParcelManagement />} />
          <Route path="parcels/:id" element={<ParcelDetail />} />
          <Route path="tracking" element={<TrackingPage />} />
          <Route path="map" element={<RoleMapDashboard />} />
          <Route path="scan" element={<ScanConsole />} />
          <Route path="staff" element={<StaffDashboard />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="analytics" element={<Analytics />} />
          {/* User Management Routes */}
          <Route path="users/clients" element={<ClientManagement />} />
          <Route path="users/agents" element={<AgentManagement />} />
          <Route path="users/agencies" element={<AgencyManagement />} />
          <Route path="users/staff" element={<StaffManagement />} />
          <Route path="users/couriers" element={<CourierManagement />} />
          {/* System Management Routes */}
          <Route path="tariffs" element={<TariffManagement />} />
          <Route path="integrations" element={<IntegrationManagement />} />
          <Route path="accounts" element={<UserAccountManagement />} />
          {/* Finance Management */}
          <Route path="finance" element={<FinanceDashboard />} />
          <Route path="finance/create" element={<CreateFinancePage />} />
          {/* Risk Management */}
          <Route path="risk" element={<RiskDashboard />} />
          <Route path="risk/create" element={<CreateRiskPage />} />
          {/* Self-Healing System (SPEC SECTION 15) */}
          <Route path="self-healing" element={<SelfHealingDashboard />} />
        </Route>

        <Route
          path="/finance"
          element={
            <ProtectedWrapper allowedRoles={["FINANCE"]}>
              <RoleLayout role="FINANCE" />
            </ProtectedWrapper>
          }
        >
          <Route index element={<FinanceDashboard />} />
          <Route path="payments" element={<Payments />} />
          <Route path="refunds" element={<Refunds />} />
          <Route path="map" element={<RoleMapDashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route
          path="/risk"
          element={
            <ProtectedWrapper allowedRoles={["RISK"]}>
              <RoleLayout role="RISK" />
            </ProtectedWrapper>
          }
        >
          <Route index element={<RiskDashboard />} />
          <Route path="alerts" element={<RiskAlerts />} />
          <Route path="map" element={<RoleMapDashboard />} />
          <Route path="compliance" element={<Compliance />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Legacy/backward-compatible paths */}
        <Route path="/courier/pickup/:id" element={<PickupDetail />} />
        <Route path="/courier/delivery/:id" element={<DeliveryDetail />} />
        <Route
          path="/courier/agent"
          element={<Navigate to="/agent" replace />}
        />
        <Route
          path="/admin/finance"
          element={<Navigate to="/finance" replace />}
        />
        <Route path="/admin/risk" element={<Navigate to="/risk" replace />} />

        {/* Public tracking (number + QR) */}
        <Route path="/tracking" element={<TrackingPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/maps/viewer" element={<MapViewer />} />
        <Route path="/maps/pickups" element={<PickupMap />} />
        <Route path="/maps/tracking" element={<TrackingMap />} />
        <Route path="/mtn-test" element={<MtnTest />} />
      </Routes>
      {/* AI Chatbot - Available on all pages */}
      <AIChatbot />
    </Router>
  );
}

export default App;
