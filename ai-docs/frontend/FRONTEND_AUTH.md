# SmartCAMPOST — Frontend Authentication

## Authentication Methods

The frontend supports three login paths, all producing a JWT stored in Zustand/localStorage.

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Phone/Email +  │   │  OTP (phone)    │   │  Google OAuth2  │
│    Password     │   │                 │   │                 │
│   /auth/login   │   │ /auth/login-otp │   │  /auth/login    │
└────────┬────────┘   └───────┬─────────┘   └───────┬─────────┘
         │                   │                       │
         └─────────────────────────────────────────┘
                             │
                   POST /api/auth/...
                             │
                   ┌─────────▼─────────┐
                   │  { user, token }  │
                   └─────────┬─────────┘
                             │
                   authStore.setAuth(user, token)
                             │
                   navigate(routeByRole(user.role))
```

---

## Auth Store — Zustand (`authStore.ts`)

```typescript
interface AuthState {
  user: User | null         // Full user object
  token: string | null      // JWT string
  isAuthenticated: boolean  // Derived from token != null
  isLoading: boolean

  login(phone: string, password: string): Promise<void>
  loginWithGoogle(idToken: string): Promise<{ user, token }>
  setAuth(user: User, token: string): void
  logout(): void
}
```

**Persistence:** Zustand persist middleware → `localStorage` key: `auth-storage`

**Session restore:** On app load, Zustand hydrates from localStorage automatically. If a valid token exists, the user is considered authenticated without a re-login.

---

## Phone/Email + Password Login (`Login.tsx`)

```typescript
// lib/api.ts
async function login({ phoneOrEmail, password }) {
  const res = await axios.post("/auth/login", { phoneOrEmail, password });
  return res.data; // { user, token }
}
```

**Validation (React Hook Form):**
- `phoneOrEmail`: required
- `password`: required

**Error handling:**
- Maps backend error codes to i18n keys (`INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `ACCOUNT_FROZEN`)
- Displays translated error message in form

**On success:**
1. `authStore.setAuth(user, token)`
2. `navigate(routeByRole(user.role))`

---

## OTP Login (`LoginOtp.tsx`)

**Two-step flow:**

Step 1 — Request OTP:
```typescript
POST /api/auth/login/otp/request  →  { phone }
```

Step 2 — Confirm OTP:
```typescript
POST /api/auth/login/otp/confirm  →  { phone, otp }
// Returns: AuthResponse → same setAuth + navigate
```

---

## Registration (`Register.tsx`)

**Two-step flow:**

Step 1 — Send OTP to phone:
```typescript
POST /api/auth/send-otp  →  { phone, purpose: "REGISTER" }
```

Step 2 — Submit form with OTP:
```typescript
POST /api/auth/register  →  {
  fullName, phone, email, password,
  otp,  // from SMS
  preferredLanguage
}
// Returns: AuthResponse → auto-login
```

**Validation:**
- `fullName`: required
- `phone`: required, regex `/^\+?[0-9]{8,15}$/`
- `password`: min 8 chars, must have uppercase + lowercase + digit
- `confirmPassword`: must match `password`
- `otp`: required after send

**WebOTP API:** Android Chrome auto-fills OTP from SMS automatically.

---

## Password Reset (`ResetPassword.tsx`)

**Three-step flow:**
1. Enter phone → `POST /api/auth/password/reset/request`
2. Enter OTP from SMS
3. Enter + confirm new password → `POST /api/auth/password/reset/confirm`
4. Redirect to `/auth/login` on success

---

## Google OAuth2 Login (`Login.tsx`, `Register.tsx`)

**Library:** `@react-oauth/google` 0.13.4

**Setup in `main.tsx`:**
```tsx
<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
  <App />
</GoogleOAuthProvider>
```

**Usage:**
```tsx
<GoogleLogin
  onSuccess={(credentialResponse) => {
    loginWithGoogle(credentialResponse.credential)
      .then(res => navigate(routeByRole(res.user.role)))
      .catch(err => toast.error(err.message));
  }}
  onError={() => toast.error("Google sign-in failed")}
  theme="outline"
  size="large"
/>
```

**Backend call:**
```typescript
POST /api/auth/google  →  { idToken: "<Google credential>" }
// Returns: { user, token }
```

**Behavior:**
- If email/googleId already exists → logs in
- If new user → creates CLIENT account automatically
- No separate "link Google account" flow exists

---

## Token Storage & Injection

**Storage:** localStorage via Zustand persist
**Key:** `auth-storage`
**Format:**
```json
{
  "state": {
    "user": { "id": "...", "role": "CLIENT", ... },
    "token": "eyJhbGci..."
  }
}
```

**Auto-injection in Axios (`axiosClient.ts`):**
```typescript
axiosInstance.interceptors.request.use((config) => {
  const stored = localStorage.getItem("auth-storage");
  const parsed = JSON.parse(stored);
  const token = parsed?.state?.token || parsed?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**No refresh token mechanism:** When JWT expires (8h default), user is silently logged out on next 401 response. There is no proactive token refresh.

---

## Protected Route Guard

```typescript
// components/auth/ProtectedRoute.tsx
function ProtectedWrapper({ allowedRoles, children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

**Behavior:**
- Unauthenticated → redirect to `/auth/login`
- Wrong role → redirect to `/` (landing)
- Correct role → render children

---

## Logout

```typescript
authStore.logout()
// Clears: user, token, isAuthenticated
// Clears localStorage key 'auth-storage'
// Router redirects to '/' (catch-all)
```

---

## User Type Definition

```typescript
interface User {
  id: string
  phone: string
  email?: string
  name: string
  role: "CLIENT" | "AGENT" | "COURIER" | "STAFF" | "ADMIN" | "FINANCE" | "RISK"
  authProvider?: "LOCAL" | "GOOGLE"
  entityId?: string
}
```

---

## Known Auth Issues

1. **No token expiry handling:** Expired JWT causes 401 with no user feedback. User must manually log out and back in.
2. **localStorage storage:** JWT is accessible to JavaScript. Use `httpOnly` cookies for production hardening.
3. **No logout on 401:** Axios response interceptor does not catch 401 and redirect to login — this must be handled per-component or added to the global interceptor.
4. **Google OAuth client ID hardcoded in source:** `428837425425-hvbdljimv02i2kapehk51haap4160v68.apps.googleusercontent.com` appears as default value. Must be overridden in production `.env`.
5. **Double localStorage parse risk:** The interceptor does `JSON.parse(JSON.parse(stored))` style chained access; if the storage shape changes, token injection silently fails.
