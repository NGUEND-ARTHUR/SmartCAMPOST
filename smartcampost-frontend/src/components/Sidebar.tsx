import { NavLink } from "react-router-dom";

const navLinkBase =
  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors";
const navLinkInactive = "text-slate-300 hover:bg-slate-700";
const navLinkActive = "bg-slate-900 text-white";

export default function Sidebar() {
  return (
    <aside className="h-screen w-64 bg-slate-800 text-slate-100 flex flex-col">
      <div className="px-6 py-4 border-b border-slate-700">
        <h1 className="text-lg font-bold tracking-tight">
          Smart<span className="text-amber-400">CAMPOST</span>
        </h1>
        <p className="text-xs text-slate-400">Operations Dashboard</p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`
          }
        >
          🏠 <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/parcels"
          className={({ isActive }) =>
            `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`
          }
        >
          📦 <span>Parcels</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`
          }
        >
          ⚙️ <span>Settings</span>
        </NavLink>
      </nav>

      <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-400">
        Logged in as <span className="font-semibold">Admin</span>
      </div>
    </aside>
  );
}
