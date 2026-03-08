# SmartCAMPOST Frontend — Comprehensive Audit Report

**Date:** 2025-07-16  
**Scope:** `smartcampost-frontend/src/` — all pages, services, hooks, store, routing  
**Stack:** React 18 + TypeScript + Vite, React Router v6, TanStack React Query, Zustand, i18next, Tailwind CSS + shadcn/ui, MapLibre  

---

## Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Broken Flows | 2 | 2 | 0 | 0 | **4** |
| Dead Routes / Unreachable Pages | 0 | 0 | 6 | 0 | **6** |
| Missing i18n (fully English pages) | 0 | 2 | 0 | 0 | **2** |
| i18n Gaps (partial hardcoded strings) | 0 | 0 | 7 | 0 | **7** |
| Incomplete UI / Stub Pages | 0 | 1 | 2 | 0 | **3** |
| State Management Issues | 0 | 0 | 2 | 1 | **3** |
| Missing Error Handling | 0 | 0 | 1 | 2 | **3** |
| Security / Code Quality | 0 | 0 | 0 | 3 | **3** |
| **Totals** | **2** | **5** | **18** | **6** | **31** |

---

## 1 — BROKEN FLOWS

### #1 · CRITICAL — AgentDashboard navigates to non-existent route
- **File:** `src/pages/dashboard/AgentDashboard.tsx` line 178  
- **Category:** BROKEN_FLOW  
- **Description:** Clicking a task row calls `navigate(\`/agent/parcels/${task.parcelId}\`)`, but there is no `/agent/parcels/:id` route in `App.tsx`. The agent layout only defines `index`, `map`, `scan`, `notifications`. The user gets a blank page or 404.  
- **Fix:** Add `<Route path="parcels/:id" element={<ParcelDetail />} />` under the `/agent` layout in `App.tsx`, or change the navigation target to `/staff/parcels/${task.parcelId}` if agents should share the staff parcel detail view.

### #2 · CRITICAL — StaffDashboard navigates to non-existent route
- **File:** `src/pages/dashboard/StaffDashboard.tsx` line 220  
- **Category:** BROKEN_FLOW  
- **Description:** The "View" button calls `navigate(\`/admin/staff/${s.id}\`)`, but no `/admin/staff/:id` detail route exists. Result: blank page.  
- **Fix:** Either create an `AdminStaffDetail` page and register the route, or change to a dialog-based detail view (similar to `ClientManagement`).

### #3 · HIGH — ParcelManagement flag button is a no-op
- **File:** `src/pages/parcels/ParcelManagement.tsx` lines 117-119  
- **Category:** BROKEN_FLOW  
- **Description:** `handleFlag()` only shows a success toast but never calls any API. The parcel is not actually flagged server-side.  
- **Fix:** Add an API call such as `parcelService.flagParcel(parcelId)` before the toast, or call `useUpdateParcelStatus` with a `FLAGGED` status.

### #4 · HIGH — StaffDashboard export button has no handler
- **File:** `src/pages/dashboard/StaffDashboard.tsx` line 148  
- **Category:** BROKEN_FLOW  
- **Description:** `<Button variant="outline">{t("common.export")}</Button>` renders a clickable button but has no `onClick` handler. Nothing happens when clicked.  
- **Fix:** Add an `onClick` handler that triggers CSV/JSON/PDF export (see `ParcelList.tsx` for the export pattern used elsewhere).

---

## 2 — DEAD ROUTES / UNREACHABLE PAGES

### #5 · MEDIUM — Addresses.tsx exists but is not routed
- **File:** `src/pages/common/Addresses.tsx`  
- **Category:** DEAD_CODE  
- **Description:** Fully implemented address management page (CRUD + map picker) but is not referenced in any route in `App.tsx`. Users cannot reach it.  
- **Fix:** Add route under `/client` layout: `<Route path="addresses" element={<Addresses />} />` and add a nav link.

### #6 · MEDIUM — InvoicesPage.tsx exists but is not routed
- **File:** `src/pages/common/InvoicesPage.tsx`  
- **Category:** DEAD_CODE  
- **Description:** Invoice list page with PDF download links. Never mounted in any route.  
- **Fix:** Add route under `/client` layout: `<Route path="invoices" element={<InvoicesPage />} />`.

### #7 · MEDIUM — ScanPage.tsx exists but is not routed
- **File:** `src/pages/common/ScanPage.tsx`  
- **Category:** DEAD_CODE  
- **Description:** Legacy scan page (simpler than `ScanConsole`). Not used in any route. `ScanConsole` is used instead for `/agent/scan`, `/courier/scan`, etc.  
- **Fix:** Either wire it as an alternative simplified scan route, or delete the file if `ScanConsole` is the canonical scan UI.

