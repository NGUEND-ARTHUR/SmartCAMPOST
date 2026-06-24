import React, { useState } from "react";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  MapPin,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  useAgencies,
  useCreateAgency,
  useUpdateAgency,
  useDeleteAgency,
} from "@/hooks";

import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function AgencyManagement() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    agencyName: "",
    agencyCode: "",
    city: "",
    region: "",
    country: "Cameroon",
  });

  const { data: agencies = [], isLoading, error } = useAgencies();
  const createAgency = useCreateAgency();
  const updateAgency = useUpdateAgency();
  const deleteAgency = useDeleteAgency();

  const filteredAgencies = agencies.filter((a) => {
    const search = searchQuery.toLowerCase();
    return (
      a.agencyName.toLowerCase().includes(search) ||
      a.agencyCode.toLowerCase().includes(search) ||
      (a.city?.toLowerCase().includes(search) ?? false)
    );
  });

  const resetForm = () => {
    setFormData({
      agencyName: "",
      agencyCode: "",
      city: "",
      region: "",
      country: "Cameroon",
    });
  };

  const handleCreate = () => {
    if (!formData.agencyName) {
      toast.error(t("agencies.form.requiredFields"));
      return;
    }
    createAgency.mutate(
      {
        agencyName: formData.agencyName,
        agencyCode: formData.agencyCode || undefined,
        city: formData.city || undefined,
        region: formData.region || undefined,
        country: formData.country || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("agencies.create.success"));
          setIsCreateOpen(false);
          resetForm();
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : t("agencies.create.error"),
          ),
      },
    );
  };

  const handleEdit = (agency: (typeof agencies)[0]) => {
    setSelectedAgency(agency.id);
    setFormData({
      agencyName: agency.agencyName,
      agencyCode: agency.agencyCode || "",
      city: agency.city || "",
      region: agency.region || "",
      country: agency.country || "Cameroon",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedAgency || !formData.agencyName) {
      toast.error(t("agencies.form.requiredFields"));
      return;
    }
    updateAgency.mutate(
      {
        id: selectedAgency,
        data: {
          agencyName: formData.agencyName,
          agencyCode: formData.agencyCode || undefined,
          city: formData.city || undefined,
          region: formData.region || undefined,
          country: formData.country || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(t("agencies.update.success"));
          setIsEditOpen(false);
          resetForm();
          setSelectedAgency(null);
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : t("agencies.update.error"),
          ),
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteAgency.mutate(id, {
      onSuccess: () => toast.success(t("agencies.delete.success")),
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : t("agencies.delete.error"),
        ),
    });
  };

  const formFields = (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="agencyName">{t("agencies.form.name")} *</Label>
          <Input
            id="agencyName"
            value={formData.agencyName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, agencyName: e.target.value }))
            }
            placeholder={t("agencies.form.namePlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agencyCode">{t("agencies.form.code")}</Label>
          <Input
            id="agencyCode"
            value={formData.agencyCode}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, agencyCode: e.target.value }))
            }
            placeholder={t("agencies.form.codePlaceholder")}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">{t("agencies.form.city")}</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, city: e.target.value }))
            }
            placeholder={t("agencies.form.cityPlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="region">{t("agencies.form.region")}</Label>
          <Input
            id="region"
            value={formData.region}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, region: e.target.value }))
            }
            placeholder={t("agencies.form.regionPlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">{t("agencies.form.country")}</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, country: e.target.value }))
            }
            placeholder={t("agencies.form.countryPlaceholder")}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("agencies.title")}</h1>
          <p className="text-muted-foreground">{t("agencies.subtitle")}</p>
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
              {t("agencies.add")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("agencies.create.title")}</DialogTitle>
              <DialogDescription>
                {t("agencies.create.subtitle")}
              </DialogDescription>
            </DialogHeader>
            {formFields}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={createAgency.isPending}>
                {createAgency.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {t("agencies.create.action")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("agencies.list.title")}</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("agencies.list.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
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
              icon={Building2}
              title={t("agencies.list.errorTitle")}
              description={
                error instanceof Error
                  ? error.message
                  : t("common.errorOccurred")
              }
            />
          ) : filteredAgencies.length === 0 ? (
            <EmptyState
              icon={Building2}
              title={t("agencies.list.emptyTitle")}
              description={
                searchQuery
                  ? t("agencies.list.emptyFiltered")
                  : t("agencies.list.emptyDefault")
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("agencies.list.agency")}</TableHead>
                  <TableHead>{t("agencies.list.location")}</TableHead>
                  <TableHead>{t("agencies.form.country")}</TableHead>
                  <TableHead>{t("agencies.list.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgencies.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{agency.agencyName}</div>
                        <div className="text-xs text-muted-foreground">
                          {agency.agencyCode}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3" />
                        {agency.city || t("common.notAvailable")}
                        {agency.region ? `, ${agency.region}` : ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {agency.country || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(agency)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(agency.id)}
                          disabled={deleteAgency.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("agencies.update.title")}</DialogTitle>
            <DialogDescription>
              {t("agencies.update.subtitle")}
            </DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                resetForm();
                setSelectedAgency(null);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUpdate} disabled={updateAgency.isPending}>
              {updateAgency.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("agencies.update.action")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
