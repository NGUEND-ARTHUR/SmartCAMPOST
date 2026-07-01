import { Navigate } from "react-router-dom";

// This route is superseded by the full tracking search page.
export default function TrackingMapPage() {
  return <Navigate to="/client/tracking" replace />;
}
