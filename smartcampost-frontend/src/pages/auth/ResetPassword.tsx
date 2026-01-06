import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import {
  confirmPasswordReset,
  requestPasswordReset,
} from "../../services/authService";
import axios from "axios";

export default function ResetPassword() {
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRequest = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await requestPasswordReset({ phone });
      setStep(2);
      setSuccess("OTP sent to your phone.");
    } catch (err: unknown) {
      let message = "Failed to request password reset.";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (typeof data === "string") message = data;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await confirmPasswordReset({ phone, otp, newPassword: password });
      setSuccess("Password updated. You can now login.");
    } catch (err: unknown) {
      let message = "Failed to reset password.";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (typeof data === "string") message = data;
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
          Reset Password
        </h1>
        <p className="mt-1 text-xs text-slate-400 text-center">
          Use your phone number to receive a reset code.
        </p>

        {error && (
          <p className="mt-4 text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-md px-2 py-1">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-4 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-900 rounded-md px-2 py-1">
            {success}
          </p>
        )}

        {step === 1 ? (
          <form className="mt-5 space-y-4" onSubmit={handleRequest}>
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-medium text-slate-300"
              >
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
                placeholder="+237 6xx xxx xxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold py-2 mt-2 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Requesting…" : "Send reset code"}
            </button>
          </form>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={handleConfirm}>
            <div>
              <label
                htmlFor="otp"
                className="block text-xs font-medium text-slate-300"
              >
                OTP code
              </label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-300"
              >
                New password
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold py-2 mt-2 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Updating…" : "Confirm reset"}
            </button>
          </form>
        )}

        <p className="mt-4 text-[11px] text-slate-500 text-center">
          <Link
            to="/auth/login"
            className="text-amber-400 hover:text-amber-300 font-medium"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}


