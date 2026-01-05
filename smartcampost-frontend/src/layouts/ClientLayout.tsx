import { Outlet, NavLink } from "react-router-dom";

export default function ClientLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/70 backdrop-blur">
        <span className="font-bold">
          Smart<span className="text-amber-400">CAMPOST</span> Client
        </span>

        <nav className="flex gap-4 text-sm">
          <NavLink to="/client" end className={({ isActive }) => isActive ? "text-amber-400" : "text-slate-300"}>
            Dashboard
          </NavLink>
          <NavLink to="/client/pickup" className={({ isActive }) => isActive ? "text-amber-400" : "text-slate-300"}>
            Request Pickup
          </NavLink>
          <NavLink to="/track" className={({ isActive }) => isActive ? "text-amber-400" : "text-slate-300"}>
            Track Parcel
          </NavLink>
        </nav>
      </header>

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
