import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<{
    id: string;
    serviceType: string;
    originZone: string;
    destinationZone: string;
    weightBracket: string;
    price: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    serviceType: "STANDARD",
    originZone: "",
    destinationZone: "",
    weightBracket: "0-5kg",
    basePrice: "",
    pricePerKg: "",
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
      originZone: "",
      destinationZone: "",
      weightBracket: "0-5kg",
      basePrice: "",
      pricePerKg: "",
      currency: "XAF",
    });
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleCreate = () => {
    if (!formData.originZone || !formData.destinationZone || !formData.basePrice) {
      toast.error("Origin zone, destination zone and price are required");
      return;
    }
    const payload = {
      serviceType: formData.serviceType,
      originZone: formData.originZone,
      destinationZone: formData.destinationZone,
      weightBracket: formData.weightBracket,
      price: Number(formData.basePrice) || 0,
    };
    createTariff.mutate(payload, {
      onSuccess: () => {
        toast.success("Tariff created successfully");
        setIsCreateOpen(false);
        resetForm();
      },
      onError: (err) => {
        const errorMsg = err instanceof Error ? err.message : "Failed to create tariff";
        if (errorMsg.includes("already exists") || errorMsg.includes("CONFLICT") || errorMsg.includes("409")) {
          toast.error("Tariff Already Exists", {
            description: `A tariff for ${formData.originZone} → ${formData.destinationZone} (${formData.serviceType}, ${formData.weightBracket}) already exists. Please modify the existing tariff instead.`,
          });
        } else {
          toast.error(errorMsg);
        }
      },
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
          price: editingTariff.price,
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
                  onChange={handleInputChange("name")}
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
                    onChange={handleInputChange("currency")}
                    placeholder="XAF"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originZone">Origin Zone *</Label>
                  <Input
                    id="originZone"
                    value={formData.originZone}
                    onChange={handleInputChange("originZone")}
                    placeholder="e.g., YAOUNDE"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destinationZone">Destination Zone *</Label>
                  <Input
                    id="destinationZone"
                    value={formData.destinationZone}
                    onChange={handleInputChange("destinationZone")}
                    placeholder="e.g., DOUALA"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightBracket">Weight Bracket</Label>
                <Select
                  value={formData.weightBracket}
                  onValueChange={(v: string) =>
                    setFormData({ ...formData, weightBracket: v })
                  }
                >
                  <SelectTrigger id="weightBracket">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-5kg">0-5 kg</SelectItem>
                    <SelectItem value="5-10kg">5-10 kg</SelectItem>
                    <SelectItem value="10-20kg">10-20 kg</SelectItem>
                    <SelectItem value="20-50kg">20-50 kg</SelectItem>
                    <SelectItem value="50+kg">50+ kg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Base Price *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    value={formData.basePrice}
                    onChange={handleInputChange("basePrice")}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePerKg">Price per Kg</Label>
                  <Input
                    id="pricePerKg"
                    type="number"
                    value={formData.pricePerKg}
                    onChange={handleInputChange("pricePerKg")}
                    placeholder="0"
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
                    <TableHead>Service Type</TableHead>
                    <TableHead>Origin Zone</TableHead>
                    <TableHead>Destination Zone</TableHead>
                    <TableHead>Weight Bracket</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tariffs.map((tariff) => (
                    <TableRow key={tariff.id}>
                      <TableCell>
                        <Badge variant="outline">{tariff.serviceType}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {tariff.originZone}
                      </TableCell>
                      <TableCell>
                        {tariff.destinationZone}
                      </TableCell>
                      <TableCell>
                        {tariff.weightBracket}
                      </TableCell>
                      <TableCell>
                        {Number(tariff.price).toLocaleString()} XAF
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleEdit({
                                id: tariff.id,
                                serviceType: tariff.serviceType,
                                originZone: tariff.originZone,
                                destinationZone: tariff.destinationZone,
                                weightBracket: tariff.weightBracket,
                                price: Number(tariff.price),
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
            <DialogDescription>Update tariff price</DialogDescription>
          </DialogHeader>
          {editingTariff && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Input value={editingTariff.serviceType} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Weight Bracket</Label>
                  <Input value={editingTariff.weightBracket} disabled />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Origin Zone</Label>
                  <Input value={editingTariff.originZone} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Destination Zone</Label>
                  <Input value={editingTariff.destinationZone} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Price (XAF)</Label>
                <Input
                  type="number"
                  value={editingTariff.price}
                  onChange={(e) =>
                    setEditingTariff({
                      ...editingTariff,
                      price: Number(e.target.value),
                    })
                  }
                />
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
