import { matchPath, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

const pagesWithLocalBack = [
  "/client/parcels/new",
  "/client/parcels/:id",
  "/client/parcels/:id/qr",
  "/client/parcels/:parcelId/print-label",
  "/agent/parcels/new",
  "/agent/parcels/:id",
  "/staff/parcels/:id",
  "/staff/parcels/:id/qr",
  "/admin/parcels/:id",
  "/admin/parcels/:id/qr",
  "/courier/pickups/:id",
  "/courier/deliveries/:id",
  "/courier/deliveries/:id/confirm",
  "/admin/finance/create",
  "/admin/risk/create",
  "/admin/risk/create-user",
];

export function GlobalBackTrail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const rolePage = /^\/(admin|staff|client|agent|courier|finance|risk)(\/|$)/.test(
    location.pathname,
  );

  if (
    location.pathname === "/" ||
    pagesWithLocalBack.some((pattern) =>
      matchPath({ path: pattern, end: true }, location.pathname),
    )
  ) {
    return null;
  }

  return (
    <button
      type="button"
      className={`fixed left-3 z-40 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/85 text-foreground opacity-80 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-accent hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${rolePage ? "top-[4.5rem] lg:left-[17rem] lg:top-4" : "top-4"}`}
      aria-label={t("common.back", "Back")}
      title={t("common.back", "Back")}
      onClick={() => {
        if (window.history.length > 1) navigate(-1);
        else navigate("/");
      }}
    >
      <ArrowUpLeft className="h-5 w-5" />
    </button>
  );
}
