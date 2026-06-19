import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  Bot,
  BrainCircuit,
  CreditCard,
  FileText,
  Headphones,
  History,
  MapPinned,
  QrCode,
  Radio,
  Route,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  UserRound,
  Truck,
  Upload,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import DataTable, { type DataTableColumn } from "@/components/DataTable";
import ErrorBanner from "@/components/ErrorBanner";
import { httpClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import {
  useParcels,
  usePickups,
  usePayments,
  useTickets,
} from "@/hooks";

type RecordRow = Record<string, unknown>;

function text(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function short(value: unknown) {
  const s = text(value);
  return s.length > 14 ? s.slice(0, 12) : s;
}

function statusBadge(value: unknown) {
  const s = text(value, "UNKNOWN");
  return <Badge variant="outline">{s.replace(/_/g, " ")}</Badge>;
}

function useSearch<T>(rows: T[], selector: (row: T) => string) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => selector(row).toLowerCase().includes(q));
  }, [query, rows, selector]);
  return { query, setQuery, filtered };
}

function extractRows(response: unknown): RecordRow[] {
  if (Array.isArray(response)) return response as RecordRow[];
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.content)) return obj.content as RecordRow[];
    if (Array.isArray(obj.items)) return obj.items as RecordRow[];
    if (Array.isArray(obj.data)) return obj.data as RecordRow[];
    if (Array.isArray(obj.opportunities)) return obj.opportunities as RecordRow[];
    if (Array.isArray(obj.permissions)) {
      return (obj.permissions as unknown[]).map((permission) => ({
        role: obj.role,
        permission,
      }));
    }
  }
  return [];
}

