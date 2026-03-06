import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Settings,
  Plus,
  Loader2,
  Pencil,
  CheckCircle,
  XCircle,
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
  useIntegrations,
  useCreateIntegration,
  useUpdateIntegration,
} from "@/hooks";
import { toast } from "sonner";

const configTypes = [
  "PAYMENT",
  "SMS",
  "USSD",
  "MAPS",
  "NPSI",
  "ANALYTICS",
  "OTHER",
];

interface IntegrationFormData {
  provider: string;
  configType: string;
  baseUrl: string;
  apiKey: string;
  active: boolean;
}

interface EditingIntegration extends IntegrationFormData {
  id: string;
}

export default function IntegrationManagement() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] =
    useState<EditingIntegration | null>(null);
  const [formData, setFormData] = useState<IntegrationFormData>({
    configType: "PAYMENT",
    provider: "",
    baseUrl: "",
    apiKey: "",
    active: true,
  });

  const { data, isLoading, error } = useIntegrations(page, 20);
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();

  const integrations = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const resetForm = () => {
    setFormData({
      configType: "PAYMENT",
      provider: "",
      baseUrl: "",
      apiKey: "",
      active: true,
    });
  };

  const buildSettings = (baseUrl: string, apiKey: string) => {
    const settings: Record<string, unknown> = {};
    if (baseUrl) settings.baseUrl = baseUrl;
    if (apiKey) settings.apiKey = apiKey;
    return settings;
  };

  const handleCreate = () => {
    if (!formData.provider) {
      toast.error(t("integrations.toasts.providerRequired"));
      return;
    }
    createIntegration.mutate(
      {
        provider: formData.provider,
        configType: formData.configType,
        settings: buildSettings(formData.baseUrl, formData.apiKey),
        active: formData.active,
      },
      {
        onSuccess: () => {
          toast.success(t("integrations.toasts.created"));
          setIsCreateOpen(false);
          resetForm();
        },
        onError: (err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : t("integrations.toasts.createFailed"),
          ),
      },
    );
  };

  const handleEdit = (integration: EditingIntegration) => {
    setEditingIntegration(integration);
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingIntegration) return;
    updateIntegration.mutate(
      {
        id: editingIntegration.id,
        data: {
          provider: editingIntegration.provider,
          configType: editingIntegration.configType,
          settings: buildSettings(
            editingIntegration.baseUrl,
            editingIntegration.apiKey,
          ),
          active: editingIntegration.active,
        },
      },
      {
        onSuccess: () => {
          toast.success(t("integrations.toasts.updated"));
          setIsEditOpen(false);
          setEditingIntegration(null);
        },
        onError: (err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : t("integrations.toasts.updateFailed"),
          ),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("integrationManagement.title")}</h1>
          <p className="text-muted-foreground">
            {t("integrationManagement.subtitle")}
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
              {t("integrationManagement.addIntegration")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("integrationManagement.createTitle")}</DialogTitle>
              <DialogDescription>
                {t("integrationManagement.createDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="configType">{t("integrationManagement.configType")} *</Label>
                <Select
                  value={formData.configType}
                  onValueChange={(v: string) =>
                    setFormData({ ...formData, configType: v })
                  }
                >
                  <SelectTrigger id="configType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {configTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">{t("integrationManagement.providerName")} *</Label>
                <Input
                  id="provider"
                  value={formData.provider}
                  onChange={(e) =>
                    setFormData({ ...formData, provider: e.target.value })
                  }
                  placeholder={t("integrationManagement.providerPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseUrl">{t("integrationManagement.baseUrl")}</Label>
                <Input
                  id="baseUrl"
                  value={formData.baseUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, baseUrl: e.target.value })
                  }
                  placeholder={t("integrationManagement.baseUrlPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">{t("integrationManagement.apiKey")}</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  placeholder={t("integrationManagement.apiKeyPlaceholder")}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  aria-label="Integration active status"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.checked })
                  }
                />
                <Label htmlFor="active">{t("integrationManagement.active")}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createIntegration.isPending}
              >
                {createIntegration.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {t("integrationManagement.createIntegration")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("integrationManagement.allIntegrations")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <EmptyState
              icon={Settings}
              title={t("integrationManagement.errorLoading")}
              description={
                error instanceof Error ? error.message : "An error occurred"
              }
            />
          ) : integrations.length === 0 ? (
            <EmptyState
              icon={Settings}
              title={t("integrationManagement.noIntegrations")}
              description={t("integrationManagement.noIntegrationsDescription")}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("integrationManagement.type")}</TableHead>
                    <TableHead>{t("integrationManagement.provider")}</TableHead>
                    <TableHead>{t("integrationManagement.baseUrl")}</TableHead>
                    <TableHead>{t("integrationManagement.status")}</TableHead>
                    <TableHead>{t("integrationManagement.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {integration.configType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {integration.provider}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {(integration.settings?.baseUrl as string) || "—"}
                      </TableCell>
                      <TableCell>
                        {integration.active ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {t("integrationManagement.active")}
                          </Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground">
                            <XCircle className="w-3 h-3 mr-1" />
                            {t("integrationManagement.inactive")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleEdit({
                              id: integration.id,
                              configType: integration.configType,
                              provider: integration.provider,
                              baseUrl:
                                (integration.settings?.baseUrl as string) || "",
                              apiKey:
                                (integration.settings?.apiKey as string) || "",
                              active: integration.active,
                            })
                          }
                        >
                          <Pencil className="w-4 h-4" />
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
                    {t("integrationManagement.previous")}
                  </Button>
                  <span className="text-sm text-muted-foreground self-center">
                    {t("integrationManagement.pageOf", { current: page + 1, total: totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t("integrationManagement.next")}
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
            <DialogTitle>{t("integrationManagement.editTitle")}</DialogTitle>
            <DialogDescription>
              {t("integrationManagement.editDescription")}
            </DialogDescription>
          </DialogHeader>
          {editingIntegration && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("integrationManagement.configType")}</Label>
                <Select
                  value={editingIntegration.configType}
                  onValueChange={(v: string) =>
                    setEditingIntegration({
                      ...editingIntegration,
                      configType: v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {configTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("integrationManagement.providerName")}</Label>
                <Input
                  value={editingIntegration.provider}
                  onChange={(e) =>
                    setEditingIntegration({
                      ...editingIntegration,
                      provider: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("integrationManagement.baseUrl")}</Label>
                <Input
                  value={editingIntegration.baseUrl}
                  onChange={(e) =>
                    setEditingIntegration({
                      ...editingIntegration,
                      baseUrl: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("integrationManagement.apiKey")}</Label>
                <Input
                  type="password"
                  value={editingIntegration.apiKey}
                  onChange={(e) =>
                    setEditingIntegration({
                      ...editingIntegration,
                      apiKey: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editActive"
                  aria-label="Integration edit active status"
                  checked={editingIntegration.active}
                  onChange={(e) =>
                    setEditingIntegration({
                      ...editingIntegration,
                      active: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="editActive">{t("integrationManagement.active")}</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateIntegration.isPending}
            >
              {updateIntegration.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("integrationManagement.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
