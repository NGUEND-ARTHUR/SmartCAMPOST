import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as loginApi } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { getHomeByRole } from "../../router/PrivateRoute";
import axios from "axios";

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

      // Save
      login(res.user, res.accessToken);

      // Redirect by role
      navigate(getHomeByRole(res.user.role), { replace: true });
    } catch (err: unknown) {
      console.error(err);

      let message = "Login failed. Please check your credentials.";

      if (axios.isAxiosError(err)) {
        const data = err.response?.data;

        if (typeof data === "string") {
          message = data;
        } else if (data && typeof data === "object") {
          const maybeMessage =
            (data as { message?: string; error?: string }).message ||
            (data as { message?: string; error?: string }).error;

          if (maybeMessage) message = maybeMessage;
        } else if (err.message) {
          message = err.message;
        }
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 p-6 shadow-xl border border-slate-800">
        <h1 className="text-xl font-bold text-slate-50 text-center">
          Smart<span className="text-amber-400">CAMPOST</span> Login
        </h1>
        <p className="mt-1 text-xs text-slate-400 text-center">
          Backoffice access for CAMPOST staff and admins
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-slate-300">
              Email or username
            </label>
            <input
              id="username"
              type="text"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
              placeholder="admin@smartcampost.cm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-md px-2 py-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold py-2 mt-2 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-[11px] text-slate-500 text-center">
          Client portal is handled separately via role-based routing.
        </p>
      </div>
    </div>
  );
}
