import { useLocation, useNavigate } from "react-router-dom";
import { ArrowUpLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export function GlobalBackTrail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  if (location.pathname === "/") return null;

  return (
    <button
      type="button"
      className="fixed left-4 top-20 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:left-72"
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
