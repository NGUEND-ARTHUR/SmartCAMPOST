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
      toast.error("Provider name is required");
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
          toast.success("Integration created successfully");
          setIsCreateOpen(false);
          resetForm();
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Failed to create integration",
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
          toast.success("Integration updated successfully");
          setIsEditOpen(false);
          setEditingIntegration(null);
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Failed to update integration",
          ),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Integration Management</h1>
          <p className="text-muted-foreground">
            Configure external service integrations (SMS, Payments, Maps, etc.)
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
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Integration</DialogTitle>
              <DialogDescription>
                Add a new external service integration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="configType">Config Type *</Label>
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
                <Label htmlFor="provider">Provider Name *</Label>
                <Input
                  id="provider"
                  value={formData.provider}
                  onChange={(e) =>
                    setFormData({ ...formData, provider: e.target.value })
                  }
                  placeholder="e.g., Orange Money, Twilio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  value={formData.baseUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, baseUrl: e.target.value })
                  }
                  placeholder="https://api.provider.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  placeholder="••••••••"
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
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createIntegration.isPending}
              >
                {createIntegration.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create Integration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <EmptyState
              icon={Settings}
              title="Error loading integrations"
              description={
                error instanceof Error ? error.message : "An error occurred"
              }
            />
          ) : integrations.length === 0 ? (
            <EmptyState
              icon={Settings}
              title="No integrations configured"
              description="Add your first integration to connect external services"
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Base URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
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
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
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
            <DialogTitle>Edit Integration</DialogTitle>
            <DialogDescription>
              Update integration configuration
            </DialogDescription>
          </DialogHeader>
          {editingIntegration && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Config Type</Label>
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
                <Label>Provider Name</Label>
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
                <Label>Base URL</Label>
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
                <Label>API Key</Label>
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
                <Label htmlFor="editActive">Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateIntegration.isPending}
            >
              {updateIntegration.isPending && (
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
