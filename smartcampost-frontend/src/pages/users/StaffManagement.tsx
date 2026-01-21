import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  Plus,
  Loader2,
  Search,
  Filter,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import {
  useStaffList,
  useCreateStaff,
  useUpdateStaffStatus,
  useUpdateStaffRole,
  useAgencies,
  useCouriers,
  useCreateCourier,
  useUpdateCourierStatus,
} from "@/hooks";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  SUSPENDED: "bg-red-100 text-red-800",
};

const roleColors: Record<string, string> = {
  STAFF: "bg-blue-100 text-blue-800",
  ADMIN: "bg-purple-100 text-purple-800",
  FINANCE: "bg-yellow-100 text-yellow-800",
  RISK: "bg-orange-100 text-orange-800",
  COURIER: "bg-green-100 text-green-800",
};

function getRoleLabels(t: (key: string) => string): Record<string, string> {
  return {
    STAFF: t("roles.staff"),
    ADMIN: t("roles.admin"),
    FINANCE: t("roles.finance"),
    RISK: t("roles.riskManager"),
    COURIER: t("roles.courier"),
  };
}

// Unified member type for staff + couriers
interface UnifiedMember {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: string;
  status: string;
  agencyId?: string;
  vehicleId?: string;
  isCourier: boolean;
}

