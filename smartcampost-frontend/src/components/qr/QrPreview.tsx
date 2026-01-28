import React from "react";

export default function QrPreview({ parcelId }: { parcelId: number }) {
  const src = `/api/parcels/${parcelId}/qr`;
  return (
    <div className="qr-preview">
      <img src={src} alt="QR" className="qr-image" />
      <div className="mt-2">
        <a href={`/api/parcels/${parcelId}/qr/print`} className="btn">
          Download / Print QR
        </a>
      </div>
    </div>
  );
}
