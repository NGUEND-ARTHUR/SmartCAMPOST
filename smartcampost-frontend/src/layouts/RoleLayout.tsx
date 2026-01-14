import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { AppRole } from "@/lib/routeByRole";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useAuthStore } from "@/store/authStore";

type NavItem = { to: string; labelKey: string };

const navByRole: Record<AppRole, NavItem[]> = {
  CLIENT: [
    { to: "/client", labelKey: "nav.dashboard" },
    { to: "/client/parcels", labelKey: "nav.myParcels" },
    { to: "/client/pickups", labelKey: "nav.pickups" },
    { to: "/client/payments", labelKey: "nav.payments" },
    { to: "/client/support", labelKey: "nav.support" },
  ],
  AGENT: [
    { to: "/agent", labelKey: "nav.dashboard" },
    { to: "/agent/scan", labelKey: "nav.scanConsole" },
  ],
  COURIER: [
    { to: "/courier", labelKey: "nav.dashboard" },
    { to: "/courier/pickups", labelKey: "nav.myPickups" },
    { to: "/courier/deliveries", labelKey: "nav.myDeliveries" },
  ],
  STAFF: [
    { to: "/staff", labelKey: "nav.dashboard" },
    { to: "/staff/parcels", labelKey: "nav.parcels" },
    { to: "/staff/pickups", labelKey: "nav.pickups" },
    { to: "/staff/notifications", labelKey: "nav.notifications" },
    { to: "/staff/analytics", labelKey: "nav.analytics" },
  ],
  ADMIN: [
    { to: "/admin", labelKey: "nav.dashboard" },
    { to: "/admin/parcels", labelKey: "nav.parcels" },
    { to: "/admin/scan", labelKey: "nav.scanConsole" },
    { to: "/admin/staff", labelKey: "nav.staffDashboard" },
    { to: "/admin/users/staff", labelKey: "nav.staffManagement" },
    { to: "/admin/users/agents", labelKey: "nav.agentManagement" },
    { to: "/admin/users/couriers", labelKey: "nav.courierManagement" },
    { to: "/admin/users/agencies", labelKey: "nav.agencyManagement" },
    { to: "/admin/users/clients", labelKey: "nav.clientManagement" },
    { to: "/admin/tariffs", labelKey: "nav.tariffManagement" },
    { to: "/admin/integrations", labelKey: "nav.integrations" },
    { to: "/admin/accounts", labelKey: "nav.userAccounts" },
    { to: "/admin/notifications", labelKey: "nav.notifications" },
    { to: "/admin/analytics", labelKey: "nav.analytics" },
  ],
  FINANCE: [
    { to: "/finance", labelKey: "nav.dashboard" },
    { to: "/finance/payments", labelKey: "nav.payments" },
    { to: "/finance/refunds", labelKey: "nav.refunds" },
  ],
  RISK: [
    { to: "/risk", labelKey: "nav.dashboard" },
    { to: "/risk/alerts", labelKey: "nav.riskAlerts" },
    { to: "/risk/compliance", labelKey: "nav.compliance" },
  ],
};

export function RoleLayout({ role }: { role: AppRole }) {
  const { logout, user } = useAuthStore();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-64 border-r bg-white min-h-screen p-4 flex flex-col">
          <div className="mb-6">
            <div className="font-bold text-lg">SmartCAMPOST</div>
            <div className="text-sm text-muted-foreground">
              {user?.name || "—"} • {t(`users.roles.${role.toLowerCase()}`)}
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            {navByRole[role].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === `/${role.toLowerCase()}`}
                className={({ isActive }) =>
                  `block rounded px-3 py-2 text-sm ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`
                }
              >
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-3">
            <LanguageSwitcher variant="default" className="w-full justify-start" />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => logout()}
            >
              {t('common.logout')}
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
