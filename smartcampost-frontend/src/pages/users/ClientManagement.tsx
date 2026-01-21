import { useState } from "react";
import { Users, Loader2, Search, Eye, Mail, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { useClients, useClient } from "@/hooks";

export default function ClientManagement() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data, isLoading, error } = useClients(page, 20);
  const { data: clientDetail, isLoading: detailLoading } = useClient(
    selectedClientId || "",
  );

  const clients = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const filteredClients = clients.filter((c) => {
    const search = searchQuery.toLowerCase();
    return (
      (c.fullName || "").toLowerCase().includes(search) ||
      (c.phone || "").includes(search) ||
      ((c.email || "").toLowerCase().includes(search) ?? false)
    );
  });

  const handleViewDetails = (clientId: string) => {
    setSelectedClientId(clientId);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("clientManagement.title")}</h1>
        <p className="text-muted-foreground">
          {t("clientManagement.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Clients</CardTitle>
            <div className="flex items-center space-x-2">
              <Input
                placeholder={t("clientManagement.searchPlaceholder")}
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
              icon={Users}
              title={t("clientManagement.errorLoading")}
              description={
                error instanceof Error ? error.message : "An error occurred"
              }
            />
          ) : filteredClients.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t("clientManagement.noClientsFound")}
              description={
                searchQuery
                  ? t("clientManagement.tryAdjustingSearch")
                  : t("clientManagement.registeredClientsAppearHere")
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {client.id.slice(0, 8)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.email ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {client.preferredLanguage || "fr"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(client.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
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

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("clientManagement.clientDetails")}</DialogTitle>
            <DialogDescription>
              {t("clientManagement.viewClientInformation")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {detailLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : clientDetail ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">{clientDetail.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{clientDetail.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{clientDetail.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Preferred Language
                    </p>
                    <p className="font-medium">
                      {clientDetail.preferredLanguage || "fr"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Client ID</p>
                    <p className="font-medium font-mono text-xs">
                      {clientDetail.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-medium font-mono text-xs">
                      {clientDetail.userId}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Registered on</p>
                  <p className="font-medium">
                    {new Date(clientDetail.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Client not found
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
