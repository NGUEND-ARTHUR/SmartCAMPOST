import React, { useState } from "react";
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

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleCreate = () => {
    if (
      !formData.originZone ||
      !formData.destinationZone ||
      !formData.basePrice
    ) {
      toast.error(t("tariffs.toasts.requiredFields"));
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
        toast.success(t("tariffs.toasts.created"));
        setIsCreateOpen(false);
        resetForm();
      },
      onError: (err) => {
        const errorMsg =
          err instanceof Error ? err.message : t("tariffs.toasts.createFailed");
        if (
          errorMsg.includes("already exists") ||
          errorMsg.includes("CONFLICT") ||
          errorMsg.includes("409")
        ) {
          toast.error(t("tariffs.toasts.alreadyExistsTitle"), {
            description: t("tariffs.toasts.alreadyExistsDescription", {
              originZone: formData.originZone,
              destinationZone: formData.destinationZone,
              serviceType: formData.serviceType,
              weightBracket: formData.weightBracket,
            }),
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
          toast.success(t("tariffs.toasts.updated"));
          setIsEditOpen(false);
          setEditingTariff(null);
        },
        onError: (err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : t("tariffs.toasts.updateFailed"),
          ),
      },
    );
  };

  const handleDelete = (id: string) => {
    if (!confirm(t("tariffs.prompts.confirmDelete"))) return;
    deleteTariff.mutate(id, {
      onSuccess: () => toast.success(t("tariffs.toasts.deleted")),
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : t("tariffs.toasts.deleteFailed"),
        ),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("tariffManagement.title")}</h1>
          <p className="text-muted-foreground">
            {t("tariffManagement.subtitle")}
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
              {t("tariffManagement.addTariff")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("tariffManagement.createTitle")}</DialogTitle>
              <DialogDescription>
                {t("tariffManagement.createDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t("tariffManagement.tariffName")} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange("name")}
                  placeholder={t("tariffManagement.namePlaceholder")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceType">
                    {t("tariffManagement.serviceType")} *
                  </Label>
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
                      <SelectItem value="STANDARD">
                        {t("tariffManagement.standard")}
                      </SelectItem>
                      <SelectItem value="EXPRESS">
                        {t("tariffManagement.express")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">
                    {t("tariffManagement.currency")}
                  </Label>
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
                  <Label htmlFor="originZone">
                    {t("tariffManagement.originZone")} *
                  </Label>
                  <Input
                    id="originZone"
                    value={formData.originZone}
                    onChange={handleInputChange("originZone")}
                    placeholder={t("tariffManagement.originPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destinationZone">
                    {t("tariffManagement.destinationZone")} *
                  </Label>
                  <Input
                    id="destinationZone"
                    value={formData.destinationZone}
                    onChange={handleInputChange("destinationZone")}
                    placeholder={t("tariffManagement.destinationPlaceholder")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightBracket">
                  {t("tariffManagement.weightBracket")}
                </Label>
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
                    <SelectItem value="0-5kg">
                      {t("tariffManagement.weight0_5")}
                    </SelectItem>
                    <SelectItem value="5-10kg">
                      {t("tariffManagement.weight5_10")}
                    </SelectItem>
                    <SelectItem value="10-20kg">
                      {t("tariffManagement.weight10_20")}
                    </SelectItem>
                    <SelectItem value="20-50kg">
                      {t("tariffManagement.weight20_50")}
                    </SelectItem>
                    <SelectItem value="50+kg">
                      {t("tariffManagement.weight50plus")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">
                    {t("tariffManagement.basePrice")} *
                  </Label>
                  <Input
                    id="basePrice"
                    type="number"
                    value={formData.basePrice}
                    onChange={handleInputChange("basePrice")}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePerKg">
                    {t("tariffManagement.pricePerKg")}
                  </Label>
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
                {t("common.cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={createTariff.isPending}>
                {createTariff.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {t("tariffManagement.createTariff")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{t("tariffManagement.allTariffs")}</CardTitle>
            <Select
              value={serviceTypeFilter}
              onValueChange={setServiceTypeFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {t("tariffManagement.allTypes")}
                </SelectItem>
                <SelectItem value="STANDARD">
                  {t("tariffManagement.standard")}
                </SelectItem>
                <SelectItem value="EXPRESS">
                  {t("tariffManagement.express")}
                </SelectItem>
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
              title={t("tariffManagement.errorLoading")}
              description={
                error instanceof Error
                  ? error.message
                  : t("common.errorOccurred")
              }
            />
          ) : tariffs.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title={t("tariffManagement.noTariffs")}
              description={t("tariffManagement.noTariffsDescription")}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("tariffManagement.serviceType")}</TableHead>
                    <TableHead>{t("tariffManagement.originZone")}</TableHead>
                    <TableHead>
                      {t("tariffManagement.destinationZone")}
                    </TableHead>
                    <TableHead>{t("tariffManagement.weightBracket")}</TableHead>
                    <TableHead>{t("tariffManagement.price")}</TableHead>
                    <TableHead>{t("tariffManagement.actions")}</TableHead>
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
                      <TableCell>{tariff.destinationZone}</TableCell>
                      <TableCell>{tariff.weightBracket}</TableCell>
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
                    {t("tariffManagement.previous")}
                  </Button>
                  <span className="text-sm text-muted-foreground self-center">
                    {t("tariffManagement.pageOf", {
                      current: page + 1,
                      total: totalPages,
                    })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t("tariffManagement.next")}
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
            <DialogTitle>{t("tariffManagement.editTitle")}</DialogTitle>
            <DialogDescription>
              {t("tariffManagement.editDescription")}
            </DialogDescription>
          </DialogHeader>
          {editingTariff && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("tariffManagement.serviceType")}</Label>
                  <Input value={editingTariff.serviceType} disabled />
                </div>
                <div className="space-y-2">
                  <Label>{t("tariffManagement.weightBracket")}</Label>
                  <Input value={editingTariff.weightBracket} disabled />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("tariffManagement.originZone")}</Label>
                  <Input value={editingTariff.originZone} disabled />
                </div>
                <div className="space-y-2">
                  <Label>{t("tariffManagement.destinationZone")}</Label>
                  <Input value={editingTariff.destinationZone} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("tariffManagement.priceXAF")}</Label>
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
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUpdate} disabled={updateTariff.isPending}>
              {updateTariff.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("tariffManagement.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
