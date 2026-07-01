import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import { invoiceService, type InvoiceResponse } from "@/services";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function generateInvoicePdf(inv: InvoiceResponse) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const col1 = margin;
  const col2 = margin + 50;
  let y = 20;

  // Header bar
  doc.setFillColor(19, 41, 75); // navy
  doc.rect(0, 0, pageW, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("SmartCAMPOST", margin, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("INVOICE", pageW - margin - 18, 12);

  y = 32;
  doc.setTextColor(30, 30, 50);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice", margin, y);

  y += 10;
  doc.setDrawColor(15, 139, 141); // teal
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageW - margin, y);

  // Invoice fields
  y += 10;
  const rows: [string, string][] = [
    ["Invoice #", inv.invoiceNumber],
    ["Parcel", inv.parcelTrackingRef || inv.parcelId || "N/A"],
    ["Amount", `${inv.totalAmount.toLocaleString()} XAF`],
    ["Issued", new Date(inv.issuedAt).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "2-digit" })],
  ];

  doc.setFontSize(10);
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 120);
    doc.text(label, col1, y);
    doc.setFont("helvetica", label === "Amount" ? "bold" : "normal");
    doc.setTextColor(20, 20, 40);
    doc.text(value, col2, y);
    y += 9;
  }

  // Divider
  y += 4;
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);

  // Footer
  y += 8;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 160);
  doc.text(`Generated on ${new Date().toLocaleString()} — SmartCAMPOST`, margin, y);

  doc.save(`${inv.invoiceNumber}.pdf`);
}

export default function InvoicesPage() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);

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

  async function handleDownload(inv: InvoiceResponse) {
    setDownloading(inv.id);
    try {
      // Try backend PDF first (if the endpoint exists and returns a blob)
      await invoiceService.downloadPdf(inv.id);
    } catch {
      // Fall back to client-side PDF generation
      generateInvoicePdf(inv);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">{t("invoices.title")}</h2>
      <ul className="mt-4 space-y-2">
        {invoices.map((inv) => (
          <li key={inv.id} className="border rounded-lg p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-medium text-sm">{t("invoices.invoiceNumber")}: {inv.invoiceNumber}</div>
              <div className="text-sm text-muted-foreground">
                {t("invoices.total")}: {inv.totalAmount.toLocaleString()} XAF
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(inv.issuedAt).toLocaleDateString()}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-2"
              disabled={downloading === inv.id}
              onClick={() => void handleDownload(inv)}
            >
              {downloading === inv.id
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />}
              {t("invoices.downloadPdf")}
            </Button>
          </li>
        ))}
        {invoices.length === 0 && (
          <li className="text-sm text-muted-foreground py-8 text-center">
            {t("invoices.empty", "No invoices found")}
          </li>
        )}
      </ul>
    </div>
  );
}