### #8 · MEDIUM — ParcelTrackingPage.tsx exists but is not routed
- **File:** `src/pages/parcels/ParcelTrackingPage.tsx`  
- **Category:** DEAD_CODE  
- **Description:** A parcel tracking page exists in the parcels directory but is not imported or routed anywhere. `TrackingPage.tsx` (from common/) is used instead on public + staff + admin routes.  
- **Fix:** Delete or merge into `TrackingPage.tsx` if it contains unique functionality.

### #9 · MEDIUM — PickupQrPage.tsx exists but is not routed
- **File:** `src/pages/pickups/PickupQrPage.tsx`  
- **Category:** DEAD_CODE  
- **Description:** Pickup QR display page exists but has no route definition.  
- **Fix:** Add a route like `/client/pickups/:id/qr` or `/courier/pickups/:id/qr`, or delete if pickup QR is handled inline elsewhere.

### #10 · MEDIUM — MoMoPaymentPage.tsx exists but is not routed
- **File:** `src/pages/payments/MoMoPaymentPage.tsx`  
- **Category:** DEAD_CODE  
- **Description:** MoMo payment initiation page with full API integration (`paymentService.init`) is implemented but never mounted in any route layout. Only `MtnTest.tsx` (a raw debug page) is routed at `/mtn-test`.  
- **Fix:** Add a route under `/client` layout for actual payment: `<Route path="pay/:parcelId" element={<MoMoPaymentPage />} />`, or merge its logic into the parcel detail / checkout flow.

---

## 3 — MISSING i18n (FULLY ENGLISH PAGES)

### #11 · HIGH — MoMoPaymentPage.tsx has zero i18n
- **File:** `src/pages/payments/MoMoPaymentPage.tsx`  
- **Category:** I18N_MISSING  
- **Description:** Does not import `useTranslation`. All strings are hardcoded English: "Phone is required", "Parcel ID is required", "Pay with MTN MoMo", "Initiating…", "Error:", "Payment initiated", etc.  
- **Fix:** Add `useTranslation()` and replace all string literals with `t()` calls. Add corresponding keys to `en.json` and `fr.json`.

### #12 · HIGH — MtnTest.tsx has zero i18n
- **File:** `src/pages/payments/MtnTest.tsx`  
- **Category:** I18N_MISSING  
- **Description:** No `useTranslation`. All UI text is hardcoded: "MTN Mobile Money Test", "Phone (MSISDN)", "Amount", "Get Token", "Init Payment", "(no response)".  
- **Fix:** This is a debug/test page. Either add i18n or clearly mark it as dev-only and exclude from production builds.

---

## 4 — i18n GAPS (PARTIAL HARDCODED STRINGS)

### #13 · MEDIUM — CourierPickups.tsx: ~10 hardcoded English strings
- **File:** `src/pages/pickups/CourierPickups.tsx`  
- **Category:** I18N_GAP  
- **Strings:** "My Pickups", "Assigned pickup requests", "Pickups", "Error loading pickups", "No pickups", "Pickups assigned to you will appear here", "Open", "Previous", "Next", "Page X of Y", "No schedule"  
- **Fix:** Replace each with `t("courierPickups.xxx")` keys.

### #14 · MEDIUM — CourierDeliveries.tsx: ~5 hardcoded English strings
- **File:** `src/pages/deliveries/CourierDeliveries.tsx`  
- **Category:** I18N_GAP  
- **Strings:** "Start", "Previous", "Next", "Page X of Y", "Unknown destination"  
- **Fix:** Replace with `t()` calls.

### #15 · MEDIUM — DeliveryDetail.tsx: ~8 hardcoded English strings
- **File:** `src/pages/deliveries/DeliveryDetail.tsx`  
- **Category:** I18N_GAP  
- **Strings:** "Delivery", "Loading…", "Missing delivery id", "Please go back and select a delivery", "Back to deliveries", "Unable to load delivery", "Please try again", "Recipient"  
- **Fix:** Replace with `t()` calls.

### #16 · MEDIUM — ClientPayments.tsx: ~15 hardcoded English strings
- **File:** `src/pages/payments/ClientPayments.tsx`  
- **Category:** I18N_GAP  
- **Strings:** "Payments", "Your payment history", "History", "Loading payments...", "No payments found", "Try adjusting your search", "Search by payment or parcel ID...", "Payment", "Parcel", "Amount", "Method", "Status", "Created", "Actions", "View / Print", "Parcel ID missing", "Unable to open print window", "Failed to load receipt"  
- **Fix:** Replace all with `t()` calls. This is a client-facing page so this is important.

