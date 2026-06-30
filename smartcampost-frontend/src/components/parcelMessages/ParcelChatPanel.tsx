import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  parcelMessageKeys,
  useMarkParcelMessagesRead,
  useParcelMessages,
  useParcelMessageSSE,
  useSendParcelMessage,
} from "@/hooks";
import type { ParcelMessage } from "@/services";
import { toast } from "sonner";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ParcelChatPanel({ parcelId }: { parcelId: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useParcelMessages(parcelId);
  const sendMessage = useSendParcelMessage(parcelId);
  const markRead = useMarkParcelMessagesRead(parcelId);

  const handleIncoming = useCallback(
    (message: ParcelMessage) => {
      queryClient.setQueryData<ParcelMessage[]>(
        parcelMessageKeys.list(parcelId),
        (old) => {
          if (!old) return [message];
          if (old.some((m) => m.id === message.id)) return old;
          return [...old, message];
        },
      );
    },
    [queryClient, parcelId],
  );

  useParcelMessageSSE(parcelId, handleIncoming);

  useEffect(() => {
    if (parcelId) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcelId, messagesQuery.data?.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messagesQuery.data]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    try {
      await sendMessage.mutateAsync(content);
    } catch (e) {
      setDraft(content);
      toast.error(
        e instanceof Error ? e.message : t("parcels.chat.sendFailed", "Failed to send message"),
      );
    }
  };

  const messages = messagesQuery.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-4 w-4" />
          {t("parcels.chat.title", "Delivery Chat")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea ref={scrollRef} className="h-72 rounded-md border p-3">
          {messagesQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("parcels.chat.empty", "No messages yet. Say hello!")}
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      m.mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {!m.mine && (
                      <p className="text-xs font-medium opacity-70 mb-0.5">
                        {m.senderName}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        m.mine ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="flex gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t("parcels.chat.placeholder", "Type a message…")}
            className="min-h-[40px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || sendMessage.isPending}
            size="icon"
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
