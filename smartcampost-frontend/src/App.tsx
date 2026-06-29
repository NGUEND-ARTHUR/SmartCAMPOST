import React, { lazy, Suspense } from "react";
import CreateFinancePage from "./pages/admin/CreateFinancePage";
import CreateRiskPage from "./pages/admin/CreateRiskPage";
import CreateRiskUserPage from "./pages/admin/CreateRiskUserPage";
import AdminFinanceDashboard from "./pages/admin/FinanceDashboard";

// Debug/dev-only pages — not bundled in production
const ApiCoverage = import.meta.env.DEV
  ? React.lazy(() => import("./pages/debug/ApiCoverage"))
  : () => null;
const MtnTest = import.meta.env.DEV
  ? React.lazy(() => import("./pages/payments/MtnTest"))
  : () => null;
const MoMoPaymentPage = lazy(() => import("./pages/payments/MoMoPaymentPage"));

// Lazy-load heavy map pages so the MapLibre bundle only ships when needed
const MapViewer = lazy(() => import("./pages/maps/MapViewer"));
const PickupMap = lazy(() => import("./pages/maps/PickupMap"));
const TrackingMap = lazy(() => import("./pages/maps/TrackingMap"));
const RoleMapDashboard = lazy(() => import("./pages/maps/RoleMapDashboard"));
const OperationsIntelligencePage = lazy(() => import("./pages/ops/OperationsIntelligencePage"));
// Lazy-load TrackingPage to avoid loading html5-qrcode WASM on every page
const TrackingPage = lazy(() => import("./pages/common/TrackingPage"));

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Common pages
import { Landing } from "./pages/common";
import Addresses from "./pages/common/Addresses";

// Auth pages
import { Login, LoginOtp, ResetPassword, Register } from "./pages/auth";

// Client pages
import { ClientDashboard } from "./pages/dashboard";
import { ParcelList, CreateParcel, ParcelDetail } from "./pages/parcels";
import PrintLabelPage from "./pages/parcels/PrintLabelPage";
import QRCodePage from "./pages/parcels/QRCodePage";
import { Pickups } from "./pages/pickups";
import { Support, TicketDetail } from "./pages/support";

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
import ApprovalsPage from "./pages/admin/ApprovalsPage";
import { ScanConsole } from "./pages/scan";
import { ParcelManagement } from "./pages/parcels";
import { PickupsManagement } from "./pages/pickups";
import { Payments, ClientPayments, Refunds } from "./pages/payments";
import { Notifications } from "./pages/notifications";
import { Analytics } from "./pages/analytics";
import { Compliance, RiskAlerts } from "./pages/compliance";
import InvoicesPage from "./pages/common/InvoicesPage";
import {
  AdvancedAnalyticsPage,
  AiAutomationDiscoveryPage,
  DistancePricingPage,
  AgentCounterCreatePage,
  AgentPickupsPage,
  FailedDeliveryReportPage,
  FinanceExceptionsPage,
  GpsTrackersPage,
  GrantRbacPermissionPage,
  HubBulkScanPage,
  IotGpsIngestionPage,
  LiveLogisticsPage,
  MobileGpsUpdatePage,
  NotificationTemplatesPage,
  OtpLogsPage,
  PickupRecommendationPage,
  ProfileSettingsPage,
  PublicQrVerificationPage,
  RbacPermissionsPage,
  RegisterGpsTrackerPage,
  RiskCasesPage,
  RouteOptimizationPage,
  StaffDeliveryMonitoringPage,
  StaffFinanceOverviewPage,
  StaffPaymentsPage,
  StaffSupportInboxPage,
  UssdMonitorPage,
} from "./pages/ops";

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
import { SessionTimeoutWarning } from "./components/SessionTimeoutWarning";
import { GlobalBackTrail } from "./components/GlobalBackTrail";

