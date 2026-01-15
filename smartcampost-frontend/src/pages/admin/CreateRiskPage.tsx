import { useState } from 'react';

export default function CreateRiskPage() {
  const [form, setForm] = useState({
    type: '',
    severity: '',
    description: ''
  });
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with backend API to create risk alert
    setSuccess(true);
    setForm({ type: '', severity: '', description: '' });
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Create Risk Alert</h1>
      {success && <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">Risk alert created successfully!</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Type</label>
          <input
            type="text"
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Severity</label>
          <input
            type="text"
            name="severity"
            value={form.severity}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-semibold">
          Create Risk Alert
        </button>
      </form>
    </div>
  );
}
