import React, { useEffect, useState } from "react";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);

  const fetchInvoices = React.useCallback(async () => {
    try {
      const res = await fetch("/api/invoices/me");
      if (res.ok) setInvoices(await res.json());
    } catch (e) {
      console.warn(e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (!mounted) return;
      fetchInvoices();
    }, 0);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [fetchInvoices]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">My Invoices</h2>
      <ul className="mt-4">
        {invoices.map((inv) => (
          <li key={inv.invoiceId} className="border p-3 mb-2">
            <div>Invoice: {inv.invoiceNumber}</div>
            <div>Total: {inv.totalAmount}</div>
            <div>
              <a
                className="text-blue-600"
                href={`/api/invoices/${inv.invoiceId}/pdf`}
              >
                Download PDF
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
