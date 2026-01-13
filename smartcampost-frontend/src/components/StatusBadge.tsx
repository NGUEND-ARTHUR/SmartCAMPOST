import * as React from "react";

export const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    // ParcelStatus
    CREATED: "bg-gray-100 text-gray-800",
    ACCEPTED: "bg-indigo-100 text-indigo-800",
    IN_TRANSIT: "bg-blue-100 text-blue-800",
    ARRIVED_HUB: "bg-sky-100 text-sky-800",
    OUT_FOR_DELIVERY: "bg-yellow-100 text-yellow-800",
    DELIVERED: "bg-green-100 text-green-800",
    RETURNED: "bg-orange-100 text-orange-800",
    CANCELLED: "bg-red-100 text-red-800",

    // PickupRequestState
    REQUESTED: "bg-gray-100 text-gray-800",
    ASSIGNED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
  };

  const className = styles[status] ?? "bg-gray-100 text-gray-800";

  // IMPORTANT: display exact backend flow name
  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-xs rounded ${className}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
