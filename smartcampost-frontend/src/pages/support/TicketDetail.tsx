import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Loader2, Send, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import {
  useTicket,
  useReplyToTicket,
  useUpdateTicketStatus,
} from "@/hooks";
import { useAuthStore } from "@/store/authStore";
import type { TicketStatus } from "@/types";

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  RESOLVED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CLOSED: "bg-muted text-muted-foreground",
};

export default function TicketDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const authUser = useAuthStore((s) => s.user);
  const normalizedRole = String(authUser?.role || "CLIENT").toUpperCase();
  const canReply = ["ADMIN", "STAFF", "AGENT"].includes(normalizedRole);

  const ticketId = id || "";
  const { data: ticket, isLoading, error } = useTicket(ticketId);
  const replyToTicket = useReplyToTicket();
  const updateStatus = useUpdateTicketStatus();
  const [replyMessage, setReplyMessage] = useState("");

  const listPath =
    normalizedRole === "ADMIN"
      ? "/admin/support"
      : normalizedRole === "STAFF"
        ? "/staff/support"
        : "/client/support";

  const handleReply = async () => {
    if (!replyMessage.trim()) return;
    try {
      await replyToTicket.mutateAsync({
        ticketId,
        data: { message: replyMessage.trim() },
      });
      setReplyMessage("");
      toast.success(t("support.detail.replySuccess", "Reply sent"));
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : t("support.detail.replyFailed", "Failed to send reply"),
      );
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatus.mutateAsync({
        ticketId,
        data: { status },
      });
      toast.success(t("support.detail.statusUpdated", "Status updated"));
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : t("support.detail.statusUpdateFailed", "Failed to update status"),
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(listPath)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("support.detail.back", "Back to tickets")}
        </Button>
        <EmptyState
          icon={HelpCircle}
          title={t("support.detail.notFound", "Ticket not found")}
          description={error instanceof Error ? error.message : undefined}
        />
      </div>
    );
  }

  // Replies are appended to the message as "\n\n[REPLY] ..." blocks server-side;
  // render with preserved whitespace so the thread reads naturally.
  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(listPath)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("support.detail.back", "Back to tickets")}
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{ticket.subject}</h1>
          <p className="text-sm text-muted-foreground">
            {t("support.list.ticketId", { id: ticket.id.slice(0, 8) })} ·{" "}
            {new Date(ticket.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {ticket.category && <Badge variant="outline">{ticket.category}</Badge>}
          <Badge className={statusColors[ticket.status] || ""}>
            {ticket.status}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("support.detail.thread", "Conversation")}</CardTitle>
          <CardDescription>
            {t(
              "support.detail.threadDescription",
              "Original message and staff replies",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{ticket.message}</p>
        </CardContent>
      </Card>

      {canReply && (
        <Card>
          <CardHeader>
            <CardTitle>{t("support.detail.respond", "Respond")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t("support.detail.updateStatus", "Update status")}:
              </span>
              <Select
                value={ticket.status}
                onValueChange={handleStatusChange}
                disabled={updateStatus.isPending}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as TicketStatus[]
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder={t(
                "support.detail.replyPlaceholder",
                "Type your reply to the client...",
              )}
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={4}
            />
            <Button
              onClick={handleReply}
              disabled={!replyMessage.trim() || replyToTicket.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              {replyToTicket.isPending
                ? t("support.detail.sending", "Sending...")
                : t("support.detail.sendReply", "Send Reply")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
