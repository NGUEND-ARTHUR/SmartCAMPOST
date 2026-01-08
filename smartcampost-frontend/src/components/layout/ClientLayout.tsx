import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { clientMenu } from "../../app/config/navigation";

export default function ClientLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-4 border-b border-slate-800">
          <span className="font-bold text-sm">
            Smart<span className="text-amber-400">CAMPOST</span> Client
          </span>
        </div>
        <nav className="flex-1 py-4 space-y-1 text-sm">
          {clientMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-r-full ${
                  isActive
                    ? "bg-amber-500 text-slate-900 font-semibold"
                    : "text-slate-300 hover:bg-slate-800"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4 text-[11px] text-slate-400">
          <p className="font-semibold text-slate-200">
            {user?.fullName ?? "Client"}
          </p>
          <p>{user?.role ?? "CLIENT"}</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/70 backdrop-blur">
          <h1 className="text-sm font-semibold text-slate-100">
            Client Dashboard
          </h1>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
