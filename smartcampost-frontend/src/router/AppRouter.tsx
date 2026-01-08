import { Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoute, getHomeByRole } from "./PrivateRoute";
import { RoleGuard } from "../app/router/RoleGuard";

import Login from "../pages/auth/Login";
import LoginOtp from "../pages/auth/LoginOtp";
import ResetPassword from "../pages/auth/ResetPassword";

import AdminLayout from "../components/layout/AdminLayout";
import AgentLayout from "../components/layout/AgentLayout";
import ClientLayout from "../components/layout/ClientLayout";
import CourierLayout from "../components/layout/CourierLayout";

// Admin pages
import AdminDashboard from "../pages/admin/AdminDashboard";

// Agent pages
import AgentDashboard from "../pages/agent/AgentDashboard";
import ParcelRegistration from "../pages/agent/ParcelRegistration";
import ScanParcel from "../pages/agent/ScanParcel";
import ParcelManagement from "../pages/agent/ParcelManagement";

// Courier pages
import CourierDashboard from "../pages/courier/CourierDashboard";

// Client pages
import LandingPage from "../pages/client/LandingPage";
import TrackingPage from "../pages/client/TrackingPage";
import ClientDashboard from "../pages/client/ClientDashboard";
import CreateParcel from "../pages/client/CreateParcel";
import PickupRequest from "../pages/client/PickupRequest";
import Payments from "../pages/client/Payments";
import Profile from "../pages/client/Profile";
import SupportTickets from "../pages/client/SupportTickets";

// Legacy pages (keeping for compatibility)
import ParcelList from "../pages/parcels/ParcelList";
import ParcelDetails from "../pages/parcels/ParcelDetails";
import MyParcelList from "../pages/parcels/MyParcelList";
import ParcelTracking from "../pages/parcels/ParcelTracking";
import PublicTracking from "../pages/tracking/PublicTracking";
import DeliveryConfirmStepper from "../pages/delivery/DeliveryConfirmStepper";

import { useAuth } from "../context/AuthContext";

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={getHomeByRole(user?.role)} replace />;
}

function Unauthorized() {
  return <div className="flex items-center justify-center h-screen">Unauthorized Access</div>;
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/login-otp" element={<LoginOtp />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      {/* Quick public tracking entry */}
      <Route path="/track" element={<TrackingPage />} />
      <Route path="/tracking" element={<TrackingPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected */}
      <Route element={<PrivateRoute />}>
        {/* Redirect after login to role home */}
        <Route path="/home" element={<HomeRedirect />} />

        {/* Admin/Staff (admin namespace) */}
        <Route element={<RoleGuard allowedRoles={["ADMIN", "STAFF"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            {/* Parcels (Admin/Staff global) */}
            <Route path="parcels" element={<ParcelList />} />
            <Route path="parcels/:parcelId" element={<ParcelDetails />} />
            <Route path="parcels/new" element={<CreateParcel />} />
            <Route path="parcels/create" element={<CreateParcel />} />
            <Route path="parcels/track" element={<ParcelTracking />} />
          </Route>
        </Route>

        {/* Agent */}
        <Route element={<RoleGuard allowedRoles={["AGENT"]} />}>
          <Route path="/agent" element={<AgentLayout />}>
            <Route index element={<AgentDashboard />} />
            <Route path="dashboard" element={<AgentDashboard />} />
            <Route path="register-parcel" element={<ParcelRegistration />} />
            <Route path="scan-parcel" element={<ScanParcel />} />
            <Route path="manage-parcels" element={<ParcelManagement />} />
            {/* Parcels (Agent can also access) */}
            <Route path="parcels" element={<ParcelList />} />
            <Route path="parcels/:parcelId" element={<ParcelDetails />} />
            <Route path="parcels/new" element={<CreateParcel />} />
            <Route path="parcels/create" element={<CreateParcel />} />
            <Route path="parcels/track" element={<ParcelTracking />} />
          </Route>
        </Route>

        {/* Courier */}
        <Route element={<RoleGuard allowedRoles={["COURIER"]} />}>
          <Route path="/courier" element={<CourierLayout />}>
            <Route index element={<CourierDashboard />} />
            <Route path="dashboard" element={<CourierDashboard />} />
            {/* Courier parcel view */}
            <Route path="parcels/:parcelId" element={<ParcelDetails />} />
            <Route path="parcels/track" element={<ParcelTracking />} />
            <Route
              path="deliveries/:parcelId/confirm"
              element={<DeliveryConfirmStepper />}
            />
          </Route>
        </Route>

        {/* Client */}
        <Route element={<RoleGuard allowedRoles={["CLIENT"]} />}>
          <Route path="/client" element={<ClientLayout />}>
            <Route index element={<ClientDashboard />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="create-parcel" element={<CreateParcel />} />
            <Route path="pickup-request" element={<PickupRequest />} />
            <Route path="payments" element={<Payments />} />
            <Route path="profile" element={<Profile />} />
            <Route path="support" element={<SupportTickets />} />
            {/* Client parcels */}
            <Route path="parcels" element={<MyParcelList />} />
            <Route path="parcels/:parcelId" element={<ParcelDetails />} />
            <Route path="parcels/new" element={<CreateParcel />} />
            <Route path="parcels/create" element={<CreateParcel />} />
            <Route path="track" element={<ParcelTracking />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}
