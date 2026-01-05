import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-4 border-b border-slate-800">
          <span className="font-bold text-lg">
            Smart<span className="text-amber-400">CAMPOST</span>
          </span>
        </div>

        <nav className="flex-1 py-4 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `block px-4 py-2 text-sm rounded-r-full ${
                isActive
                  ? "bg-amber-500 text-slate-900 font-semibold"
                  : "text-slate-300 hover:bg-slate-800"
              }`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/parcels"
            className={({ isActive }) =>
              `block px-4 py-2 text-sm rounded-r-full ${
                isActive
                  ? "bg-amber-500 text-slate-900 font-semibold"
                  : "text-slate-300 hover:bg-slate-800"
              }`
            }
          >
            Parcels
          </NavLink>

          {/* Tu pourras ajouter Pickup, Delivery, Staff, etc. */}
        </nav>

        <div className="border-t border-slate-800 p-4 text-xs text-slate-400">
          <p className="font-semibold text-slate-200">
            {user?.fullName ?? "Admin"}
          </p>
          <p className="text-[11px]">{user?.role ?? "ADMIN"}</p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full text-left text-xs text-red-400 hover:text-red-300"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/70 backdrop-blur">
          <h1 className="text-sm font-semibold text-slate-100">
            SmartCAMPOST Admin Panel
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 bg-slate-950 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
