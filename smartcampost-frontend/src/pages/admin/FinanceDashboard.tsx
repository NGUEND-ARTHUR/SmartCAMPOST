import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  RefreshCw,
  CreditCard,
  ArrowUp,
  ArrowDown,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface FinanceStats {
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  refundsPending: number;
  revenueGrowth: number;
}

export default function FinanceDashboard() {
  const [stats] = useState<FinanceStats>({
    totalRevenue: 245680,
    pendingPayments: 15420,
    completedPayments: 230260,
    refundsPending: 4850,
    revenueGrowth: 12.5,
  });

  const revenueData = [
    { date: "Jan", revenue: 18500 },
    { date: "Feb", revenue: 21200 },
    { date: "Mar", revenue: 19800 },
    { date: "Apr", revenue: 24300 },
    { date: "May", revenue: 28900 },
    { date: "Jun", revenue: 32100 },
  ];

  const paymentData = [
    { method: "Credit Card", amount: 125000 },
    { method: "Debit Card", amount: 78000 },
    { method: "PayPal", amount: 32000 },
    { method: "Bank Transfer", amount: 10680 },
  ];

  const recentTransactions = [
    {
      id: "1",
      type: "Payment",
      amount: 150.0,
      status: "Completed",
      customer: "John Doe",
      date: "2026-01-10",
    },
    {
      id: "2",
      type: "Refund",
      amount: -45.0,
      status: "Processing",
      customer: "Jane Smith",
      date: "2026-01-10",
    },
    {
      id: "3",
      type: "Payment",
      amount: 230.0,
      status: "Completed",
      customer: "Mike Johnson",
      date: "2026-01-09",
    },
    {
      id: "4",
      type: "Payment",
      amount: 89.5,
      status: "Completed",
      customer: "Sarah Davis",
      date: "2026-01-09",
    },
    {
      id: "5",
      type: "Refund",
      amount: -120.0,
      status: "Completed",
      customer: "Bob Wilson",
      date: "2026-01-08",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Processing":
        return "bg-yellow-100 text-yellow-800";
      case "Pending":
        return "bg-orange-100 text-orange-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2">Finance Dashboard</h1>
            <p className="text-gray-600">
              Monitor payments, revenue, and refunds
            </p>
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-500 text-sm mb-1">Total Revenue</p>
                <p className="text-3xl font-semibold text-gray-900">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">
                {stats.revenueGrowth}%
              </span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-500 text-sm mb-1">Pending Payments</p>
                <p className="text-3xl font-semibold text-gray-900">
                  ${stats.pendingPayments.toLocaleString()}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Awaiting processing</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-500 text-sm mb-1">Completed Payments</p>
                <p className="text-3xl font-semibold text-gray-900">
                  ${stats.completedPayments.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Successfully processed</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-500 text-sm mb-1">Pending Refunds</p>
                <p className="text-3xl font-semibold text-gray-900">
                  ${stats.refundsPending.toLocaleString()}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <RefreshCw className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Awaiting approval</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="mb-6">Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number | string) => `$${value}`} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="mb-6">Payment Methods</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis />
                <Tooltip formatter={(value: number | string) => `$${value}`} />
                <Bar dataKey="amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="font-semibold">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transaction.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`font-semibold ${transaction.amount < 0 ? "text-red-600" : "text-green-600"}`}
                      >
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transaction.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
