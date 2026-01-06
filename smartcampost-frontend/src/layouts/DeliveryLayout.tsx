import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DeliveryLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-4 border-b border-slate-800">
          <span className="font-bold text-sm">
            Smart<span className="text-amber-400">CAMPOST</span> Courier
          </span>
        </div>
        <nav className="flex-1 py-4 space-y-1 text-sm">
          <NavLink
            to="/courier/dashboard"
            end
            className={({ isActive }) =>
              `block px-4 py-2 rounded-r-full ${
                isActive
                  ? "bg-amber-500 text-slate-900 font-semibold"
                  : "text-slate-300 hover:bg-slate-800"
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/courier/pickups"
            className={({ isActive }) =>
              `block px-4 py-2 rounded-r-full ${
                isActive
                  ? "bg-amber-500 text-slate-900 font-semibold"
                  : "text-slate-300 hover:bg-slate-800"
              }`
            }
          >
            My Pickups
          </NavLink>
          <NavLink
            to="/courier/deliveries"
            className={({ isActive }) =>
              `block px-4 py-2 rounded-r-full ${
                isActive
                  ? "bg-amber-500 text-slate-900 font-semibold"
                  : "text-slate-300 hover:bg-slate-800"
              }`
            }
          >
            My Deliveries
          </NavLink>
          <NavLink
            to="/courier/map"
            className={({ isActive }) =>
              `block px-4 py-2 rounded-r-full ${
                isActive
                  ? "bg-amber-500 text-slate-900 font-semibold"
                  : "text-slate-300 hover:bg-slate-800"
              }`
            }
          >
            Route Map
          </NavLink>
        </nav>
        <div className="border-t border-slate-800 p-4 text-[11px] text-slate-400">
          <p className="font-semibold text-slate-200">
            {user?.fullName ?? "Courier"}
          </p>
          <p>{user?.role ?? "COURIER"}</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/70 backdrop-blur">
          <h1 className="text-sm font-semibold text-slate-100">
            Courier Workspace
          </h1>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


