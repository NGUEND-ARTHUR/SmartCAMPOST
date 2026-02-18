import React, { useState, ChangeEvent, FormEvent } from "react";
import { riskService } from "@/services/riskService";

export default function CreateRiskPage() {
  const [form, setForm] = useState({
    type: "",
    severity: "",
    description: "",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target as HTMLInputElement & HTMLTextAreaElement;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !form.type.trim() ||
      !form.severity.trim() ||
      !form.description.trim()
    ) {
      setError("All fields are required");
      return;
    }

    try {
      setIsLoading(true);
      await riskService.createRisk({
        type: form.type,
        severity: form.severity,
        description: form.description,
      });
      setSuccess(true);
      setForm({ type: "", severity: "", description: "" });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create risk alert",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Create Risk Alert</h1>
      {success && (
        <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
          Risk alert created successfully!
        </div>
      )}
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-800 rounded">{error}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="risk-type" className="block mb-1 font-medium">
            Type
          </label>
          <input
            id="risk-type"
            type="text"
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. Theft, Delay, Damage"
            title="Risk type"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="risk-severity" className="block mb-1 font-medium">
            Severity
          </label>
          <input
            id="risk-severity"
            type="text"
            name="severity"
            value={form.severity}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. Low, Medium, High"
            title="Risk severity"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="risk-description" className="block mb-1 font-medium">
            Description
          </label>
          <textarea
            id="risk-description"
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Describe the risk in detail"
            title="Risk description"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating..." : "Create Risk Alert"}
        </button>
      </form>
    </div>
  );
}
