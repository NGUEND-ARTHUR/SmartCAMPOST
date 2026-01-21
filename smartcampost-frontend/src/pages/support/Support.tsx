import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  HelpCircle,
  Plus,
  MessageSquare,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { TicketStatus, TicketCategory, TicketPriority } from "@/types";
import { useMyTickets, useCreateTicket, useMyParcels } from "@/hooks";
import { toast } from "sonner";

const statusColors: Record<TicketStatus, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
};
const priorityColors: Record<TicketPriority, string> = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};
// category labels rely on translations; will be created inside component where `t` is available

export default function Support() {
  const { t } = useTranslation();
  const categoryLabels: Record<string, string> = {
    DELIVERY: t("support.category.delivery"),
    PAYMENT: t("support.category.payment"),
    DAMAGED: t("support.category.damaged"),
    LOST: t("support.category.lost"),
    OTHER: t("support.category.other"),
  };
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    category: "" as TicketCategory,
    parcelId: "",
  });

  const { data, isLoading, error } = useMyTickets(page, 20);
  const { data: parcelsData } = useMyParcels(0, 100);
  const createTicket = useCreateTicket();

  const tickets = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const parcels = parcelsData?.content ?? [];

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const ticketStats = {
    open: tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
    total: tickets.length,
  };

  const handleSubmit = () => {
    if (!formData.subject || !formData.description || !formData.category) {
      toast.error(t("support.form.requiredFields"));
      return;
    }
    createTicket.mutate(
      {
        subject: formData.subject,
        message: formData.description,
        category: formData.category,
      },
      {
        onSuccess: () => {
          toast.success(t("support.create.success"));
          setIsDialogOpen(false);
          setFormData({
            subject: "",
            description: "",
            category: "" as TicketCategory,
            parcelId: "",
          });
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : t("support.create.error"),
          ),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("support.title")}</h1>
          <p className="text-muted-foreground">{t("support.subtitle")}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t("support.add")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("support.create.title")}</DialogTitle>
              <DialogDescription>
                {t("support.create.subtitle")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">{t("support.form.category")}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: string) =>
                    setFormData({
                      ...formData,
                      category: value as TicketCategory,
                    })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue
                      placeholder={t("support.form.categoryPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DELIVERY">
                      {t("support.category.delivery")}
                    </SelectItem>
                    <SelectItem value="PAYMENT">
                      {t("support.category.payment")}
                    </SelectItem>
                    <SelectItem value="DAMAGED">
                      {t("support.category.damaged")}
                    </SelectItem>
                    <SelectItem value="LOST">
                      {t("support.category.lost")}
                    </SelectItem>
                    <SelectItem value="OTHER">
                      {t("support.category.other")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parcelId">{t("support.form.parcel")}</Label>
                <Select
                  value={formData.parcelId}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, parcelId: value })
                  }
                >
                  <SelectTrigger id="parcelId">
                    <SelectValue
                      placeholder={t("support.form.parcelPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {parcels.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.trackingRef || p.id.slice(0, 10)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">{t("support.form.subject")}</Label>
                <Input
                  id="subject"
                  placeholder={t("support.form.subjectPlaceholder")}
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">
                  {t("support.form.description")}
                </Label>
                <Textarea
                  id="description"
                  placeholder={t("support.form.descriptionPlaceholder")}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={createTicket.isPending}>
                {createTicket.isPending
                  ? t("support.create.creating")
                  : t("support.create.action")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{ticketStats.open}</div>
            <p className="text-xs text-muted-foreground">
              {t("support.stats.open")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{ticketStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              {t("support.stats.inProgress")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{ticketStats.resolved}</div>
            <p className="text-xs text-muted-foreground">
              {t("support.stats.resolved")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{ticketStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {t("support.stats.total")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("support.list.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="w-full sm:w-44"
                  title="Filter by status"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue
                    placeholder={t("support.list.statusPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("support.status.all")}</SelectItem>
                  <SelectItem value="OPEN">
                    {t("support.status.open")}
                  </SelectItem>
                  <SelectItem value="IN_PROGRESS">
                    {t("support.status.inProgress")}
                  </SelectItem>
                  <SelectItem value="RESOLVED">
                    {t("support.status.resolved")}
                  </SelectItem>
                  <SelectItem value="CLOSED">
                    {t("support.status.closed")}
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
              icon={HelpCircle}
              title={t("support.list.errorTitle")}
              description={
                error instanceof Error
                  ? error.message
                  : t("common.errorOccurred")
              }
            />
          ) : filteredTickets.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title={t("support.list.emptyTitle")}
              description={
                searchQuery || statusFilter !== "ALL"
                  ? t("support.list.emptyFiltered")
                  : t("support.list.emptyDefault")
              }
              actionLabel={
                !searchQuery && statusFilter === "ALL"
                  ? t("support.list.createAction")
                  : undefined
              }
              onAction={() => setIsDialogOpen(true)}
            />
          ) : (
            <>
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <Card key={ticket.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <MessageSquare className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">
                                {ticket.subject}
                              </h3>
                              <Badge
                                className={
                                  statusColors[ticket.status as TicketStatus]
                                }
                              >
                                {t(
                                  `support.status.${ticket.status.replace("_", "").toLowerCase()}`,
                                )}
                              </Badge>
                              <Badge variant="outline">
                                {ticket.category
                                  ? categoryLabels[ticket.category]
                                  : ""}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {ticket.message}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                {t("support.list.ticketId", {
                                  id: ticket.id.slice(0, 8),
                                })}
                              </span>
                              <span>
                                {t("support.list.created")}:{" "}
                                {new Date(
                                  ticket.createdAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          {t("support.list.viewDetails")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
    </div>
  );
}
