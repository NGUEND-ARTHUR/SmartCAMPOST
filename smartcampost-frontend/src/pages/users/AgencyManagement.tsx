import { useState } from "react";
import {
  Building2,
  Plus,
  Edit,
  Loader2,
  Search,
  MapPin,
  Phone,
  Mail,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { useAgencies, useCreateAgency, useUpdateAgency } from "@/hooks";

import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function AgencyManagement() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    region: "",
    country: "Cameroon",
    phone: "",
    email: "",
  });

  const { data, isLoading, error } = useAgencies(page, 20);
  const createAgency = useCreateAgency();
  const updateAgency = useUpdateAgency();

  const agencies = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const filteredAgencies = agencies.filter((a) => {
    const search = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(search) ||
      (a.city?.toLowerCase().includes(search) ?? false)
    );
  });

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      address: "",
      city: "",
      region: "",
      country: "Cameroon",
      phone: "",
      email: "",
    });
  };

  const handleCreate = () => {
    if (!formData.name) {
      toast.error(t("agencies.form.requiredFields"));
      return;
    }
    // Map to backend field names
    const payload = {
      agencyName: formData.name,
      agencyCode: formData.code || undefined,
      city: formData.city || undefined,
      region: formData.region || undefined,
    };
    createAgency.mutate(payload, {
      onSuccess: () => {
        toast.success(t("agencies.create.success"));
        setIsCreateOpen(false);
        resetForm();
      },
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : t("agencies.create.error"),
        ),
    });
  };

  const handleEdit = (agency: (typeof agencies)[0]) => {
    setSelectedAgency(agency.id);
    setFormData({
      name: agency.name,
      code: agency.code || "",
      address: agency.address || "",
      city: agency.city || "",
      region: agency.region || "",
      country: agency.country || "Cameroon",
      phone: agency.phone || "",
      email: agency.email || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedAgency || !formData.name) {
      toast.error(t("agencies.form.requiredFields"));
      return;
    }
    // Map to backend field names
    const payload = {
      agencyName: formData.name,
      agencyCode: formData.code || undefined,
      city: formData.city || undefined,
      region: formData.region || undefined,
    };
    updateAgency.mutate(
      { id: selectedAgency, data: payload },
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

  // Form fields JSX - used inline to avoid re-render issues
  const formFields = (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("agencies.form.name")}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={t("agencies.form.namePlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">{t("agencies.form.code")}</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
            placeholder={t("agencies.form.codePlaceholder")}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">{t("agencies.form.address")}</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          placeholder={t("agencies.form.addressPlaceholder")}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">{t("agencies.form.city")}</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            placeholder={t("agencies.form.cityPlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="region">{t("agencies.form.region")}</Label>
          <Input
            id="region"
            value={formData.region}
            onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
            placeholder={t("agencies.form.regionPlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">{t("agencies.form.country")}</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            placeholder={t("agencies.form.countryPlaceholder")}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">{t("agencies.form.phone")}</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder={t("agencies.form.phonePlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t("agencies.form.email")}</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder={t("agencies.form.emailPlaceholder")}
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
          <p className="text-muted-foreground">
            {t("agencies.subtitle")}
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
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={createAgency.isPending}>
                {createAgency.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
                error instanceof Error ? error.message : t("common.errorOccurred")
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
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("agencies.list.agency")}</TableHead>
                    <TableHead>{t("agencies.list.location")}</TableHead>
                    <TableHead>{t("agencies.list.contact")}</TableHead>
                    <TableHead>{t("agencies.list.status")}</TableHead>
                    <TableHead>{t("agencies.list.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgencies.map((agency) => (
                    <TableRow key={agency.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{agency.name}</div>
                          {agency.code && (
                            <div className="text-xs text-muted-foreground">
                              {agency.code}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3" />
                          {agency.city || t("common.notAvailable")}
                          {agency.region ? `, ${agency.region}` : ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {agency.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {agency.phone}
                            </div>
                          )}
                          {agency.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {agency.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            agency.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {agency.isActive ? t("agencies.status.active") : t("agencies.status.inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(agency)}
                        >
                          <Edit className="w-4 h-4" />
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
                    {t("common.previous")}
                  </Button>
                  <span className="text-sm text-muted-foreground self-center">
                    {t("common.pageOf", { page: page + 1, total: totalPages })}
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

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("agencies.update.title")}</DialogTitle>
            <DialogDescription>{t("agencies.update.subtitle")}</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); setSelectedAgency(null); }}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUpdate} disabled={updateAgency.isPending}>
              {updateAgency.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("agencies.update.action")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
