import React, { useEffect, useState } from "react";
import { invoiceService, type InvoiceResponse } from "@/services";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);

  const fetchInvoices = React.useCallback(async () => {
    try {
      const data = await invoiceService.listMine();
      setInvoices(Array.isArray(data) ? data : []);
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
          <li key={inv.id} className="border p-3 mb-2">
            <div>Invoice: {inv.invoiceNumber}</div>
            <div>Total: {inv.totalAmount}</div>
            <div>
              <a className="text-blue-600" href={invoiceService.pdfUrl(inv.id)}>
                Download PDF
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