### #17 · MEDIUM — CreateParcel.tsx address dialog: ~15 hardcoded English strings
- **File:** `src/pages/parcels/CreateParcel.tsx`  
- **Category:** I18N_GAP  
- **Strings:** "Add sender address", "Add recipient address", "Add an address manually or pick it on the map.", "Manual", "Map", "Label", "Street", "City", "Region", "Country", "Location selected", "Please fill in label, city and region", "Saving...", "Save address", "Address added", "Failed to add address", "Home / Office / Shop", "Street / Landmark", "Douala", "Littoral"  
- **Fix:** Replace with `t()` calls.

### #18 · MEDIUM — SelfHealingDashboard.tsx uses inline fallback defaults
- **File:** `src/pages/admin/SelfHealingDashboard.tsx` (throughout)  
- **Category:** I18N_GAP  
- **Description:** Uses pattern `t("key", "English fallback")` extensively which technically works but means French translations will show English if the key is missing. The fallback strings include: "Self-Healing Dashboard", "Monitor and manage system health automatically", "Refresh", "Congestion Alerts", "All agencies operating normally", "Notify Affected Clients", "Suggested Actions", "AI-recommended interventions", "Critical", "High", "Medium", "Normal".  
- **Fix:** Ensure all keys are present in both `en.json` and `fr.json`. Remove inline fallbacks to catch missing translations during development.

### #19 · MEDIUM — ParcelList.tsx: "Export" button text hardcoded
- **File:** `src/pages/parcels/ParcelList.tsx`  
- **Category:** I18N_GAP  
- **Description:** The export dropdown trigger button text "Export" is not wrapped in `t()`.  
- **Fix:** Change to `{t("common.export")}`.

---

## 5 — INCOMPLETE UI / STUB PAGES

### #20 · HIGH — Notifications page is a permanent empty state
- **File:** `src/pages/notifications/Notifications.tsx`  
- **Category:** INCOMPLETE_UI  
- **Description:** The page only renders an `EmptyState` component. There is no data fetching, no hook usage, no notification list. It is a static stub that always shows "No logs".  
- **Fix:** Integrate `useNotifications()` hook (exists in hooks/notifications/) to fetch and display real notification data. Add mark-as-read functionality.

### #21 · MEDIUM — MapViewer.tsx uses hardcoded demo markers
- **File:** `src/pages/maps/MapViewer.tsx` lines 9-12  
- **Category:** INCOMPLETE_UI  
- **Description:** Markers are hardcoded as `[{ id: "pickup-1", position: [3.848, 11.5021], label: "Main Hub" }, ...]`. No real data is fetched.  
- **Fix:** Fetch agency/hub locations from the API (e.g., `mapService.getAgencies()`) and render real markers.

### #22 · MEDIUM — ApiCoverage.tsx is a debug page accessible in production
- **File:** `src/pages/debug/ApiCoverage.tsx`  
- **Category:** INCOMPLETE_UI  
- **Description:** Dev-only API debug console is mounted at `/admin/api-coverage` and is accessible to any admin user in production. It has zero i18n and allows arbitrary HTTP requests.  
- **Fix:** Gate behind `import.meta.env.DEV` check, or remove the route from production builds. Add a `if (!import.meta.env.DEV) return null` guard.

---

## 6 — STATE MANAGEMENT ISSUES

### #23 · MEDIUM — AgentDashboard uses manual useEffect instead of React Query
- **File:** `src/pages/dashboard/AgentDashboard.tsx` lines 42-60  
- **Category:** STATE_MANAGEMENT  
- **Description:** Uses `useState` + `useEffect` + manual `agentService.getAgentTasks()` for data fetching. All other dashboards use React Query (`useMyParcels`, `useCourierPickups`, `usePayments`, etc.). This means: no automatic cache invalidation, no refetch on window focus, no loading/error state from React Query, no deduplication.  
- **Fix:** Create a `useAgentTasks` React Query hook in `hooks/` and use it like other dashboards.

### #24 · MEDIUM — Addresses.tsx uses manual useEffect instead of React Query
- **File:** `src/pages/common/Addresses.tsx` lines 51-74  
- **Category:** STATE_MANAGEMENT  
- **Description:** Same pattern: manual `useState` + `useEffect` + `addressService.getMyAddresses()`. Mutations (create, update, delete) also use manual state updates instead of `useMutation` with cache invalidation.  
- **Fix:** Create `useMyAddresses`, `useCreateAddress`, `useUpdateAddress`, `useDeleteAddress` hooks using React Query.

