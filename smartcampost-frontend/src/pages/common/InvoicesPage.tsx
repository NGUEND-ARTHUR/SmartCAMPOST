import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { invoiceService, type InvoiceResponse } from "@/services";
import { toast } from "sonner";

export default function InvoicesPage() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);

  const fetchInvoices = React.useCallback(async () => {
    try {
      const data = await invoiceService.listMine();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("common.error", "An error occurred"));
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
      <h2 className="text-xl font-semibold">{t("invoices.title")}</h2>
      <ul className="mt-4">
        {invoices.map((inv) => (
          <li key={inv.id} className="border p-3 mb-2">
            <div>
              {t("invoices.invoiceNumber")}: {inv.invoiceNumber}
            </div>
            <div>
              {t("invoices.total")}: {inv.totalAmount}
            </div>
            <div>
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => {
                  const w = window.open("", "_blank");
                  if (!w) { toast.error("Could not open print window"); return; }
                  const html = `<html><head><title>Invoice ${inv.invoiceNumber}</title>
                    <style>body{font-family:Arial,sans-serif;padding:24px;max-width:600px;margin:0 auto}
                    h2{color:#1a1a2e}table{width:100%;border-collapse:collapse;margin:16px 0}
                    td{padding:8px;border-bottom:1px solid #eee}td:first-child{color:#666;width:40%}
                    .footer{margin-top:24px;padding-top:16px;border-top:2px solid #333;font-size:12px;color:#888}</style>
                    </head><body>
                    <h2>SmartCAMPOST - Invoice</h2>
                    <table>
                    <tr><td>Invoice #</td><td><strong>${inv.invoiceNumber}</strong></td></tr>
                    <tr><td>Parcel</td><td>${inv.parcelTrackingRef || inv.parcelId || "N/A"}</td></tr>
                    <tr><td>Amount</td><td><strong>${inv.totalAmount.toLocaleString()} XAF</strong></td></tr>
                    <tr><td>Issued</td><td>${new Date(inv.issuedAt).toLocaleDateString()}</td></tr>
                    </table>
                    <div class="footer">Generated on ${new Date().toLocaleString()} — SmartCAMPOST</div>
                    </body></html>`;
                  w.document.open();
                  w.document.write(html);
                  w.document.close();
                  w.focus();
                  setTimeout(() => { try { w.print(); } catch { /* ignore */ } }, 300);
                }}
              >
                {t("invoices.downloadPdf")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
