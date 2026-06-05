import { useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";

const WARNING_BEFORE_MS = 15 * 60 * 1000; // Show warning 15 min before expiry
const CHECK_INTERVAL_MS = 60 * 1000;       // Check every minute

/**
 * SessionTimeoutWarning
 *
 * Watches the JWT expiry stored in authStore and:
 * 1. Shows a toast-style warning banner 15 minutes before expiry.
 * 2. Automatically logs the user out when the token expires.
 *
 * Place once inside the authenticated portion of the app tree.
 */
export function SessionTimeoutWarning() {
  const { isAuthenticated, tokenExpiresAt, logout, refreshToken } = useAuthStore();

  const checkSession = useCallback(async () => {
    if (!isAuthenticated || !tokenExpiresAt) return;

    const now = Date.now();
    const msLeft = tokenExpiresAt - now;

    if (msLeft <= 0) {
      // Token already expired — log out silently
      logout();
      return;
    }

    if (msLeft <= WARNING_BEFORE_MS) {
      // Try to silently refresh first
      try {
        await refreshToken();
        // Success — no warning needed
      } catch {
        // Refresh failed — show warning or log out
        if (msLeft <= 60_000) {
          // Less than 1 minute left and refresh failed → auto logout
          logout();
        } else {
          // Warn user with a non-blocking notification
          showSessionWarning(Math.floor(msLeft / 60_000));
        }
      }
    }
  }, [isAuthenticated, tokenExpiresAt, logout, refreshToken]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(checkSession, CHECK_INTERVAL_MS);
    // Run immediately on mount too
    checkSession();

    return () => clearInterval(interval);
  }, [isAuthenticated, checkSession]);

  // This component renders nothing — it's a background monitor
  return null;
}

/** Show a subtle warning notification using the browser Notification API or console */
function showSessionWarning(minutesLeft: number) {
  const message = `Your session will expire in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}. Please save your work.`;

  // Try browser notification (requires permission)
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("SmartCAMPOST — Session Expiring", {
      body: message,
      icon: "/favicon.ico",
    });
  } else {
    // Fallback: inject a temporary DOM banner
    injectWarningBanner(message);
  }
}

function injectWarningBanner(message: string) {
  const existingBanner = document.getElementById("sc-session-warning");
  if (existingBanner) return; // Don't show twice

  const banner = document.createElement("div");
  banner.id = "sc-session-warning";
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: linear-gradient(90deg, #b45309, #d97706);
    color: #fff;
    text-align: center;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  `;
  banner.innerHTML = `
    ⚠️ <span>${message}</span>
    <button
      onclick="document.getElementById('sc-session-warning').remove()"
      style="background:rgba(255,255,255,0.2);border:none;color:#fff;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:12px;"
    >Dismiss</button>
  `;

  document.body.prepend(banner);

  // Auto-remove after 60 seconds
  setTimeout(() => banner.remove(), 60_000);
}
