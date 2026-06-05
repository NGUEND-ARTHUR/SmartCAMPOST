import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  approvalsApi,
  ApprovalRequestDto,
} from "@/services/approvals/approvals.api";
import { useTranslation } from "react-i18next";

export default function ApprovalsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ApprovalRequestDto[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await approvalsApi.pending();
      setItems(res ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const handleApprove = async (id: string) => {
    try {
      await approvalsApi.approve(id);
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeny = async (id: string) => {
    try {
      await approvalsApi.deny(id);
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>
              {t("approvals.title", "AI Approval Requests")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading…</div>
            ) : items.length === 0 ? (
              <div>No pending approvals</div>
            ) : (
              <div className="space-y-4">
                {items.map((it) => (
                  <div key={it.id} className="border rounded p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{it.toolName}</div>
                        <div className="text-sm text-muted-foreground">
                          {it.reason}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {it.parametersJson ? (
                            <pre className="whitespace-pre-wrap text-xs">
                              {it.parametersJson}
                            </pre>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          onClick={() => handleApprove(it.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeny(it.id)}
                        >
                          Deny
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