export default function StaffManagement() {
  const { t } = useTranslation();
  const roleLabels = getRoleLabels(t);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    role: "STAFF",
    agencyId: "",
    vehicleId: "",
  });

  const { data, isLoading, error } = useStaffList(page, 20);
  const { data: couriersData, isLoading: couriersLoading } = useCouriers(
    0,
    100,
  );
  const { data: agenciesData } = useAgencies(0, 100);
  const createStaff = useCreateStaff();
  const createCourier = useCreateCourier();
  const updateStatus = useUpdateStaffStatus();
  const updateRole = useUpdateStaffRole();
  const updateCourierStatus = useUpdateCourierStatus();

  const staffList = data?.content ?? [];
  const courierList = couriersData?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const agencies = agenciesData?.content ?? [];

  // Merge staff and couriers into a unified list
  const unifiedList = useMemo<UnifiedMember[]>(() => {
    const staffMembers: UnifiedMember[] = staffList.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      phone: s.phone,
      email: s.email,
      role: s.role,
      status: s.status,
      agencyId: s.agencyId,
      isCourier: false,
    }));

    const courierMembers: UnifiedMember[] = courierList.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      phone: c.phone,
      role: "COURIER",
      status: c.status,
      vehicleId: c.vehicleId,
      isCourier: true,
    }));

    return [...staffMembers, ...courierMembers];
  }, [staffList, courierList]);

  const filteredMembers = unifiedList.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery);
    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
    const matchesRole = roleFilter === "ALL" || m.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const resetForm = () => {
    setFormData({
      fullName: "",
      phone: "",
      email: "",
      password: "",
      role: "STAFF",
      agencyId: "",
      vehicleId: "",
    });
  };

  const handleCreate = () => {
    if (!formData.fullName || !formData.phone || !formData.password) {
      toast.error(t("staffManagement.requiredFields"));
      return;
    }

    // If role is COURIER, use courier creation
    if (formData.role === "COURIER") {
      // Generate vehicleId matching pattern [A-Z, 0-9, -] (3-20 chars)
      const generatedId = `VH-${Date.now().toString(36).toUpperCase()}`;
      const vehicleId =
        formData.vehicleId?.toUpperCase().replace(/[^A-Z0-9-]/g, "") ||
        generatedId;
      createCourier.mutate(
        {
          fullName: formData.fullName,
          phone: formData.phone,
          password: formData.password,
          vehicleId,
        },
        {
          onSuccess: () => {
            toast.success(t("staffManagement.courierCreated"));
            setIsCreateOpen(false);
            resetForm();
          },
          onError: (err) =>
            toast.error(
              err instanceof Error
                ? err.message
                : t("staffManagement.failedCreateCourier"),
            ),
        },
      );
    } else {
      // Use staff creation for other roles
      createStaff.mutate(formData, {
        onSuccess: () => {
          toast.success(t("staffManagement.staffCreated"));
          setIsCreateOpen(false);
          resetForm();
        },
        onError: (err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : t("staffManagement.failedCreateStaff"),
          ),
      });
    }
  };

  const handleStatusChange = (member: UnifiedMember, newStatus: string) => {
    if (member.isCourier) {
      updateCourierStatus.mutate(
        { id: member.id, data: { status: newStatus } },
        {
          onSuccess: () =>
            toast.success(`Courier status updated to ${newStatus}`),
          onError: (err) =>
            toast.error(
              err instanceof Error
                ? err.message
                : t("staffManagement.failedUpdateStatus"),
            ),
        },
      );
    } else {
      updateStatus.mutate(
        { id: member.id, data: { status: newStatus } },
        {
          onSuccess: () =>
            toast.success(`Staff status updated to ${newStatus}`),
          onError: (err) =>
            toast.error(
              err instanceof Error
                ? err.message
                : t("staffManagement.failedUpdateStatus"),
            ),
        },
      );
    }
  };

  const handleRoleChange = (staffId: string, newRole: string) => {
    updateRole.mutate(
      { id: staffId, data: { role: newRole } },
      {
        onSuccess: () =>
          toast.success(
            `Staff role updated to ${roleLabels[newRole] || newRole}`,
          ),
        onError: (err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : t("staffManagement.failedUpdateRole"),
          ),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("staffManagement.title")}</h1>
          <p className="text-muted-foreground">
            {t("staffManagement.subtitle")}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Staff Member</DialogTitle>
              <DialogDescription>
                Add a new staff member or administrator to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  {t("staffManagement.fullName")} *
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="staff@campost.cm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                      <SelectItem value="FINANCE">Finance</SelectItem>
                      <SelectItem value="RISK">Risk Management</SelectItem>
                      <SelectItem value="COURIER">Courier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.role === "COURIER" ? (
                  <div className="space-y-2">
                    <Label htmlFor="vehicleId">Vehicle ID (optional)</Label>
                    <Input
                      id="vehicleId"
                      value={formData.vehicleId}
                      onChange={(e) =>
                        setFormData({ ...formData, vehicleId: e.target.value })
                      }
                      placeholder="VH-XXXXX (auto-generated if empty)"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="agencyId">Agency (optional)</Label>
                    <Select
                      value={formData.agencyId}
                      onValueChange={(value: string) =>
                        setFormData({ ...formData, agencyId: value })
                      }
                    >
                      <SelectTrigger id="agencyId">
                        <SelectValue placeholder="Select agency" />
                      </SelectTrigger>
                      <SelectContent>
                        {agencies.map((agency) => (
                          <SelectItem key={agency.id} value={agency.id}>
                            {agency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createStaff.isPending || createCourier.isPending}
              >
                {(createStaff.isPending || createCourier.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {formData.role === "COURIER"
                  ? "Create Courier"
                  : "Create Staff"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Staff Members & Couriers</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-52"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-36">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="FINANCE">Finance</SelectItem>
                  <SelectItem value="RISK">Risk</SelectItem>
                  <SelectItem value="COURIER">Courier</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading || couriersLoading ? (
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
          ) : filteredMembers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No staff or couriers found"
              description={
                searchQuery || statusFilter !== "ALL" || roleFilter !== "ALL"
                  ? "Try adjusting your filters"
                  : "Add your first staff member or courier to get started"
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow
                      key={`${member.isCourier ? "c" : "s"}-${member.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {member.isCourier && (
                            <Truck className="w-4 h-4 text-green-600" />
                          )}
                          <div>
                            <div className="font-medium">{member.fullName}</div>
                            <div className="text-xs text-muted-foreground">
                              {member.isCourier && member.vehicleId
                                ? member.vehicleId
                                : member.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{member.phone}</div>
                          {member.email && (
                            <div className="text-muted-foreground">
                              {member.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1 w-fit ${roleColors[member.role] || ""}`}
                        >
                          {member.isCourier ? (
                            <Truck className="w-3 h-3" />
                          ) : (
                            <ShieldCheck className="w-3 h-3" />
                          )}
                          {roleLabels[member.role] || member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusColors[member.status] ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select
                            value={member.status}
                            onValueChange={(value: string) =>
                              handleStatusChange(member, value)
                            }
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="INACTIVE">Inactive</SelectItem>
                              <SelectItem value="SUSPENDED">
                                Suspended
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {!member.isCourier && (
                            <Select
                              value={member.role}
                              onValueChange={(value: string) =>
                                handleRoleChange(member.id, value)
                              }
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="STAFF">Staff</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="FINANCE">Finance</SelectItem>
                                <SelectItem value="RISK">Risk</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
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
