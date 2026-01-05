import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface Props {
  value: string; // what QR encodes
  label?: string;
}

export default function QRDisplay({ value, label }: Props) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    QRCode.toDataURL(value, { margin: 1, width: 220 })
      .then((url) => mounted && setDataUrl(url))
      .catch(() => mounted && setDataUrl(""));
    return () => {
      mounted = false;
    };
  }, [value]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      {label && <p className="text-xs text-slate-400 mb-2">{label}</p>}
      {dataUrl ? (
        <img src={dataUrl} alt="QR Code" className="w-[220px] h-[220px]" />
      ) : (
        <div className="w-[220px] h-[220px] bg-slate-800 animate-pulse rounded-md" />
      )}
      <p className="mt-2 font-mono text-[11px] text-slate-300 break-all">{value}</p>
    </div>
  );
}
