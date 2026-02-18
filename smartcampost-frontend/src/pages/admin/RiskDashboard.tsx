import { useState } from "react";
import {
  AlertTriangle,
  Shield,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  FileWarning,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface RiskStats {
  activeAlerts: number;
  resolvedAlerts: number;
  complianceScore: number;
  fraudDetected: number;
}

export default function RiskDashboard() {
  const [stats] = useState<RiskStats>({
    activeAlerts: 12,
    resolvedAlerts: 145,
    complianceScore: 94.5,
    fraudDetected: 8,
  });

  const alertsByType = [
    { name: "Suspicious Activity", value: 5, color: "#ef4444" },
    { name: "Payment Fraud", value: 3, color: "#f59e0b" },
    { name: "Address Mismatch", value: 2, color: "#eab308" },
    { name: "Policy Violation", value: 2, color: "#8b5cf6" },
  ];

  const weeklyAlerts = [
    { day: "Mon", alerts: 8 },
    { day: "Tue", alerts: 12 },
    { day: "Wed", alerts: 6 },
    { day: "Thu", alerts: 15 },
    { day: "Fri", alerts: 10 },
    { day: "Sat", alerts: 4 },
    { day: "Sun", alerts: 3 },
  ];

  const recentAlerts = [
    {
      id: "1",
      severity: "high",
      type: "Suspicious Activity",
      description: "Multiple parcels to same address in short time",
      tracking: "PKG123456",
      time: "10 min ago",
      status: "active",
    },
    {
      id: "2",
      severity: "medium",
      type: "Payment Fraud",
      description: "Payment source flagged by fraud detection",
      tracking: "PKG789012",
      time: "1 hour ago",
      status: "investigating",
    },
    {
      id: "3",
      severity: "high",
      type: "Address Mismatch",
      description: "Billing and shipping address in different countries",
      tracking: "PKG345678",
      time: "2 hours ago",
      status: "active",
    },
    {
      id: "4",
      severity: "low",
      type: "Policy Violation",
      description: "Package weight exceeds declared limit",
      tracking: "PKG901234",
      time: "3 hours ago",
      status: "resolved",
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "investigating":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "resolved":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      default:
        return <FileWarning className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-800";
      case "investigating":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Risk Management Dashboard</h1>
          <p className="text-gray-600">
            Monitor and manage security alerts and compliance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Active Alerts</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {stats.activeAlerts}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Resolved Alerts</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {stats.resolvedAlerts}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Compliance Score</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {stats.complianceScore}%
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Fraud Detected</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {stats.fraudDetected}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <XCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="mb-6">Weekly Alert Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyAlerts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="alerts" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Alerts by Type */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="mb-6">Alerts by Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={alertsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({
                    name,
                    percent,
                  }: {
                    name: string;
                    percent: number;
                  }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {alertsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold">Recent Risk Alerts</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All Alerts →
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="bg-gray-100 p-2 rounded-full">
                      {getStatusIcon(alert.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {alert.type}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}
                        >
                          {alert.severity}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}
                        >
                          {alert.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Tracking: {alert.tracking}</span>
                        <span>•</span>
                        <span>{alert.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Investigate
                    </button>
                    <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
