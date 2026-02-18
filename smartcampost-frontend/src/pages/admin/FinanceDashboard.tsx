import { useState, useEffect } from "react";
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
import { financeService, type RefundRecord } from "@/services/financeService";

interface FinanceStats {
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  refundsPending: number;
  revenueGrowth: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  customer: string;
  date: string;
}

type RevenuePoint = {
  date: string;
  revenue: number;
};

type PaymentBreakdownPoint = {
  method: string;
  amount: number;
};

function buildRevenueData(
  statsData: FinanceStats,
  refunds: RefundRecord[],
): RevenuePoint[] {
  const byMonth = new Map<string, number>();

  for (const refund of refunds) {
    if (!refund.createdAt || typeof refund.amount !== "number") continue;
    const d = new Date(refund.createdAt);
    const key = d.toLocaleDateString(undefined, { month: "short" });
    const previous = byMonth.get(key) ?? 0;
    byMonth.set(key, previous - Math.abs(refund.amount));
  }

  const currentMonthKey = new Date().toLocaleDateString(undefined, {
    month: "short",
  });
  byMonth.set(
    currentMonthKey,
    (byMonth.get(currentMonthKey) ?? 0) + statsData.totalRevenue,
  );

  return Array.from(byMonth.entries()).map(([date, revenue]) => ({
    date,
    revenue: Number(revenue.toFixed(2)),
  }));
}

function buildPaymentBreakdown(
  statsData: FinanceStats,
): PaymentBreakdownPoint[] {
  return [
    { method: "Completed", amount: statsData.completedPayments },
    { method: "Pending", amount: statsData.pendingPayments },
    { method: "Refunds", amount: statsData.refundsPending },
  ];
}

const toTransaction = (refund: RefundRecord): Transaction => ({
  id: String(refund.id ?? `refund-${Date.now()}`),
  type: "Refund",
  amount: typeof refund.amount === "number" ? -Math.abs(refund.amount) : 0,
  status: refund.status ?? "Pending",
  customer: typeof refund.reason === "string" ? refund.reason : "Refund",
  date: refund.createdAt
    ? new Date(refund.createdAt).toLocaleDateString()
    : "-",
});

export default function FinanceDashboard() {
  const [stats, setStats] = useState<FinanceStats>({
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    refundsPending: 0,
    revenueGrowth: 0,
  });

  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentBreakdownPoint[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsData, refunds] = await Promise.all([
        financeService.getStats(),
        financeService.getRefunds(),
      ]);

      if (statsData) {
        setStats(statsData);
        setPaymentData(buildPaymentBreakdown(statsData));
      }

      if (refunds) {
        setRecentTransactions(refunds.slice(0, 5).map(toTransaction));
        setRevenueData(buildRevenueData(statsData, refunds));
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(errorMsg);
      console.error("Dashboard error:", err);
    } finally {
      setIsLoading(false);
    }
  };

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
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2">Finance Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor payments, revenue, and refunds
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">
                      Total Revenue
                    </p>
                    <p className="text-3xl font-semibold text-foreground">
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
                  <span className="text-muted-foreground ml-1">
                    vs last month
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">
                      Pending Payments
                    </p>
                    <p className="text-3xl font-semibold text-foreground">
                      ${stats.pendingPayments.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full">
                    <CreditCard className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Awaiting processing
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">
                      Completed Payments
                    </p>
                    <p className="text-3xl font-semibold text-foreground">
                      ${stats.completedPayments.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Successfully processed
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">
                      Pending Refunds
                    </p>
                    <p className="text-3xl font-semibold text-foreground">
                      ${stats.refundsPending.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <RefreshCw className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Awaiting approval
                </p>
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
                    <Tooltip
                      formatter={(value: number | string) => `$${value}`}
                    />
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
                    <Tooltip
                      formatter={(value: number | string) => `$${value}`}
                    />
                    <Bar dataKey="amount" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-border">
                <h2 className="font-semibold">Recent Transactions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border">
                    {recentTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-accent">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-foreground">
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {transaction.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
