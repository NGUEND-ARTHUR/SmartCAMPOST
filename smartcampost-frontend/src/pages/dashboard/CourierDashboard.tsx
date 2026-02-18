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
      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      : priority === "normal"
        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        : "bg-muted text-muted-foreground";

  const getTaskTypeIcon = (type: string) =>
    type === "pickup" ? Package : Truck;

  const cards = [
    {
      title: t("courierDashboard.stats.pendingPickups"),
      value: stats.pendingPickups,
      icon: Package,
    },
    {
      title: t("courierDashboard.stats.pendingDeliveries"),
      value: stats.pendingDeliveries,
      icon: Truck,
    },
    {
      title: t("courierDashboard.stats.completedToday"),
      value: stats.completedToday,
      icon: CheckCircle2,
    },
    {
      title: t("courierDashboard.stats.distanceKm"),
      value: stats.totalDistance,
      icon: MapPin,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="mb-2">{t("courierDashboard.title")}</h1>
          <p className="text-muted-foreground">
            {t("courierDashboard.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card, i) => (
            <div key={i} className="bg-card rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">
                    {card.title}
                  </p>
                  <p className="text-3xl font-semibold text-foreground">
                    {card.value}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                  <card.icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-lg shadow mb-6">
          <div className="border-b border-border">
            <nav className="flex -mb-px">
              <button
                onClick={() => setFilter("all")}
                className={`px-6 py-4 border-b-2 font-medium text-sm ${
                  filter === "all"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {t("courierDashboard.tabs.allTasks", { count: tasks.length })}
              </button>

              <button
                onClick={() => setFilter("pickup")}
                className={`px-6 py-4 border-b-2 font-medium text-sm ${
                  filter === "pickup"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {t("courierDashboard.tabs.pickups", {
                  count: tasks.filter((t) => t.type === "pickup").length,
                })}
              </button>

              <button
                onClick={() => setFilter("delivery")}
                className={`px-6 py-4 border-b-2 font-medium text-sm ${
                  filter === "delivery"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {t("courierDashboard.tabs.deliveries", {
                  count: tasks.filter((t) => t.type === "delivery").length,
                })}
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
                className="bg-card rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div
                        className={`p-3 rounded-full ${task.type === "pickup" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-green-100 dark:bg-green-900/30"}`}
                      >
                        <Icon
                          className={`w-6 h-6 ${task.type === "pickup" ? "text-blue-600" : "text-green-600"}`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-foreground">
                            {task.trackingNumber}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground capitalize">
                            {task.type}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center text-muted-foreground text-sm">
                            <MapPin className="w-4 h-4 mr-2" />
                            {task.address}
                          </div>
                          <div className="flex items-center text-muted-foreground text-sm">
                            <Clock className="w-4 h-4 mr-2" />
                            Scheduled:{" "}
                            {new Date(task.scheduledTime).toLocaleString()}
                          </div>
                          <div className="text-muted-foreground text-sm">
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
                        className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent transition-colors text-sm whitespace-nowrap"
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
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="mb-2 text-foreground">
                  {t("courierDashboard.noTasksFound")}
                </h3>
                <p className="text-muted-foreground">
                  {t("courierDashboard.noTasksMessage", {
                    filter:
                      filter !== "all"
                        ? t(`courierDashboard.tabs.${filter}`)
                        : "",
                  })}
                </p>
                <div className="mt-6 flex justify-center space-x-3">
                  <button
                    onClick={() => navigate(`/courier/pickups`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                  >
                    {t("courierDashboard.actions.goToPickups")}
                  </button>
                  <button
                    onClick={() => navigate(`/courier/deliveries`)}
                    className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent transition-colors text-sm whitespace-nowrap"
                  >
                    {t("courierDashboard.actions.goToDeliveries")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
