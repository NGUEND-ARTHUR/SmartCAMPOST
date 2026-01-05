import { Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoute, getHomeByRole } from "./PrivateRoute";

import Login from "../pages/auth/Login";

import AdminLayout from "../layouts/AdminLayout";
import AgentLayout from "../layouts/AgentLayout";
import ClientLayout from "../layouts/ClientLayout";
import DeliveryLayout from "../layouts/DeliveryLayout";

import AdminDashboard from "../pages/dashboard/AdminDashboard";
import AgentDashboard from "../pages/dashboard/AgentDashboard";
import ClientDashboard from "../pages/dashboard/ClientDashboard";
import DeliveryDashboard from "../pages/dashboard/DeliveryDashboard";

import ParcelList from "../pages/parcels/ParcelList";
import ParcelDetails from "../pages/parcels/ParcelDetails";
import MyParcelList from "../pages/parcels/MyParcelList";
import CreateParcel from "../pages/parcels/CreateParcel";
import ParcelTracking from "../pages/parcels/ParcelTracking";

import { useAuth } from "../context/AuthContext";

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={getHomeByRole(user?.role)} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected */}
      <Route element={<PrivateRoute />}>
        {/* Redirect root to role home */}
        <Route path="/" element={<HomeRedirect />} />

        {/* Admin/Staff */}
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          {/* Parcels (Admin/Staff global) */}
          <Route path="parcels" element={<ParcelList />} />
          <Route path="parcels/:parcelId" element={<ParcelDetails />} />
          <Route path="parcels/create" element={<CreateParcel />} />
          <Route path="parcels/track" element={<ParcelTracking />} />
        </Route>

        {/* Agent */}
        <Route path="/agent" element={<AgentLayout />}>
          <Route index element={<AgentDashboard />} />
          {/* Parcels (Agent can also access) */}
          <Route path="parcels" element={<ParcelList />} />
          <Route path="parcels/:parcelId" element={<ParcelDetails />} />
          <Route path="parcels/create" element={<CreateParcel />} />
          <Route path="parcels/track" element={<ParcelTracking />} />
        </Route>

        {/* Courier */}
        <Route path="/courier" element={<DeliveryLayout />}>
          <Route index element={<DeliveryDashboard />} />
          {/* Courier parcel view */}
          <Route path="parcels/:parcelId" element={<ParcelDetails />} />
          <Route path="parcels/track" element={<ParcelTracking />} />
        </Route>

        {/* Client */}
        <Route path="/client" element={<ClientLayout />}>
          <Route index element={<ClientDashboard />} />
          {/* Client parcels */}
          <Route path="parcels" element={<MyParcelList />} />
          <Route path="parcels/:parcelId" element={<ParcelDetails />} />
          <Route path="parcels/create" element={<CreateParcel />} />
          <Route path="track" element={<ParcelTracking />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
