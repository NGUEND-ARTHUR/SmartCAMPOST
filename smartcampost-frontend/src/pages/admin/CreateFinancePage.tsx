import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { financeService } from "@/services/financeService";

interface FinanceForm {
  name: string;
  description: string;
  initialBalance: number | "";
}
export default function CreateFinancePage() {
  const { t } = useTranslation();
  const [form, setForm] = useState<FinanceForm>({
    name: "",
    description: "",
    initialBalance: "",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (
      !form.name.trim() ||
      !form.description.trim() ||
      form.initialBalance === "" ||
      isNaN(Number(form.initialBalance))
    ) {
      setError(t("createFinancePage.subtitle"));
      return;
    }

    try {
      setIsLoading(true);
      await financeService.createFinance({
        name: form.name,
        description: form.description,
        initialBalance: Number(form.initialBalance),
      });
      setSuccess(true);
      setForm({ name: "", description: "", initialBalance: "" });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("createFinancePage.cancel"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">{t("createFinancePage.title")}</h1>
      {success && (
        <div
          className="mb-4 p-2 bg-green-100 text-green-800 rounded"
          role="status"
          aria-live="polite"
        >
          {t("createFinancePage.submit")}
        </div>
      )}
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-800 rounded" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label className="block mb-1 font-medium" htmlFor="finance-name">
            {t("createFinancePage.transactionType")}
          </label>
          <input
            id="finance-name"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
            placeholder={t("createFinancePage.selectType")}
            title="Finance name"
            aria-required="true"
            aria-invalid="false"
          />
        </div>
        <div className="mb-4">
          <label
            className="block mb-1 font-medium"
            htmlFor="finance-description"
          >
            {t("createFinancePage.description")}
          </label>
          <textarea
            id="finance-description"
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
            placeholder={t("createFinancePage.descriptionPlaceholder")}
            title="Finance description"
            aria-required="true"
            aria-invalid="false"
          />
        </div>
        <div className="mb-6">
          <label
            className="block mb-1 font-medium"
            htmlFor="finance-initial-balance"
          >
            {t("createFinancePage.amount")}
          </label>
          <input
            id="finance-initial-balance"
            type="number"
            name="initialBalance"
            value={form.initialBalance}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
            placeholder={t("createFinancePage.amountPlaceholder")}
            title="Initial balance"
            min="0"
            step="0.01"
            aria-required="true"
            aria-invalid="false"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t("common.loading") : t("createFinancePage.submit")}
        </button>
      </form>
    </div>
  );
}
