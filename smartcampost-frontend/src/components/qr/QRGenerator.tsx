import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

type Props = {
  value: string; // trackingRef OR parcelId (you decide)
  title?: string;
};

export default function QRGenerator({ value, title }: Props) {
  const [dataUrl, setDataUrl] = useState<string>("");

  const displayTitle = useMemo(() => title ?? "QR Code", [title]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const url = await QRCode.toDataURL(value, {
          errorCorrectionLevel: "M",
          margin: 2,
          scale: 8,
        });
        if (mounted) setDataUrl(url);
      } catch {
        if (mounted) setDataUrl("");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [value]);

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;

    w.document.write(`
      <html>
        <head>
          <title>${displayTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            .box { display:flex; flex-direction:column; align-items:center; gap:12px; }
            img { width: 260px; height: 260px; }
            .code { font-size: 14px; color: #111; }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>${displayTitle}</h2>
            ${dataUrl ? `<img src="${dataUrl}" />` : `<p>QR not available</p>`}
            <div class="code">${value}</div>
          </div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">{displayTitle}</h3>
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400"
          disabled={!dataUrl}
        >
          Print
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt="QR Code"
            className="h-56 w-56 rounded-xl bg-white p-2"
          />
        ) : (
          <p className="text-xs text-slate-400">Generating QR…</p>
        )}
      </div>

      <p className="mt-3 break-all text-xs text-slate-400">{value}</p>
    </div>
  );
}
