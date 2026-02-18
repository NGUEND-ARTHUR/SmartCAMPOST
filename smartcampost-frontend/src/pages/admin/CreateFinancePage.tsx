import React, { useState } from "react";
import { financeService } from "@/services/financeService";

interface FinanceForm {
  name: string;
  description: string;
  initialBalance: number | "";
}
export default function CreateFinancePage() {
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
      setError("All fields are required and initial balance must be a number.");
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
      setError(err instanceof Error ? err.message : "Failed to create finance record");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Create Finance</h1>
      {success && (
        <div
          className="mb-4 p-2 bg-green-100 text-green-800 rounded"
          role="status"
          aria-live="polite"
        >
          Finance created successfully!
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
            Name
          </label>
          <input
            id="finance-name"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
            placeholder="Enter name"
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
            Description
          </label>
          <textarea
            id="finance-description"
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
            placeholder="Enter description"
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
            Initial Balance
          </label>
          <input
            id="finance-initial-balance"
            type="number"
            name="initialBalance"
            value={form.initialBalance}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
            placeholder="Enter initial balance"
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
          {isLoading ? "Creating..." : "Create Finance"}
        </button>
      </form>
    </div>
  );
}