### #25 · LOW — CourierDashboard totalDistance uses hardcoded average
- **File:** `src/pages/dashboard/CourierDashboard.tsx`  
- **Category:** STATE_MANAGEMENT  
- **Description:** `totalDistance` is calculated as `deliveredCount * 5.2` (hardcoded 5.2 km average), not from real GPS/distance data.  
- **Fix:** Either fetch actual distance data from the API, or clearly label it as "estimated" in the UI.

---

## 7 — MISSING ERROR HANDLING

### #26 · MEDIUM — SelfHealingDashboard swallows errors silently
- **File:** `src/pages/admin/SelfHealingDashboard.tsx` lines 44-47, 64-67, 78-81  
- **Category:** MISSING_ERROR_HANDLING  
- **Description:** Three `catch` blocks only do `console.error(...)` and never show user feedback. If `fetchData()`, `handleExecuteAction()`, or `handleNotifyClients()` fails, the user sees no error toast or error state.  
- **Fix:** Add `toast.error(t("selfHealing.fetchError"))` in each catch block.

### #27 · LOW — InvoicesPage.tsx swallows fetch errors
- **File:** `src/pages/common/InvoicesPage.tsx` line 16  
- **Category:** MISSING_ERROR_HANDLING  
- **Description:** `fetchInvoices()` catches errors with only `console.warn(e)`. No error state is shown to the user.  
- **Fix:** Add an error state and display it in the UI.

### #28 · LOW — admin/FinanceDashboard uses console.error only
- **File:** `src/pages/admin/FinanceDashboard.tsx` line 146  
- **Category:** MISSING_ERROR_HANDLING  
- **Description:** Dashboard data fetch error only logged to console, no user-visible error state.  
- **Fix:** Set an error state and render an error banner.

---

## 8 — SECURITY / CODE QUALITY

### #29 · LOW — ApiCoverage allows arbitrary HTTP requests in production
- **File:** `src/pages/debug/ApiCoverage.tsx`  
- **Category:** SECURITY  
- **Description:** The debug page allows invoking any endpoint with any method/body. While protected by admin role auth, it should not be in production.  
- **Fix:** Conditionally render only in development: `if (!import.meta.env.DEV) return <Navigate to="/admin" />`.

### #30 · LOW — Addresses.tsx uses `any` type for update payload
- **File:** `src/pages/common/Addresses.tsx` line 102  
- **Category:** CODE_QUALITY  
- **Description:** `const updateData: any = { ... }` bypasses TypeScript type checking.  
- **Fix:** Define a proper `AddressUpdatePayload` interface.

### #31 · LOW — MtnTest.tsx uses `any` type for response state
- **File:** `src/pages/payments/MtnTest.tsx` line 8  
- **Category:** CODE_QUALITY  
- **Description:** `const [res, setRes] = useState<any>(null)` bypasses type safety.  
- **Fix:** Define a proper type for the MTN API response.

---

## Route Coverage Matrix

