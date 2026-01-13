import { useState } from "react";
import { DollarSign, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
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
  useTariffs,
  useCreateTariff,
  useUpdateTariff,
  useDeleteTariff,
} from "@/hooks";
import { toast } from "sonner";

export default function TariffManagement() {
  const [page, setPage] = useState(0);
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<{
    id: string;
    name: string;
    serviceType: string;
    basePrice: number;
    pricePerKg: number;
    active: boolean;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    serviceType: "STANDARD",
    basePrice: 0,
    pricePerKg: 0,
    currency: "XAF",
  });

  const filterType =
    serviceTypeFilter === "ALL" ? undefined : serviceTypeFilter;
  const { data, isLoading, error } = useTariffs(page, 20, filterType);
  const createTariff = useCreateTariff();
  const updateTariff = useUpdateTariff();
  const deleteTariff = useDeleteTariff();

  const tariffs = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const resetForm = () => {
    setFormData({
      name: "",
      serviceType: "STANDARD",
      basePrice: 0,
      pricePerKg: 0,
      currency: "XAF",
    });
  };

  const handleCreate = () => {
    if (!formData.name || formData.basePrice <= 0) {
      toast.error("Name and base price are required");
      return;
    }
    createTariff.mutate(formData, {
      onSuccess: () => {
        toast.success("Tariff created successfully");
        setIsCreateOpen(false);
        resetForm();
      },
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to create tariff",
        ),
    });
  };

  const handleEdit = (tariff: typeof editingTariff) => {
    if (!tariff) return;
    setEditingTariff(tariff);
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingTariff) return;
    updateTariff.mutate(
      {
        id: editingTariff.id,
        data: {
          name: editingTariff.name,
          serviceType: editingTariff.serviceType,
          basePrice: editingTariff.basePrice,
          pricePerKg: editingTariff.pricePerKg,
          active: editingTariff.active,
        },
      },
      {
        onSuccess: () => {
          toast.success("Tariff updated successfully");
          setIsEditOpen(false);
          setEditingTariff(null);
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Failed to update tariff",
          ),
      },
    );
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this tariff?")) return;
    deleteTariff.mutate(id, {
      onSuccess: () => toast.success("Tariff deleted"),
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to delete tariff",
        ),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tariff Management</h1>
          <p className="text-muted-foreground">
            Configure pricing tariffs for parcel services
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
              Add Tariff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tariff</DialogTitle>
              <DialogDescription>
                Define a new pricing tariff for parcel services
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tariff Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Standard Domestic"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type *</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(v: string) =>
                      setFormData({ ...formData, serviceType: v })
                    }
                  >
                    <SelectTrigger id="serviceType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="EXPRESS">Express</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    placeholder="XAF"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Base Price *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        basePrice: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePerKg">Price per Kg</Label>
                  <Input
                    id="pricePerKg"
                    type="number"
                    value={formData.pricePerKg}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePerKg: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createTariff.isPending}>
                {createTariff.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create Tariff
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Tariffs</CardTitle>
            <Select
              value={serviceTypeFilter}
              onValueChange={setServiceTypeFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="EXPRESS">Express</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <EmptyState
              icon={DollarSign}
              title="Error loading tariffs"
              description={
                error instanceof Error ? error.message : "An error occurred"
              }
            />
          ) : tariffs.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No tariffs found"
              description="Create your first tariff to get started"
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Per Kg</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tariffs.map((tariff) => (
                    <TableRow key={tariff.id}>
                      <TableCell className="font-medium">
                        {tariff.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tariff.serviceType}</Badge>
                      </TableCell>
                      <TableCell>
                        {tariff.basePrice.toLocaleString()} {tariff.currency}
                      </TableCell>
                      <TableCell>
                        {tariff.pricePerKg.toLocaleString()} {tariff.currency}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            tariff.active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {tariff.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleEdit({
                                id: tariff.id,
                                name: tariff.name,
                                serviceType: tariff.serviceType,
                                basePrice: tariff.basePrice,
                                pricePerKg: tariff.pricePerKg,
                                active: tariff.active,
                              })
                            }
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(tariff.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tariff</DialogTitle>
            <DialogDescription>Update tariff configuration</DialogDescription>
          </DialogHeader>
          {editingTariff && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tariff Name</Label>
                <Input
                  value={editingTariff.name}
                  onChange={(e) =>
                    setEditingTariff({ ...editingTariff, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Base Price</Label>
                  <Input
                    type="number"
                    value={editingTariff.basePrice}
                    onChange={(e) =>
                      setEditingTariff({
                        ...editingTariff,
                        basePrice: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price per Kg</Label>
                  <Input
                    type="number"
                    value={editingTariff.pricePerKg}
                    onChange={(e) =>
                      setEditingTariff({
                        ...editingTariff,
                        pricePerKg: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  aria-label="Tariff active status"
                  checked={editingTariff.active}
                  onChange={(e) =>
                    setEditingTariff({
                      ...editingTariff,
                      active: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateTariff.isPending}>
              {updateTariff.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
