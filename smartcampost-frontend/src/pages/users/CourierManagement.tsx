import { useState } from "react";
import { Truck, Plus, Loader2, Search, Filter } from "lucide-react";
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
import { useTranslation } from "react-i18next";
import { useCouriers, useCreateCourier, useUpdateCourierStatus } from "@/hooks";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  SUSPENDED: "bg-red-100 text-red-800",
  ON_DELIVERY: "bg-blue-100 text-blue-800",
  AVAILABLE: "bg-emerald-100 text-emerald-800",
};

export default function CourierManagement() {
  const [page, setPage] = useState(0);
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    password: "",
    vehicleId: "",
  });

  const { data, isLoading, error } = useCouriers(page, 20);
  const createCourier = useCreateCourier();
  const updateStatus = useUpdateCourierStatus();

  const couriers = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const filteredCouriers = couriers.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      fullName: "",
      phone: "",
      password: "",
      vehicleId: "",
    });
  };

  const handleCreate = () => {
    if (!formData.fullName || !formData.phone || !formData.password) {
      toast.error(t('courierManagement.requiredFields'));
      return;
    }
    // Auto-generate vehicleId if not provided
    const payload = {
      ...formData,
      vehicleId: formData.vehicleId || `VH-${Date.now().toString(36).toUpperCase()}`,
    };
    createCourier.mutate(payload, {
      onSuccess: () => {
        toast.success(t('courierManagement.courierCreated'));
        setIsCreateOpen(false);
        resetForm();
      },
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : t('courierManagement.failedCreateCourier'),
        ),
    });
  };

  const handleStatusChange = (courierId: string, newStatus: string) => {
    updateStatus.mutate(
      { id: courierId, data: { status: newStatus } },
      {
        onSuccess: () =>
          toast.success(t('courierManagement.statusUpdated', { status: newStatus })),
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : t('courierManagement.failedUpdateStatus'),
          ),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('courierManagement.title')}</h1>
          <p className="text-muted-foreground">
            {t('courierManagement.subtitle')}
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
              Add Courier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Courier</DialogTitle>
              <DialogDescription>
                Add a new delivery courier to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('courierManagement.fullName')} *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder={t('courierManagement.fullNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('courierManagement.phone')} *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder={t('courierManagement.phonePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('courierManagement.password')} *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={t('courierManagement.passwordPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleId">{t('courierManagement.vehicleIdOptional')}</Label>
                <Input
                  id="vehicleId"
                  value={formData.vehicleId}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleId: e.target.value })
                  }
                  placeholder={t('courierManagement.vehicleIdPlaceholder')}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createCourier.isPending}>
                {createCourier.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create Courier
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Couriers</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('courierManagement.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-52"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t('courierManagement.statusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="ON_DELIVERY">On Delivery</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
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
              icon={Truck}
              title="Error loading couriers"
              description={
                error instanceof Error ? error.message : "An error occurred"
              }
            />
          ) : filteredCouriers.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No couriers found"
              description={
                searchQuery || statusFilter !== "ALL"
                  ? "Try adjusting your filters"
                  : "Add your first courier to get started"
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Courier</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCouriers.map((courier) => (
                    <TableRow key={courier.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{courier.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {courier.id.slice(0, 8)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{courier.phone}</TableCell>
                      <TableCell>
                        {courier.vehicleId ? (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 w-fit"
                          >
                            <Truck className="w-3 h-3" />
                            {courier.vehicleId}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Not assigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusColors[courier.status] ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {courier.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={courier.status}
                          onValueChange={(value: string) =>
                            handleStatusChange(courier.id, value)
                          }
                        >
                          <SelectTrigger className="w-36 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="AVAILABLE">Available</SelectItem>
                            <SelectItem value="ON_DELIVERY">
                              On Delivery
                            </SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                            <SelectItem value="SUSPENDED">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
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
