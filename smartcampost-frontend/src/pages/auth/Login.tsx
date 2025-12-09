import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as loginApi } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import axios from "axios"; // ✅ added

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginApi({ username, password });

      // Save in context/localStorage
      login(res.user, res.accessToken);

      // Redirect to dashboard
      navigate("/", { replace: true });
    } catch (err: unknown) {            // ✅ no more `any`
      console.error(err);

      let message = "Login failed. Please check your credentials.";

      if (axios.isAxiosError(err)) {    // ✅ safely handle Axios error
        const serverMessage =
          (err.response?.data as { message?: string } | undefined)?.message;
        message = serverMessage ?? err.message ?? message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 text-center">
          Smart<span className="text-amber-500">CAMPOST</span> Login
        </h1>
        <p className="mt-1 text-xs text-slate-500 text-center">
          Backoffice access for CAMPOST staff and admins
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-medium text-slate-600"
            >
              Email or username
            </label>
            <input
              id="username"
              type="text"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500/40"
              placeholder="admin@smartcampost.cm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-slate-600"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500/40"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 text-white text-sm font-semibold py-2 mt-2 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-[11px] text-slate-500 text-center">
          We’ll later connect this to role-based access (ADMIN, AGENT, CLIENT).
        </p>
      </div>
    </div>
  );
}
