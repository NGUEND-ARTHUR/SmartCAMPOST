import { NavLink, Outlet } from "react-router-dom";
import type { AppRole } from "@/lib/routeByRole";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

type NavItem = { to: string; label: string };

const navByRole: Record<AppRole, NavItem[]> = {
  CLIENT: [
    { to: "/client", label: "Dashboard" },
    { to: "/client/parcels", label: "My Parcels" },
    { to: "/client/pickups", label: "Pickups" },
    { to: "/client/payments", label: "Payments" },
    { to: "/client/support", label: "Support" },
  ],
  AGENT: [
    { to: "/agent", label: "Dashboard" },
    { to: "/agent/scan", label: "Scan Console" },
  ],
  COURIER: [
    { to: "/courier", label: "Dashboard" },
    { to: "/courier/pickups", label: "My Pickups" },
    { to: "/courier/deliveries", label: "My Deliveries" },
  ],
  STAFF: [
    { to: "/staff", label: "Dashboard" },
    { to: "/staff/parcels", label: "Parcels" },
    { to: "/staff/pickups", label: "Pickups" },
    { to: "/staff/notifications", label: "Notifications" },
    { to: "/staff/analytics", label: "Analytics" },
  ],
  ADMIN: [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/parcels", label: "Parcels" },
    { to: "/admin/scan", label: "Scan Console" },
    { to: "/admin/staff", label: "Staff Dashboard" },
    { to: "/admin/users/staff", label: "Staff Management" },
    { to: "/admin/users/agents", label: "Agent Management" },
    { to: "/admin/users/couriers", label: "Courier Management" },
    { to: "/admin/users/agencies", label: "Agency Management" },
    { to: "/admin/users/clients", label: "Client Management" },
    { to: "/admin/tariffs", label: "Tariff Management" },
    { to: "/admin/integrations", label: "Integrations" },
    { to: "/admin/accounts", label: "User Accounts" },
    { to: "/admin/notifications", label: "Notifications" },
    { to: "/admin/analytics", label: "Analytics" },
  ],
  FINANCE: [
    { to: "/finance", label: "Dashboard" },
    { to: "/finance/payments", label: "Payments" },
    { to: "/finance/refunds", label: "Refunds" },
  ],
  RISK: [
    { to: "/risk", label: "Dashboard" },
    { to: "/risk/alerts", label: "Risk Alerts" },
    { to: "/risk/compliance", label: "Compliance" },
  ],
};

export function RoleLayout({ role }: { role: AppRole }) {
  const { logout, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-64 border-r bg-white min-h-screen p-4">
          <div className="mb-6">
            <div className="font-bold text-lg">SmartCAMPOST</div>
            <div className="text-sm text-muted-foreground">
              {user?.name || "—"} • {role}
            </div>
          </div>

          <nav className="space-y-1">
            {navByRole[role].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded px-3 py-2 text-sm ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => logout()}
            >
              Logout
            </Button>
          </div>
        </aside>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
