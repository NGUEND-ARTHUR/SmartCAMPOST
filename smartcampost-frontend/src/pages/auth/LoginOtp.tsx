import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  confirmLoginOtp,
  requestLoginOtp,
} from "../../services/auth/authService";
import { useAuth } from "../../context/AuthContext";
import { getHomeByRole } from "../../router/PrivateRoute";
import axios from "axios";

export default function LoginOtp() {
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestLoginOtp({ phone });
      setStep(2);
    } catch (err: unknown) {
      let message = "Failed to send OTP. Please try again.";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (typeof data === "string") message = data;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await confirmLoginOtp({ phone, otp });
      login(res.user, res.accessToken);
      navigate(getHomeByRole(res.user.role), { replace: true });
    } catch (err: unknown) {
      let message = "Invalid or expired OTP.";
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
          Smart<span className="text-amber-400">CAMPOST</span> OTP Login
        </h1>
        <p className="mt-1 text-xs text-slate-400 text-center">
          Sign in with a one-time code sent to your phone.
        </p>

        {error && (
          <p className="mt-4 text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-md px-2 py-1">
            {error}
          </p>
        )}

        {step === 1 ? (
          <form className="mt-5 space-y-4" onSubmit={handleRequestOtp}>
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
              {loading ? "Sending OTP…" : "Send OTP"}
            </button>
          </form>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={handleConfirmOtp}>
            <div>
              <label
                htmlFor="otp"
                className="block text-xs font-medium text-slate-300"
              >
                Enter OTP
              </label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                className="mt-1 tracking-[0.4em] text-center w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-amber-500/60"
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold py-2 mt-2 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Verifying…" : "Confirm & Sign in"}
            </button>
          </form>
        )}

        <p className="mt-4 text-[11px] text-slate-500 text-center">
          <Link
            to="/auth/login"
            className="text-amber-400 hover:text-amber-300 font-medium"
          >
            Back to password login
          </Link>
        </p>
      </div>
    </div>
  );
}


