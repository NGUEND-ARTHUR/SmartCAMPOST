export default function Topbar() {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">
          SmartCAMPOST Backoffice
        </h2>
        <p className="text-xs text-slate-500">
          Monitor parcels, hubs and delivery performance.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500">Today</span>
        <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold">
          SA
        </div>
      </div>
    </header>
  );
}