function GenericEndpointPage({
  title,
  description,
  endpoint,
  icon: Icon,
  breadcrumbs,
  emptyTitle,
  searchPlaceholder,
}: {
  title: string;
  description: string;
  endpoint: string;
  icon: ComponentType<{ className?: string }>;
  breadcrumbs: { label: string; to?: string }[];
  emptyTitle: string;
  searchPlaceholder: string;
}) {
  const [query, setQuery] = useState("");
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["generic-endpoint", endpoint],
    queryFn: async () => extractRows(await httpClient.get<unknown>(endpoint)),
  });
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [data, query]);
  const keys = useMemo(
    () =>
      Array.from(
        new Set(rows.flatMap((row) => Object.keys(row)).slice(0, 24)),
      ).slice(0, 6),
    [rows],
  );
  const columns: DataTableColumn<RecordRow>[] =
    keys.length > 0
      ? keys.map((key) => ({
          key,
          header: key.replace(/_/g, " ").replace(/([A-Z])/g, " $1"),
          cell: (row) =>
            typeof row[key] === "object"
              ? JSON.stringify(row[key])
              : text(row[key]),
        }))
      : [
          { key: "record", header: "Record", cell: (row) => JSON.stringify(row) },
        ];

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} breadcrumbs={breadcrumbs} />
      {error && (
        <ErrorBanner
          message={error instanceof Error ? error.message : "Failed to load records"}
        />
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={rows}
            columns={columns}
            getRowKey={(row) => text(row.id ?? row.sessionId ?? JSON.stringify(row))}
            isLoading={isLoading}
            searchValue={query}
            onSearchChange={setQuery}
            searchPlaceholder={searchPlaceholder}
            emptyTitle={emptyTitle}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ActionFormPage({
  title,
  description,
  icon: Icon,
  breadcrumbs,
  fields,
  endpoint,
  method = "post",
  submitLabel,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  breadcrumbs: { label: string; to?: string }[];
  fields: { name: string; label: string; type?: string; placeholder?: string }[];
  endpoint: string;
  method?: "post" | "patch";
  submitLabel: string;
}) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [result, setResult] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const body = Object.fromEntries(
        Object.entries(form).filter(([, value]) => value.trim() !== ""),
      );
      const res =
        method === "patch"
          ? await httpClient.patch(endpoint, body)
          : await httpClient.post(endpoint, body);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} breadcrumbs={breadcrumbs} />
      {error && <ErrorBanner message={error} />}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <label key={field.name} className="space-y-2 text-sm font-medium">
                <span>{field.label}</span>
                {field.type === "textarea" ? (
                  <textarea
                    className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={form[field.name] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [field.name]: event.target.value,
                      }))
                    }
                  />
                ) : (
                  <input
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    type={field.type ?? "text"}
                    value={form[field.name] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [field.name]: event.target.value,
                      }))
                    }
                  />
                )}
              </label>
            ))}
          </div>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Processing..." : submitLabel}
          </Button>
          {result !== null && (
            <pre className="max-h-72 overflow-auto rounded-md bg-muted p-4 text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AgentPickupsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = usePickups(page, 20);
  const rows = data?.content ?? [];
  const search = useSearch(
    rows,
    (r) => `${r.id} ${r.trackingRef ?? ""} ${r.clientName ?? ""} ${r.state}`,
  );

  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    { key: "id", header: t("ops.columns.pickup"), cell: (r) => short(r.id) },
    { key: "client", header: t("ops.columns.client"), cell: (r) => text(r.clientName ?? r.clientId) },
    { key: "parcel", header: t("ops.columns.parcel"), cell: (r) => text(r.trackingRef ?? r.parcelId) },
    { key: "state", header: t("ops.columns.state"), cell: (r) => statusBadge(r.state) },
    { key: "courier", header: t("ops.columns.courier"), cell: (r) => text(r.courierName ?? r.courierId) },
    { key: "date", header: t("ops.columns.requested"), cell: (r) => text(r.requestedDate ?? r.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("ops.agentPickups.title")}
        description={t("ops.agentPickups.description")}
        breadcrumbs={[{ label: t("nav.dashboard"), to: "/agent" }, { label: t("nav.pickups") }]}
      />
      {error && (
        <ErrorBanner message={error instanceof Error ? error.message : t("ops.errors.pickups")} />
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" /> {t("ops.agentPickups.queue")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={search.filtered}
            columns={columns}
            getRowKey={(r) => r.id}
            isLoading={isLoading}
            searchValue={search.query}
            onSearchChange={search.setQuery}
            searchPlaceholder={t("ops.agentPickups.search")}
            page={page}
            totalPages={data?.totalPages ?? 0}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function StaffPaymentsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = usePayments(page, 20);
  const rows = data?.content ?? [];
  const search = useSearch(
    rows,
    (r) => `${r.id} ${r.parcelId} ${r.parcelTrackingRef ?? ""} ${r.status}`,
  );

  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    { key: "id", header: t("ops.columns.payment"), cell: (r) => short(r.id) },
    { key: "parcel", header: t("ops.columns.parcel"), cell: (r) => text(r.parcelTrackingRef ?? r.parcelId) },
    { key: "amount", header: t("common.amount"), cell: (r) => `${r.amount?.toLocaleString?.() ?? r.amount} ${r.currency ?? "XAF"}` },
    { key: "method", header: t("ops.columns.method"), cell: (r) => text(r.method) },
    { key: "status", header: t("common.status"), cell: (r) => statusBadge(r.status) },
    { key: "date", header: t("common.date"), cell: (r) => text(r.timestamp) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("ops.staffPayments.title")}
        description={t("ops.staffPayments.description")}
        breadcrumbs={[{ label: t("nav.staffDashboard"), to: "/staff" }, { label: t("nav.payments") }]}
      />
      {error && (
        <ErrorBanner message={error instanceof Error ? error.message : t("ops.errors.payments")} />
      )}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            rows={search.filtered}
            columns={columns}
            getRowKey={(r) => r.id}
            isLoading={isLoading}
            searchValue={search.query}
            onSearchChange={search.setQuery}
            searchPlaceholder={t("ops.staffPayments.search")}
            page={page}
            totalPages={data?.totalPages ?? 0}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function StaffSupportInboxPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = useTickets(page, 20);
  const rows = data?.content ?? [];
  const search = useSearch(
    rows,
    (r) => `${r.id} ${r.subject ?? ""} ${r.status ?? ""} ${"priority" in r ? r.priority ?? "" : ""}`,
  );

  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    { key: "id", header: t("ops.columns.ticket"), cell: (r) => short(r.id) },
    { key: "subject", header: t("ops.columns.subject"), cell: (r) => text(r.subject) },
    { key: "category", header: t("ops.columns.category"), cell: (r) => text(r.category) },
    {
      key: "priority",
      header: t("ops.columns.priority"),
      cell: (r) => statusBadge("priority" in r ? r.priority : undefined),
    },
    { key: "status", header: t("common.status"), cell: (r) => statusBadge(r.status) },
    { key: "created", header: t("ops.columns.created"), cell: (r) => text(r.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("ops.staffSupport.title")}
        description={t("ops.staffSupport.description")}
        breadcrumbs={[{ label: t("nav.staffDashboard"), to: "/staff" }, { label: t("nav.support") }]}
      />
      {error && (
        <ErrorBanner message={error instanceof Error ? error.message : t("ops.errors.tickets")} />
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5" /> {t("ops.staffSupport.tickets")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={search.filtered}
            columns={columns}
            getRowKey={(r) => r.id}
            isLoading={isLoading}
            searchValue={search.query}
            onSearchChange={search.setQuery}
            searchPlaceholder={t("ops.staffSupport.search")}
            page={page}
            totalPages={data?.totalPages ?? 0}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function StaffDeliveryMonitoringPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = useParcels(page, 50);
  const rows = (data?.content ?? []).filter((p) =>
    ["OUT_FOR_DELIVERY", "DELIVERED", "EXCEPTION", "RETURNED"].includes(p.status),
  );
  const search = useSearch(
    rows,
    (r) => `${r.id} ${r.trackingRef} ${r.status} ${r.clientName ?? ""}`,
  );

  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    { key: "tracking", header: t("ops.columns.tracking"), cell: (r) => text(r.trackingRef) },
    { key: "client", header: t("ops.columns.client"), cell: (r) => text(r.clientName ?? r.clientId) },
    { key: "route", header: t("ops.columns.route"), cell: (r) => `${text(r.senderCity)} -> ${text(r.recipientCity)}` },
    { key: "status", header: t("common.status"), cell: (r) => statusBadge(r.status) },
    { key: "expected", header: t("ops.columns.expected"), cell: (r) => text(r.expectedDeliveryAt) },
    {
      key: "actions",
      header: t("common.actions"),
      cell: (r) => (
        <Button size="sm" variant="outline" onClick={() => navigate(`/staff/parcels/${r.id}`)}>
          {t("common.view")}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("ops.staffDeliveries.title")}
        description={t("ops.staffDeliveries.description")}
        breadcrumbs={[{ label: t("nav.staffDashboard"), to: "/staff" }, { label: t("nav.deliveries") }]}
      />
      {error && (
        <ErrorBanner message={error instanceof Error ? error.message : t("ops.errors.deliveries")} />
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPinned className="h-5 w-5" /> {t("ops.staffDeliveries.watchlist")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={search.filtered}
            columns={columns}
            getRowKey={(r) => r.id}
            isLoading={isLoading}
            searchValue={search.query}
            onSearchChange={search.setQuery}
            searchPlaceholder={t("ops.staffDeliveries.search")}
            page={page}
            totalPages={data?.totalPages ?? 0}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function UssdMonitorPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["ussd-sessions"],
    queryFn: async () => {
      const response = await httpClient.get<unknown>("/ussd/sessions");
      if (Array.isArray(response)) return response as RecordRow[];
      if (response && typeof response === "object" && "content" in response) {
        return ((response as { content?: unknown }).content as RecordRow[]) ?? [];
      }
      return [];
    },
  });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [data, query]);

  const columns: DataTableColumn<RecordRow>[] = [
    { key: "session", header: t("ops.columns.session"), cell: (r) => short(r.id ?? r.sessionId) },
    { key: "phone", header: t("common.phone"), cell: (r) => text(r.phone ?? r.msisdn) },
    { key: "state", header: t("ops.columns.state"), cell: (r) => statusBadge(r.state ?? r.status) },
    { key: "menu", header: t("ops.columns.menu"), cell: (r) => text(r.menu ?? r.lastInput ?? r.currentStep) },
    { key: "updated", header: t("ops.columns.updated"), cell: (r) => text(r.updatedAt ?? r.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("ops.ussd.title")}
        description={t("ops.ussd.description")}
        breadcrumbs={[{ label: t("nav.dashboard"), to: "/admin" }, { label: t("nav.ussd") }]}
      />
      {error && (
        <ErrorBanner message={error instanceof Error ? error.message : t("ops.errors.ussd")} />
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" /> {t("ops.ussd.sessions")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rows={rows}
            columns={columns}
            getRowKey={(r) => text(r.id ?? r.sessionId ?? JSON.stringify(r))}
            isLoading={isLoading}
            searchValue={query}
            onSearchChange={setQuery}
            searchPlaceholder={t("ops.ussd.search")}
            emptyTitle={t("ops.ussd.emptyTitle")}
            emptyDescription={t("ops.ussd.emptyDescription")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function AgentCounterCreatePage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("ops.counterCreate.title")}
        description={t("ops.counterCreate.description")}
        breadcrumbs={[{ label: t("nav.dashboard"), to: "/agent" }, { label: t("nav.newParcel") }]}
      />
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
            <Search className="mt-0.5 h-4 w-4" />
            <p>
              {t("ops.counterCreate.note")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function StaffFinanceOverviewPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("ops.staffFinance.title")}
        description={t("ops.staffFinance.description")}
        breadcrumbs={[{ label: t("nav.staffDashboard"), to: "/staff" }, { label: t("nav.finance") }]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> {t("nav.payments")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/staff/payments">{t("ops.staffFinance.openPayments")}</a>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> {t("ops.staffFinance.reports")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("ops.staffFinance.note")}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function NotificationTemplatesPage() {
  return (
    <GenericEndpointPage
      title="Notification templates"
      description="Review SMS, email, push templates and delivery logs."
      endpoint="/notifications/templates"
      icon={Bell}
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Notifications" }]}
      emptyTitle="No notification templates"
      searchPlaceholder="Search templates"
    />
  );
}

export function OtpLogsPage() {
  return (
    <GenericEndpointPage
      title="OTP logs"
      description="Audit OTP delivery, expiry, and usage for authentication and delivery flows."
      endpoint="/otp/logs"
      icon={History}
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "OTP logs" }]}
      emptyTitle="No OTP logs"
      searchPlaceholder="Search phone, purpose, status"
    />
  );
}

export function FinanceExceptionsPage() {
  return (
    <GenericEndpointPage
      title="Reversals and exceptions"
      description="Finance queue for payment reversals, failed settlements, and manual review."
      endpoint="/payments/exceptions"
      icon={AlertTriangle}
      breadcrumbs={[{ label: "Finance", to: "/finance" }, { label: "Exceptions" }]}
      emptyTitle="No finance exceptions"
      searchPlaceholder="Search payment, parcel, status"
    />
  );
}

export function RiskCasesPage() {
  return (
    <GenericEndpointPage
      title="Cases and investigations"
      description="Risk investigation workspace for suspicious scans, anomalies, and route evidence."
      endpoint="/risk/cases"
      icon={ShieldAlert}
      breadcrumbs={[{ label: "Risk", to: "/risk" }, { label: "Cases" }]}
      emptyTitle="No investigation cases"
      searchPlaceholder="Search case, user, parcel"
    />
  );
}

export function AdvancedAnalyticsPage() {
  return (
    <GenericEndpointPage
      title="AI route and heatmap analytics"
      description="Route optimization results, delay heatmaps, ETA performance, and predictive signals."
      endpoint="/analytics/route-optimization"
      icon={Bot}
      breadcrumbs={[{ label: "Analytics" }]}
      emptyTitle="No AI route analytics yet"
      searchPlaceholder="Search route, agency, parcel"
    />
  );
}

export function LiveLogisticsPage() {
  return (
    <GenericEndpointPage
      title="Live logistics operations"
      description="Real-time courier, vehicle, tracker, and inherited parcel location feed."
      endpoint="/logistics/live"
      icon={Radio}
      breadcrumbs={[{ label: "Logistics" }, { label: "Live" }]}
      emptyTitle="No live logistics positions yet"
      searchPlaceholder="Search actor, parcel, tracker"
    />
  );
}

export function GpsTrackersPage() {
  return (
    <GenericEndpointPage
      title="GPS tracker management"
      description="Registered GSM/IoT trackers, assignment targets, active state, and last known position."
      endpoint="/logistics/trackers"
      icon={MapPinned}
      breadcrumbs={[{ label: "Logistics" }, { label: "GPS trackers" }]}
      emptyTitle="No GPS trackers registered"
      searchPlaceholder="Search device, IMEI, vehicle, assignee"
    />
  );
}

export function RegisterGpsTrackerPage() {
  return (
    <ActionFormPage
      title="Register GPS tracker"
      description="Register and assign a physical GPS/GSM tracker to a courier, driver, vehicle, or logistics role."
      endpoint="/logistics/trackers"
      icon={MapPinned}
      breadcrumbs={[{ label: "Logistics" }, { label: "Register tracker" }]}
      submitLabel="Register tracker"
      fields={[
        { name: "deviceId", label: "Device ID" },
        { name: "imei", label: "IMEI" },
        { name: "label", label: "Label" },
        { name: "assignedType", label: "Assigned type", placeholder: "COURIER, DRIVER, VEHICLE" },
        { name: "assignedId", label: "Assigned ID" },
        { name: "vehicleId", label: "Vehicle ID" },
      ]}
    />
  );
}

export function MobileGpsUpdatePage() {
  return (
    <ActionFormPage
      title="Mobile GPS update"
      description="Send live GPS coordinates from a logistics user and broadcast them to realtime dashboards."
      endpoint="/logistics/gps/mobile"
      icon={Smartphone}
      breadcrumbs={[{ label: "Logistics" }, { label: "Mobile GPS" }]}
      submitLabel="Send GPS update"
      fields={[
        { name: "latitude", label: "Latitude", type: "number" },
        { name: "longitude", label: "Longitude", type: "number" },
        { name: "speed", label: "Speed", type: "number" },
        { name: "heading", label: "Heading", type: "number" },
      ]}
    />
  );
}

export function IotGpsIngestionPage() {
  return (
    <ActionFormPage
      title="IoT GPS ingestion"
      description="Receive GPS updates from physical trackers using device ID or IMEI."
      endpoint="/logistics/gps/iot"
      icon={Radio}
      breadcrumbs={[{ label: "Logistics" }, { label: "IoT GPS" }]}
      submitLabel="Send tracker update"
      fields={[
        { name: "deviceId", label: "Device ID" },
        { name: "imei", label: "IMEI" },
        { name: "latitude", label: "Latitude", type: "number" },
        { name: "longitude", label: "Longitude", type: "number" },
        { name: "speed", label: "Speed", type: "number" },
        { name: "heading", label: "Heading", type: "number" },
      ]}
    />
  );
}

export function RouteOptimizationPage() {
  return (
    <GenericEndpointPage
      title="AI route optimization"
      description="Recommended stop sequence, distance, duration, and route efficiency score."
      endpoint="/logistics/route-optimization"
      icon={Route}
      breadcrumbs={[{ label: "Logistics" }, { label: "Route optimization" }]}
      emptyTitle="No route recommendations yet"
      searchPlaceholder="Search route, parcel, stop"
    />
  );
}

export function DistancePricingPage() {
  return (
    <ActionFormPage
      title="Distance-based pricing"
      description="Calculate pickup pricing using distance, weight, complexity, and the 500 FCFA minimum rule."
      endpoint="/logistics/pricing/distance-quote"
      icon={CreditCard}
      breadcrumbs={[{ label: "Logistics" }, { label: "Distance pricing" }]}
      submitLabel="Calculate price"
      fields={[
        { name: "distanceKm", label: "Distance in km", type: "number" },
        { name: "weightKg", label: "Weight in kg", type: "number" },
        { name: "complexity", label: "Complexity", type: "number", placeholder: "1" },
      ]}
    />
  );
}

export function PickupRecommendationPage() {
  return (
    <GenericEndpointPage
      title="Smart pickup recommendations"
      description="Nearest available logistics actors scored by distance, workload, route efficiency, and capacity criteria."
      endpoint="/logistics/pickup-assignment/recommendations?latitude=3.848&longitude=11.502"
      icon={Truck}
      breadcrumbs={[{ label: "Logistics" }, { label: "Pickup assignment" }]}
      emptyTitle="No pickup assignment recommendations yet"
      searchPlaceholder="Search actor or criteria"
    />
  );
}

export function AiAutomationDiscoveryPage() {
  return (
    <GenericEndpointPage
      title="AI automation discovery"
      description="Codebase-derived automation opportunities inferred from controllers, services, models, events, and business workflows."
      endpoint="/ai/runtime/discovery/automation-opportunities"
      icon={BrainCircuit}
      breadcrumbs={[{ label: "AI" }, { label: "Discovery" }]}
      emptyTitle="No automation opportunities discovered"
      searchPlaceholder="Search opportunity, tool, event"
    />
  );
}

export function RbacPermissionsPage() {
  return (
    <GenericEndpointPage
      title="Dynamic RBAC permissions"
      description="Database-backed permissions for AI tools and enterprise authorization policies."
      endpoint="/rbac/roles/ADMIN/permissions"
      icon={ShieldCheck}
      breadcrumbs={[{ label: "Security" }, { label: "RBAC" }]}
      emptyTitle="No permissions configured"
      searchPlaceholder="Search permission"
    />
  );
}

export function GrantRbacPermissionPage() {
  return (
    <ActionFormPage
      title="Grant RBAC permission"
      description="Grant a granular permission to a role. Permissions are evaluated before AI tools can execute."
      endpoint="/rbac/roles/ADMIN/permissions"
      icon={ShieldCheck}
      breadcrumbs={[{ label: "Security" }, { label: "Grant permission" }]}
      submitLabel="Grant permission"
      fields={[
        { name: "permission", label: "Permission", placeholder: "ai:discover" },
        { name: "description", label: "Description" },
      ]}
    />
  );
}

export function HubBulkScanPage() {
  return (
    <ActionFormPage
      title="Hub bulk scan"
      description="Create bag or bulk scan events for sorting and hub operations."
      endpoint="/scan-events/bulk"
      icon={QrCode}
      breadcrumbs={[{ label: "Staff", to: "/staff" }, { label: "Bulk scan" }]}
      submitLabel="Submit bulk scan"
      fields={[
        { name: "bagId", label: "Bag ID", placeholder: "BAG-2026-0001" },
        { name: "eventType", label: "Event type", placeholder: "ARRIVED_HUB" },
        { name: "agencyId", label: "Agency / hub ID" },
        {
          name: "trackingRefs",
          label: "Tracking references",
          type: "textarea",
          placeholder: "One tracking reference per line",
        },
      ]}
    />
  );
}

export function FailedDeliveryReportPage() {
  return (
    <ActionFormPage
      title="Failed delivery report"
      description="Report a failed delivery attempt with reason, photo URL, GPS context, and notes."
      endpoint="/delivery/failed"
      icon={Upload}
      breadcrumbs={[{ label: "Courier", to: "/courier" }, { label: "Failed delivery" }]}
      submitLabel="Submit report"
      fields={[
        { name: "parcelId", label: "Parcel ID" },
        { name: "reason", label: "Reason", placeholder: "CLIENT_ABSENT" },
        { name: "photoUrl", label: "Photo URL" },
        { name: "latitude", label: "Latitude", type: "number" },
        { name: "longitude", label: "Longitude", type: "number" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}

export function PublicQrVerificationPage() {
  return (
    <ActionFormPage
      title="QR verification"
      description="Public verification surface for parcel QR codes and temporary pickup QR tokens."
      endpoint="/qr/verify"
      icon={QrCode}
      breadcrumbs={[{ label: "Public" }, { label: "QR verification" }]}
      submitLabel="Verify QR"
      fields={[
        { name: "qrContent", label: "QR content", type: "textarea" },
        { name: "latitude", label: "Latitude", type: "number" },
        { name: "longitude", label: "Longitude", type: "number" },
      ]}
    />
  );
}

export function ProfileSettingsPage() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    fullName: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    preferredLanguage: "",
    notificationChannel: "",
    photoUrl: "",
  });
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const body = Object.fromEntries(
        Object.entries(form).filter(([, value]) => value.trim() !== ""),
      );
      const res = await httpClient.patch("/auth/me/profile", body);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Profile update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile and settings"
        description="Manage your identity, visible profile photo, language, notifications, and account security."
        breadcrumbs={[{ label: "Settings" }]}
      />
      {error && <ErrorBanner message={error} />}
      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card className="sc-animate-fade-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" /> Visible profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border bg-muted text-4xl font-bold text-muted-foreground">
              {preview || form.photoUrl ? (
                <img
                  src={preview || form.photoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                (form.fullName || user?.name || "?").slice(0, 1).toUpperCase()
              )}
            </div>
            <label className="block">
              <span className="text-sm font-medium">Upload photo preview</span>
              <input
                className="mt-2 block w-full text-sm"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setPreview(URL.createObjectURL(file));
                }}
              />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              <span>Photo URL</span>
              <input
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.photoUrl}
                placeholder="https://..."
                onChange={(event) =>
                  setForm((current) => ({ ...current, photoUrl: event.target.value }))
                }
              />
            </label>
            <p className="text-xs text-muted-foreground">
              The preview helps you choose the image locally. Save a hosted photo URL to make it visible to clients, agents, couriers, and staff.
            </p>
          </CardContent>
        </Card>

        <Card className="sc-animate-fade-up sc-delay-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" /> Account details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["fullName", "Full name"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["preferredLanguage", "Preferred language"],
                ["notificationChannel", "Notification channel"],
              ].map(([name, label]) => (
                <label key={name} className="space-y-2 text-sm font-medium">
                  <span>{label}</span>
                  <input
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={form[name as keyof typeof form]}
                    placeholder={name === "preferredLanguage" ? "fr or en" : undefined}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [name]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
            </div>
            <Button className="sc-interactive" onClick={save} disabled={busy}>
              {busy ? "Saving..." : "Save settings"}
            </Button>
            {result !== null && (
              <pre className="max-h-72 overflow-auto rounded-md bg-muted p-4 text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
