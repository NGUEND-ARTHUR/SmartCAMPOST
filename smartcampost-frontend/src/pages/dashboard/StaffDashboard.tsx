import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Filter, Shield, User, Users, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { useStaffList } from "@/hooks";
import { StatsCard } from "@/components/StatsCard";

type StaffRole = "AGENT" | "SUPPORT" | "FINANCE" | "RISK" | "ADMIN";
type StaffStatus = "ACTIVE" | "OFF_DUTY" | "SUSPENDED";

const roleBadge: Record<StaffRole, string> = {
  AGENT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SUPPORT:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  FINANCE:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  RISK: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  ADMIN: "bg-muted text-muted-foreground",
};

const statusBadge: Record<StaffStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  OFF_DUTY: "bg-yellow-100 text-yellow-800",
  SUSPENDED: "bg-red-100 text-red-800",
};

export default function StaffDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userRole = useAuthStore((s) => s.user?.role?.toUpperCase() ?? "");
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | StaffRole>("ALL");

  const { data, isLoading, error } = useStaffList(page, 50);
  const staffList = useMemo(() => data?.content ?? [], [data]);
  const totalPages = data?.totalPages ?? 0;

  const filtered = useMemo(() => {
    return staffList.filter((s) => {
      const name = s.fullName.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        name.includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "ALL" || s.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [staffList, searchQuery, roleFilter]);

  const totals = useMemo(() => {
    const total = staffList.length;
    const active = staffList.filter((s) => s.status === "ACTIVE").length;
    const agents = staffList.filter((s) => s.role === "AGENT").length;
    return { total, active, agents };
  }, [staffList]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("dashboard.staff.title")}</h1>
        <p className="text-muted-foreground">{t("dashboard.overview")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard icon={Users} label={t("staffDashboard.totalParcels")} value={totals.total} subtitle={t("staffDashboard.totalParcelsDesc")} accentColor="bg-primary" />
        <StatsCard icon={User} label={t("common.active")} value={totals.active} subtitle={t("staffDashboard.inTransitDesc")} accentColor="bg-emerald-500" />
        <StatsCard icon={Shield} label={t("roles.agent")} value={totals.agents} subtitle={t("staffDashboard.deliveredDesc")} accentColor="bg-violet-500" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <Input
                placeholder={t("staffManagement.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={roleFilter}
                onValueChange={(v: string) =>
                  setRoleFilter(v as "ALL" | StaffRole)
                }
              >
                <SelectTrigger className="w-52" title="Filter by role">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    {t("staffManagement.filter.allRoles")}
                  </SelectItem>
                  <SelectItem value="AGENT">{t("roles.agent")}</SelectItem>
                  <SelectItem value="SUPPORT">{t("roles.support")}</SelectItem>
                  <SelectItem value="FINANCE">{t("roles.finance")}</SelectItem>
                  <SelectItem value="RISK">{t("roles.risk")}</SelectItem>
                  <SelectItem value="ADMIN">{t("roles.admin")}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">{t("common.export")}</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <EmptyState
              icon={Users}
              title={t("common.errorLoading")}
              description={
                error instanceof Error
                  ? error.message
                  : t("common.errorOccurred")
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t("staffDashboard.noActivity")}
              description={
                searchQuery || roleFilter !== "ALL"
                  ? t("staffManagement.list.emptyFiltered")
                  : t("staffManagement.list.emptyDefault")
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("staffDashboard.user")}</TableHead>
                    <TableHead>{t("staffDashboard.action")}</TableHead>
                    <TableHead>{t("agentDashboard.status")}</TableHead>
                    <TableHead>{t("staffManagement.email")}</TableHead>
                    {userRole === "ADMIN" && <TableHead>{t("common.action")}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{s.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {s.id.slice(0, 8)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            roleBadge[s.role as StaffRole] ||
                            "bg-muted text-muted-foreground"
                          }
                        >
                          {s.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusBadge[s.status as StaffStatus] ||
                            "bg-muted text-muted-foreground"
                          }
                        >
                          {(s.status || "").toString().replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{s.email}</TableCell>
                      {userRole === "ADMIN" && (
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/admin/users/staff`)}
                          >
                            {t("common.manage")}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    {t("common.previous")}
                  </Button>
                  <span className="text-sm text-muted-foreground self-center">
                    {t("common.pageOf", { page: page + 1, totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t("common.next")}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
