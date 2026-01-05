import { useTranslation } from "react-i18next";
import { setLanguage } from "../../i18n";

export default function LanguageSwitch() {
  const { i18n, t } = useTranslation();

  const current = (i18n.language === "fr" ? "fr" : "en") as "en" | "fr";

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400">{t("common.language")}</span>

      <select
        value={current}
        onChange={(e) => setLanguage(e.target.value as "en" | "fr")}
        className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 outline-none"
      >
        <option value="en">{t("common.english")}</option>
        <option value="fr">{t("common.french")}</option>
      </select>
    </div>
  );
}