| Page File | Routed? | Notes |
|-----------|---------|-------|
| `pages/common/Landing.tsx` | ✅ `/` | |
| `pages/common/TrackingPage.tsx` | ✅ `/client/tracking`, `/staff/tracking`, `/admin/tracking`, `/tracking` | |
| `pages/common/Addresses.tsx` | ❌ | **Not routed** — Finding #5 |
| `pages/common/InvoicesPage.tsx` | ❌ | **Not routed** — Finding #6 |
| `pages/common/ScanPage.tsx` | ❌ | **Not routed** — Finding #7 |
| `pages/auth/Login.tsx` | ✅ | |
| `pages/auth/LoginOtp.tsx` | ✅ | |
| `pages/auth/Register.tsx` | ✅ | |
| `pages/auth/ResetPassword.tsx` | ✅ | |
| `pages/dashboard/ClientDashboard.tsx` | ✅ | |
| `pages/dashboard/CourierDashboard.tsx` | ✅ | |
| `pages/dashboard/AgentDashboard.tsx` | ✅ | |
| `pages/dashboard/StaffDashboard.tsx` | ✅ | |
| `pages/dashboard/AdminDashboard.tsx` | ✅ | |
| `pages/dashboard/FinanceDashboard.tsx` | ✅ | |
| `pages/dashboard/RiskDashboard.tsx` | ✅ | |
| `pages/parcels/CreateParcel.tsx` | ✅ | i18n gaps (#17) |
| `pages/parcels/ParcelList.tsx` | ✅ | i18n gap (#19) |
| `pages/parcels/ParcelDetail.tsx` | ✅ | |
| `pages/parcels/ParcelManagement.tsx` | ✅ | Flag broken (#3) |
| `pages/parcels/PrintLabelPage.tsx` | ✅ | |
| `pages/parcels/QRCodePage.tsx` | ✅ | |
| `pages/parcels/ParcelTrackingPage.tsx` | ❌ | **Not routed** — Finding #8 |
| `pages/pickups/Pickups.tsx` | ✅ | |
| `pages/pickups/CourierPickups.tsx` | ✅ | i18n gaps (#13) |
| `pages/pickups/PickupDetail.tsx` | ✅ | |
| `pages/pickups/PickupsManagement.tsx` | ✅ | |
| `pages/pickups/PickupQrPage.tsx` | ❌ | **Not routed** — Finding #9 |
| `pages/deliveries/CourierDeliveries.tsx` | ✅ | i18n gaps (#14) |
| `pages/deliveries/DeliveryDetail.tsx` | ✅ | i18n gaps (#15) |
| `pages/deliveries/ConfirmDelivery.tsx` | ✅ | |
| `pages/payments/Payments.tsx` | ✅ | |
| `pages/payments/ClientPayments.tsx` | ✅ | i18n gaps (#16) |
| `pages/payments/Refunds.tsx` | ✅ | |
| `pages/payments/MoMoPaymentPage.tsx` | ❌ | **Not routed** — Finding #10, #11 |
| `pages/payments/MtnTest.tsx` | ✅ `/mtn-test` | Debug page, no i18n (#12) |
| `pages/notifications/Notifications.tsx` | ✅ | **Stub only** — Finding #20 |
| `pages/analytics/Analytics.tsx` | ✅ | |
| `pages/compliance/Compliance.tsx` | ✅ | |
| `pages/compliance/RiskAlerts.tsx` | ✅ | |
| `pages/support/Support.tsx` | ✅ | |
| `pages/scan/ScanConsole.tsx` | ✅ | |
| `pages/admin/TariffManagement.tsx` | ✅ | |
| `pages/admin/IntegrationManagement.tsx` | ✅ | |
| `pages/admin/UserAccountManagement.tsx` | ✅ | |
| `pages/admin/SelfHealingDashboard.tsx` | ✅ | Error handling (#26), i18n (#18) |
| `pages/admin/CreateFinancePage.tsx` | ✅ | |
| `pages/admin/CreateRiskPage.tsx` | ✅ | |
| `pages/admin/FinanceDashboard.tsx` | ✅ | Error handling (#28) |
| `pages/admin/RiskDashboard.tsx` | ✅ | |
| `pages/users/ClientManagement.tsx` | ✅ | |
| `pages/users/AgentManagement.tsx` | ✅ | |
| `pages/users/AgencyManagement.tsx` | ✅ | |
| `pages/users/StaffManagement.tsx` | ✅ | |
| `pages/users/CourierManagement.tsx` | ✅ | |
| `pages/maps/MapViewer.tsx` | ✅ (lazy) | Hardcoded markers (#21) |
| `pages/maps/PickupMap.tsx` | ✅ (lazy) | |
| `pages/maps/TrackingMap.tsx` | ✅ (lazy) | |
| `pages/maps/RoleMapDashboard.tsx` | ✅ (lazy) | |
| `pages/debug/ApiCoverage.tsx` | ✅ `/admin/api-coverage` | Security (#29), no i18n |

---

## Priority Fix Order

1. **CRITICAL** — Fix AgentDashboard route (#1) and StaffDashboard route (#2) — users hitting dead ends
2. **HIGH** — Implement flag API (#3), wire export button (#4)
3. **HIGH** — Build out Notifications page (#20) — stub visible to all roles
4. **HIGH** — Add i18n to MoMoPaymentPage (#11) and MtnTest (#12)
5. **MEDIUM** — Wire dead pages (#5-#10) or delete them
6. **MEDIUM** — Fix all i18n gaps (#13-#19) — ~60 hardcoded strings across 7 files
7. **MEDIUM** — Migrate manual useEffect patterns to React Query (#23, #24)
8. **MEDIUM** — Add user-visible error handling (#26-#28)
9. **LOW** — Gate ApiCoverage behind dev mode (#29), fix TypeScript `any` usage (#30, #31), label estimated distance (#25)
