import { useMemo, useState } from "react";
import { Filter, Shield, User, Users, Loader2 } from "lucide-react";
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

type StaffRole = "AGENT" | "SUPPORT" | "FINANCE" | "RISK" | "ADMIN";
type StaffStatus = "ACTIVE" | "OFF_DUTY" | "SUSPENDED";

const roleBadge: Record<StaffRole, string> = {
  AGENT: "bg-blue-100 text-blue-800",
  SUPPORT: "bg-purple-100 text-purple-800",
  FINANCE: "bg-emerald-100 text-emerald-800",
  RISK: "bg-orange-100 text-orange-800",
  ADMIN: "bg-gray-100 text-gray-800",
};

const statusBadge: Record<StaffStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  OFF_DUTY: "bg-yellow-100 text-yellow-800",
  SUSPENDED: "bg-red-100 text-red-800",
};

export default function StaffDashboard() {
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
        <h1 className="text-3xl font-bold">Staff Dashboard</h1>
        <p className="text-muted-foreground">
          Operations staffing, roles and workload overview
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.total}</div>
            <p className="text-xs text-muted-foreground">All departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.active}</div>
            <p className="text-xs text-muted-foreground">Currently on duty</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agents</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.agents}</div>
            <p className="text-xs text-muted-foreground">Field operations</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <Input
                placeholder="Search staff by name or ID…"
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
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="AGENT">Agent</SelectItem>
                  <SelectItem value="SUPPORT">Support</SelectItem>
                  <SelectItem value="FINANCE">Finance</SelectItem>
                  <SelectItem value="RISK">Risk</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">Export</Button>
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
              title="Error loading staff"
              description={
                error instanceof Error ? error.message : "An error occurred"
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No staff found"
              description={
                searchQuery || roleFilter !== "ALL"
                  ? "Try adjusting your filters"
                  : "Staff will appear here"
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Action</TableHead>
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
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {s.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusBadge[s.status as StaffStatus] ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {(s.status || "").toString().replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{s.email}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost">
                          Manage
                        </Button>
                      </TableCell>
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
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground self-center">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
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
