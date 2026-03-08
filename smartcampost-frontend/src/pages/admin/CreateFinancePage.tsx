import { useTranslation } from "react-i18next";

export default function CreateFinancePage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">
        {t("createFinancePage.title")}
      </h1>
      <div className="p-4 bg-yellow-100 text-yellow-800 rounded" role="status">
        {t("common.featureUnavailable", "This feature is not yet available.")}
      </div>
    </div>
  );
}
