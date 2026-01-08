import { useState } from "react";
import { useListPayments, useMakePayment } from "../../../hooks/payments";
import { Badge } from "../../components/ui/Badge";

export default function Payments() {
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const { data: payments, isLoading } = useListPayments();
  const makePayment = useMakePayment();

  const handlePayment = async (paymentId: number, method: string) => {
    try {
      await makePayment.mutateAsync({
        paymentId,
        method,
      });
      // Refresh payments list
      window.location.reload(); // Simple refresh, could be improved with invalidation
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "COMPLETED": return "success";
      case "PENDING": return "warning";
      case "FAILED": return "error";
      default: return "default";
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading payments...</div>;
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payments</h1>
          <p className="text-slate-600">View and manage your payment history and pending payments.</p>
        </div>

        {/* Payment Summary */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-slate-500">Total Paid</h3>
            <p className="text-3xl font-bold text-green-600">
              {payments?.filter(p => p.status === "COMPLETED").reduce((sum, p) => sum + p.amount, 0) || 0} FCFA
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-slate-500">Pending</h3>
            <p className="text-3xl font-bold text-amber-600">
              {payments?.filter(p => p.status === "PENDING").reduce((sum, p) => sum + p.amount, 0) || 0} FCFA
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-slate-500">This Month</h3>
            <p className="text-3xl font-bold text-slate-900">
              {payments?.filter(p => {
                const paymentDate = new Date(p.createdAt);
                const now = new Date();
                return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
              }).reduce((sum, p) => sum + p.amount, 0) || 0} FCFA
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-slate-500">Failed</h3>
            <p className="text-3xl font-bold text-red-600">
              {payments?.filter(p => p.status === "FAILED").length || 0}
            </p>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Payment History</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {payments?.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {payment.reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {payment.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {payment.amount} FCFA
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(payment.status)}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {payment.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePayment(payment.id, "MOBILE_MONEY")}
                            disabled={makePayment.isPending}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          >
                            Pay with Mobile Money
                          </button>
                          <button
                            onClick={() => handlePayment(payment.id, "CARD")}
                            disabled={makePayment.isPending}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            Pay with Card
                          </button>
                        </div>
                      )}
                      {payment.status === "COMPLETED" && (
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          View Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!payments || payments.length === 0) && (
            <div className="text-center py-8 text-slate-500">
              No payments found.
            </div>
          )}
        </div>

        {/* Payment Receipt Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Payment Receipt</h3>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Reference:</span>
                  <span className="font-medium">{selectedPayment.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Type:</span>
                  <span className="font-medium">{selectedPayment.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Amount:</span>
                  <span className="font-medium">{selectedPayment.amount} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Method:</span>
                  <span className="font-medium">{selectedPayment.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Date:</span>
                  <span className="font-medium">{new Date(selectedPayment.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Status:</span>
                  <Badge variant={getStatusBadgeVariant(selectedPayment.status)}>
                    {selectedPayment.status}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
                >
                  Print Receipt
                </button>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="flex-1 bg-slate-100 text-slate-900 px-4 py-2 rounded hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}