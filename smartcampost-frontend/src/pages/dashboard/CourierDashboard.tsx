import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useCourierPickups, useMyParcels } from "@/hooks";

export default function CourierDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "pickup" | "delivery">("all");

  const { data: pickupsData, isLoading: pickupsLoading } = useCourierPickups(
    0,
    50,
  );
  const { data: parcelsData, isLoading: parcelsLoading } = useMyParcels(0, 50);

  const isLoading = pickupsLoading || parcelsLoading;
  const pickups = pickupsData?.content ?? [];
  const parcels = parcelsData?.content ?? [];

  // Filter parcels for deliveries (OUT_FOR_DELIVERY, IN_TRANSIT)
  const deliveries = parcels.filter(
    (p) => p.status === "OUT_FOR_DELIVERY" || p.status === "IN_TRANSIT",
  );

  // Calculate stats
  const stats = {
    pendingPickups: pickups.filter(
      (p) => p.state === "ASSIGNED" || p.state === "PENDING",
    ).length,
    pendingDeliveries: deliveries.length,
    completedToday:
      pickups.filter((p) => p.state === "COMPLETED").length +
      parcels.filter((p) => p.status === "DELIVERED").length,
    totalDistance: 0, // Would come from a dedicated endpoint
  };

  // Create unified task list
  const tasks = [
    ...pickups.map((p) => ({
      id: p.id,
      type: "pickup" as const,
      trackingNumber: p.trackingRef || p.id.slice(0, 10),
      address: p.clientName || p.clientId.slice(0, 8),
      customerName: p.clientName || "Client",
      customerPhone: "",
      scheduledTime: p.requestedDate || "",
      priority: "normal" as const,
    })),
    ...deliveries.map((d) => ({
      id: d.id,
      type: "delivery" as const,
      trackingNumber: d.trackingRef || d.id.slice(0, 10),
      address: "Delivery address",
      customerName: "Recipient",
      customerPhone: "",
      scheduledTime: d.createdAt || "",
      priority: "normal" as const,
    })),
  ];

  const filteredTasks = tasks.filter((task) =>
    filter === "all" ? true : task.type === filter,
  );

  const getPriorityColor = (priority: string) =>
    priority === "high"
      ? "bg-red-100 text-red-800"
      : priority === "normal"
        ? "bg-blue-100 text-blue-800"
        : "bg-gray-100 text-gray-800";

  const getTaskTypeIcon = (type: string) =>
    type === "pickup" ? Package : Truck;

  const cards = [
    { title: "Pending Pickups", value: stats.pendingPickups, icon: Package },
    {
      title: "Pending Deliveries",
      value: stats.pendingDeliveries,
      icon: Truck,
    },
    {
      title: "Completed Today",
      value: stats.completedToday,
      icon: CheckCircle2,
    },
    { title: "Distance (km)", value: stats.totalDistance, icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="mb-2">Courier Dashboard</h1>
          <p className="text-gray-600">Manage your pickups and deliveries</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">{card.title}</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    {card.value}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <card.icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setFilter("all")}
                className={`px-6 py-4 border-b-2 font-medium text-sm ${
                  filter === "all"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500"
                }`}
              >
                All Tasks ({tasks.length})
              </button>

              <button
                onClick={() => setFilter("pickup")}
                className={`px-6 py-4 border-b-2 font-medium text-sm ${
                  filter === "pickup"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500"
                }`}
              >
                Pickups ({tasks.filter((t) => t.type === "pickup").length})
              </button>

              <button
                onClick={() => setFilter("delivery")}
                className={`px-6 py-4 border-b-2 font-medium text-sm ${
                  filter === "delivery"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500"
                }`}
              >
                Deliveries ({tasks.filter((t) => t.type === "delivery").length})
              </button>
            </nav>
          </div>
        </div>

        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const Icon = getTaskTypeIcon(task.type);
            return (
              <div
                key={task.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div
                        className={`p-3 rounded-full ${task.type === "pickup" ? "bg-blue-100" : "bg-green-100"}`}
                      >
                        <Icon
                          className={`w-6 h-6 ${task.type === "pickup" ? "text-blue-600" : "text-green-600"}`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {task.trackingNumber}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                            {task.type}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center text-gray-600 text-sm">
                            <MapPin className="w-4 h-4 mr-2" />
                            {task.address}
                          </div>
                          <div className="flex items-center text-gray-600 text-sm">
                            <Clock className="w-4 h-4 mr-2" />
                            Scheduled:{" "}
                            {new Date(task.scheduledTime).toLocaleString()}
                          </div>
                          <div className="text-gray-600 text-sm">
                            <span className="font-medium">Customer:</span>{" "}
                            {task.customerName} • {task.customerPhone}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() =>
                          navigate(
                            `/courier/${task.type === "pickup" ? "pickups" : "deliveries"}/${task.id}`,
                          )
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                      >
                        Start Task
                      </button>
                      <button
                        onClick={() =>
                          navigate(
                            `/courier/${task.type === "pickup" ? "pickups" : "deliveries"}/${task.id}`,
                          )
                        }
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="max-w-sm mx-auto">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="mb-2 text-gray-900">No tasks found</h3>
                <p className="text-gray-500">
                  There are no {filter !== "all" ? filter : ""} tasks at the
                  moment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
