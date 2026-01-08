import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listMyParcels } from "../../services/parcels/parcelService";
import { Link } from "react-router-dom";
import ParcelStatusBadge from "../../components/parcel/ParcelStatusBadge";

export default function MyParcelList() {
  const [page, setPage] = useState(0);
  const size = 10;

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["myParcels", page, size],
    queryFn: () => listMyParcels(page, size),
    staleTime: 30_000,
  });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">My Parcels</h2>
        {isFetching && <span className="text-xs text-slate-400">Refreshing…</span>}
      </div>

      {isLoading && <p className="mt-4 text-sm text-slate-300">Loading parcels…</p>}

      {isError && (
        <p className="mt-4 text-sm text-red-400">
          {(error as Error).message || "Failed to load parcels"}
        </p>
      )}

      {!isLoading && data && (
        <>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="px-3 py-2 text-left">Tracking</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Receiver</th>
                  <th className="px-3 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="bg-slate-950">
                {data.content.map((p) => (
                  <tr key={p.id} className="border-t border-slate-800">
                    <td className="px-3 py-2 text-slate-100">{p.trackingRef}</td>
                    <td className="px-3 py-2">
                      <ParcelStatusBadge status={p.status} />
                    </td>
                    <td className="px-3 py-2 text-slate-300">{p.receiverName ?? "-"}</td>
                    <td className="px-3 py-2">
                      <Link to={`/client/parcels/${p.id}`} className="text-amber-400 hover:text-amber-300">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}

                {data.content.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-slate-400" colSpan={4}>
                      No parcels found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={data.first}
            >
              Previous
            </button>

            <span className="text-xs text-slate-400">
              Page {data.number + 1} / {data.totalPages}
            </span>

            <button
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 disabled:opacity-50"
              onClick={() => setPage((p) => p + 1)}
              disabled={data.last}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