function App() {
  return (
    <Router>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/login-otp" element={<LoginOtp />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/qr/verify" element={<PublicQrVerificationPage />} />

          <Route
            path="/client/parcels/:parcelId/print-label"
            element={
              <ProtectedWrapper allowedRoles={["CLIENT"]}>
                <PrintLabelPage />
              </ProtectedWrapper>
            }
          />
          <Route
            path="/client/parcels/:id/qr"
            element={
              <ProtectedWrapper allowedRoles={["CLIENT"]}>
                <QRCodePage />
              </ProtectedWrapper>
            }
          />

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
            <Route path="parcels/new" element={<CreateParcel />} />
            <Route path="parcels/create" element={<CreateParcel />} />
            <Route path="parcels/:id" element={<ParcelDetail />} />
            <Route path="parcels/:id/qr" element={<QRCodePage />} />
            <Route path="parcels/:parcelId/pay-momo" element={<MoMoPaymentPage />} />
            <Route path="pickups" element={<Pickups />} />
            <Route path="pickups/:id" element={<PickupDetail />} />
            <Route path="payments" element={<ClientPayments />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="map" element={<RoleMapDashboard />} />
            <Route path="track" element={<TrackingPage />} />
            <Route path="tracking" element={<TrackingPage />} />
            <Route path="support" element={<Support />} />
            <Route path="support/:id" element={<TicketDetail />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<ProfileSettingsPage />} />
            <Route path="profile" element={<ProfileSettingsPage />} />
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
            <Route path="deliveries/:id/confirm" element={<ConfirmDelivery />} />
            <Route path="deliveries/confirm" element={<ConfirmDelivery />} />
            <Route path="deliveries/failed" element={<FailedDeliveryReportPage />} />
            <Route path="tracking" element={<TrackingPage />} />
            <Route path="map" element={<RoleMapDashboard />} />
            <Route path="live-logistics" element={<LiveLogisticsPage />} />
            <Route path="gps" element={<MobileGpsUpdatePage />} />
            <Route path="route-optimization" element={<RouteOptimizationPage />} />
            <Route path="scan" element={<ScanConsole />} />
            <Route path="scans" element={<ScanConsole />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<ProfileSettingsPage />} />
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
            <Route
              path="parcels/new"
              element={
                <>
                  <AgentCounterCreatePage />
                  <CreateParcel />
                </>
              }
            />
            <Route
              path="parcels/create"
              element={
                <>
                  <AgentCounterCreatePage />
                  <CreateParcel />
                </>
              }
            />
            <Route path="parcels" element={<ParcelManagement />} />
            <Route path="parcels/:id" element={<ParcelDetail />} />
            <Route path="pickups" element={<AgentPickupsPage />} />
            <Route path="pickups/:id" element={<PickupDetail />} />
            <Route path="delivery-tools" element={<FailedDeliveryReportPage />} />
            <Route path="tracking" element={<TrackingPage />} />
            <Route path="map" element={<RoleMapDashboard />} />
            <Route path="live-logistics" element={<LiveLogisticsPage />} />
            <Route path="gps" element={<MobileGpsUpdatePage />} />
            <Route path="route-optimization" element={<RouteOptimizationPage />} />
            <Route path="scan" element={<ScanConsole />} />
            <Route path="scans" element={<ScanConsole />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<ProfileSettingsPage />} />
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
            <Route path="pickups/:id" element={<PickupDetail />} />
            <Route path="deliveries" element={<StaffDeliveryMonitoringPage />} />
            <Route path="payments" element={<StaffPaymentsPage />} />
            <Route path="finance" element={<StaffFinanceOverviewPage />} />
            <Route path="support" element={<StaffSupportInboxPage />} />
            <Route path="support/:id" element={<TicketDetail />} />
            <Route path="parcels" element={<ParcelManagement />} />
            <Route path="parcels/:id" element={<ParcelDetail />} />
            <Route path="parcels/:id/qr" element={<QRCodePage />} />
            <Route path="tracking" element={<TrackingPage />} />
            <Route path="map" element={<RoleMapDashboard />} />
            <Route path="live-logistics" element={<LiveLogisticsPage />} />
            <Route path="gps" element={<MobileGpsUpdatePage />} />
            <Route path="gps-trackers" element={<GpsTrackersPage />} />
            <Route path="gps-trackers/new" element={<RegisterGpsTrackerPage />} />
            <Route path="iot-gps" element={<IotGpsIngestionPage />} />
            <Route path="route-optimization" element={<RouteOptimizationPage />} />
            <Route path="pickup-recommendations" element={<PickupRecommendationPage />} />
            <Route path="distance-pricing" element={<DistancePricingPage />} />
            <Route path="scan" element={<ScanConsole />} />
            <Route path="scans" element={<ScanConsole />} />
            <Route path="bulk-scans" element={<HubBulkScanPage />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="notification-templates" element={<NotificationTemplatesPage />} />
            <Route path="otp-logs" element={<OtpLogsPage />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="advanced-analytics" element={<AdvancedAnalyticsPage />} />
            <Route path="operations-intelligence" element={<OperationsIntelligencePage />} />
            <Route path="ai-discovery" element={<AiAutomationDiscoveryPage />} />
            <Route path="integrations" element={<IntegrationManagement />} />
            <Route path="profile" element={<ProfileSettingsPage />} />
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
            {/* Debug route — ApiCoverage renders null in production */}
            {import.meta.env.DEV && (
              <Route path="api-coverage" element={<ApiCoverage />} />
            )}
            <Route path="parcels" element={<ParcelManagement />} />
            <Route path="parcels/:id" element={<ParcelDetail />} />
            <Route path="parcels/:id/qr" element={<QRCodePage />} />
            <Route path="pickups" element={<PickupsManagement />} />
            <Route path="pickups/:id" element={<PickupDetail />} />
            <Route path="deliveries" element={<StaffDeliveryMonitoringPage />} />
            <Route path="payments" element={<Payments />} />
            <Route path="support" element={<StaffSupportInboxPage />} />
            <Route path="support/:id" element={<TicketDetail />} />
            <Route path="tracking" element={<TrackingPage />} />
            <Route path="map" element={<RoleMapDashboard />} />
            <Route path="live-logistics" element={<LiveLogisticsPage />} />
            <Route path="gps" element={<MobileGpsUpdatePage />} />
            <Route path="gps-trackers" element={<GpsTrackersPage />} />
            <Route path="gps-trackers/new" element={<RegisterGpsTrackerPage />} />
            <Route path="iot-gps" element={<IotGpsIngestionPage />} />
            <Route path="route-optimization" element={<RouteOptimizationPage />} />
            <Route path="pickup-recommendations" element={<PickupRecommendationPage />} />
            <Route path="distance-pricing" element={<DistancePricingPage />} />
            <Route path="scan" element={<ScanConsole />} />
            <Route path="scans" element={<ScanConsole />} />
            <Route path="bulk-scans" element={<HubBulkScanPage />} />
            <Route path="staff" element={<StaffDashboard />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="notification-templates" element={<NotificationTemplatesPage />} />
            <Route path="otp-logs" element={<OtpLogsPage />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="advanced-analytics" element={<AdvancedAnalyticsPage />} />
            <Route path="operations-intelligence" element={<OperationsIntelligencePage />} />
            <Route path="ai-discovery" element={<AiAutomationDiscoveryPage />} />
            <Route path="rbac-permissions" element={<RbacPermissionsPage />} />
            <Route path="rbac-permissions/grant" element={<GrantRbacPermissionPage />} />
            {/* User Management Routes */}
            <Route path="users/clients" element={<ClientManagement />} />
            <Route path="users/agents" element={<AgentManagement />} />
            <Route path="users/agencies" element={<AgencyManagement />} />
            <Route path="users/staff" element={<StaffManagement />} />
            <Route path="users/couriers" element={<CourierManagement />} />
            <Route path="clients" element={<ClientManagement />} />
            <Route path="agents" element={<AgentManagement />} />
            <Route path="agencies" element={<AgencyManagement />} />
            <Route path="staff-management" element={<StaffManagement />} />
            <Route path="couriers" element={<CourierManagement />} />
            {/* System Management Routes */}
            <Route path="tariffs" element={<TariffManagement />} />
            <Route path="integrations" element={<IntegrationManagement />} />
            <Route path="ussd" element={<UssdMonitorPage />} />
            <Route path="accounts" element={<UserAccountManagement />} />
            <Route path="profile" element={<ProfileSettingsPage />} />
            {/* Finance Management */}
            <Route path="finance" element={<AdminFinanceDashboard />} />
            <Route path="finance/create" element={<CreateFinancePage />} />
            {/* Risk Management */}
            <Route path="risk" element={<RiskDashboard />} />
            <Route path="risk/create" element={<CreateRiskPage />} />
            <Route path="risk/create-user" element={<CreateRiskUserPage />} />
            {/* Self-Healing System (SPEC SECTION 15) */}
            <Route path="self-healing" element={<SelfHealingDashboard />} />
            <Route path="approvals" element={<ApprovalsPage />} />
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
            <Route path="payments/:paymentId" element={<Payments />} />
            <Route path="refunds" element={<Refunds />} />
            <Route path="refunds/:refundId" element={<Refunds />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="invoices/:invoiceId" element={<InvoicesPage />} />
            <Route path="exceptions" element={<FinanceExceptionsPage />} />
            <Route path="map" element={<RoleMapDashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<ProfileSettingsPage />} />
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
            <Route path="alerts/:riskAlertId" element={<RiskAlerts />} />
            <Route path="map" element={<RoleMapDashboard />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="compliance/new" element={<Compliance />} />
            <Route path="cases" element={<RiskCasesPage />} />
            <Route path="integrations" element={<IntegrationManagement />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<ProfileSettingsPage />} />
          </Route>

          {/* Legacy/backward-compatible paths */}
          <Route
            path="/courier/pickup/:id"
            element={
              <ProtectedWrapper allowedRoles={["COURIER", "AGENT", "STAFF", "ADMIN"]}>
                <PickupDetail />
              </ProtectedWrapper>
            }
          />
          <Route
            path="/courier/delivery/:id"
            element={
              <ProtectedWrapper allowedRoles={["COURIER", "AGENT", "STAFF", "ADMIN"]}>
                <DeliveryDetail />
              </ProtectedWrapper>
            }
          />
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

          <Route
            path="/maps/viewer"
            element={
              <ProtectedWrapper allowedRoles={["CLIENT", "AGENT", "COURIER", "STAFF", "ADMIN", "FINANCE", "RISK"]}>
                <MapViewer />
              </ProtectedWrapper>
            }
          />
          <Route
            path="/maps/pickups"
            element={
              <ProtectedWrapper allowedRoles={["COURIER", "AGENT", "STAFF", "ADMIN"]}>
                <PickupMap />
              </ProtectedWrapper>
            }
          />
          <Route
            path="/maps/tracking"
            element={
              <ProtectedWrapper allowedRoles={["CLIENT", "AGENT", "COURIER", "STAFF", "ADMIN"]}>
                <TrackingMap />
              </ProtectedWrapper>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
          {/* Debug routes — only available in development */}
          {import.meta.env.DEV && (
            <Route path="/mtn-test" element={<MtnTest />} />
          )}
        </Routes>
      </Suspense>
      {/* AI Chatbot - Available on all pages */}
      {/* Session Timeout Monitor — silently refreshes token or warns user */}
      <SessionTimeoutWarning />
      <GlobalBackTrail />
      <AIChatbot />
    </Router>
  );
}

export default App;
