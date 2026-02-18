import { useState } from "react";
import {
  UserCheck,
  Plus,
  Loader2,
  Search,
  Filter,
  Building2,
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
  useAgents,
  useCreateAgent,
  useUpdateAgentStatus,
  useAssignAgentAgency,
  useAgencies,
} from "@/hooks";

import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  INACTIVE: "bg-muted text-muted-foreground",
  SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function AgentManagement() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("");
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    agencyId: "",
  });

  const { data, isLoading, error } = useAgents(page, 20);
  const { data: agenciesData } = useAgencies(0, 100);
  const createAgent = useCreateAgent();
  const updateStatus = useUpdateAgentStatus();
  const assignAgency = useAssignAgentAgency();

  const agents = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const agencies = agenciesData?.content ?? [];

  const filteredAgents = agents.filter((a) => {
    const matchesSearch =
      a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.phone.includes(searchQuery);
    const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      fullName: "",
      phone: "",
      email: "",
      password: "",
      agencyId: "",
    });
  };

  const handleCreate = () => {
    if (!formData.fullName || !formData.phone || !formData.password) {
      toast.error(t("agents.form.requiredFields"));
      return;
    }
    createAgent.mutate(formData, {
      onSuccess: () => {
        toast.success(t("agents.create.success"));
        setIsCreateOpen(false);
        resetForm();
      },
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : t("agents.create.error"),
        ),
    });
  };

  const handleStatusChange = (agentId: string, newStatus: string) => {
    updateStatus.mutate(
      { id: agentId, data: { status: newStatus } },
      {
        onSuccess: () =>
          toast.success(t("agents.status.updated", { status: newStatus })),
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : t("agents.status.error"),
          ),
      },
    );
  };

  const handleOpenAssign = (agentId: string, currentAgencyId?: string) => {
    setSelectedAgentId(agentId);
    setSelectedAgencyId(currentAgencyId || "");
    setIsAssignOpen(true);
  };

  const handleAssignAgency = () => {
    if (!selectedAgentId || !selectedAgencyId) {
      toast.error(t("agents.assign.selectAgency"));
      return;
    }
    assignAgency.mutate(
      { id: selectedAgentId, data: { agencyId: selectedAgencyId } },
      {
        onSuccess: () => {
          toast.success(t("agents.assign.success"));
          setIsAssignOpen(false);
          setSelectedAgentId(null);
          setSelectedAgencyId("");
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : t("agents.assign.error"),
          ),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("agents.title")}</h1>
          <p className="text-muted-foreground">{t("agents.subtitle")}</p>
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
              {t("agents.add")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("agents.create.title")}</DialogTitle>
              <DialogDescription>
                {t("agents.create.subtitle")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("agents.form.fullName")}</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder={t("agents.form.fullNamePlaceholder")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("agents.form.phone")}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder={t("agents.form.phonePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("agents.form.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder={t("agents.form.emailPlaceholder")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("agents.form.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={t("agents.form.passwordPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agencyId">
                  {t("agents.form.assignAgency")}
                </Label>
                <Select
                  value={formData.agencyId}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, agencyId: value })
                  }
                >
                  <SelectTrigger id="agencyId">
                    <SelectValue
                      placeholder={t("agents.form.selectAgencyPlaceholder")}
                    />
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={createAgent.isPending}>
                {createAgent.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {t("agents.create.action")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{t("agents.list.title")}</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("agents.list.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-52"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue
                    placeholder={t("agents.list.statusPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("agents.status.all")}</SelectItem>
                  <SelectItem value="ACTIVE">
                    {t("agents.status.active")}
                  </SelectItem>
                  <SelectItem value="INACTIVE">
                    {t("agents.status.inactive")}
                  </SelectItem>
                  <SelectItem value="SUSPENDED">
                    {t("agents.status.suspended")}
                  </SelectItem>
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
              icon={UserCheck}
              title={t("agents.list.errorTitle")}
              description={
                error instanceof Error
                  ? error.message
                  : t("common.errorOccurred")
              }
            />
          ) : filteredAgents.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title={t("agents.list.emptyTitle")}
              description={
                searchQuery || statusFilter !== "ALL"
                  ? t("agents.list.emptyFiltered")
                  : t("agents.list.emptyDefault")
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("agents.list.agent")}</TableHead>
                    <TableHead>{t("agents.list.contact")}</TableHead>
                    <TableHead>{t("agents.list.agency")}</TableHead>
                    <TableHead>{t("agents.list.status")}</TableHead>
                    <TableHead>{t("agents.list.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{agent.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {agent.id.slice(0, 8)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{agent.phone}</div>
                          {agent.email && (
                            <div className="text-muted-foreground">
                              {agent.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {agent.agencyName ? (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 w-fit"
                          >
                            <Building2 className="w-3 h-3" />
                            {agent.agencyName}
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenAssign(agent.id)}
                          >
                            {t("agents.assign.action")}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusColors[agent.status] ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {agent.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Select
                            value={agent.status}
                            onValueChange={(value: string) =>
                              handleStatusChange(agent.id, value)
                            }
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ACTIVE">
                                {t("agents.status.active")}
                              </SelectItem>
                              <SelectItem value="INACTIVE">
                                {t("agents.status.inactive")}
                              </SelectItem>
                              <SelectItem value="SUSPENDED">
                                {t("agents.status.suspended")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
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

      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("agents.assign.title")}</DialogTitle>
            <DialogDescription>{t("agents.assign.subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="assignAgency">
              {t("agents.form.assignAgency")}
            </Label>
            <Select
              value={selectedAgencyId}
              onValueChange={setSelectedAgencyId}
            >
              <SelectTrigger id="assignAgency">
                <SelectValue
                  placeholder={t("agents.form.selectAgencyPlaceholder")}
                />
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleAssignAgency}
              disabled={assignAgency.isPending}
            >
              {assignAgency.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("agents.assign.action")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
