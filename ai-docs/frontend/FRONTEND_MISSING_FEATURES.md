# SmartCAMPOST — Frontend Missing Features & Incomplete Implementations

## Fully Missing Features

### 1. Invoice Download (PDF)
**Page:** `InvoicesPage.tsx`  
**Status:** Partial implementation — page exists, not fully wired  
**What's needed:**
- List of invoices per payment/parcel
- PDF download button → `GET /api/invoices/{id}/pdf`
- Invoice preview before download

---

### 2. Audit Log Page
**Nav entry:** Present in ADMIN sidebar  
**Status:** No dedicated audit log page  
**What's needed:**
- Table showing all audit log entries (action, entity, actor, timestamp, IP, old/new values)
- Filter by entity type, actor, date range
- Export to CSV

---

### 3. AI Recommendations Review
**Backend:** Full AI recommendations system exists (`ai_agent_recommendation` table)  
**Frontend:** `ai.api.ts` exists but no review page  
**What's needed:**
- Page listing PENDING AI recommendations
- Approve/reject with comment
- AI confidence score display
- Execution result feedback

---

### 4. Analytics Dashboard (Charts)
**Page:** `Analytics.tsx`  
**Status:** Generic stub page, no actual chart data  
**What's needed:**
- Parcel volume over time (line chart)
- Revenue trend (bar chart)
- Courier performance table (deliveries, avg time)
- Agency throughput metrics
- Status distribution pie chart

---

### 5. Compliance Reports
**Page:** `Compliance.tsx`  
**Status:** Minimal implementation  
**What's needed:**
- AML/compliance report list
- Create compliance report form
- Status tracking (PENDING → APPROVED/REJECTED/FLAGGED)
- Export reports

---

### 6. Support Chat / Conversation UI
**Backend:** `Conversation` and `ConversationMessage` entities exist  
**Frontend:** `AIChatbot.tsx` exists but no ticket-conversation view  
**What's needed:**
- In-ticket chat thread (client ↔ agent)
- Real-time messages (SSE or polling)
- Message history per ticket

---

### 7. Congestion Alert Notifications (Client-facing)
**Self-healing:** Backend can send notifications when routes change  
**Frontend:** No UI to display route change notifications distinctly  
**What's needed:**
- Special notification type for "your parcel route has been updated"
- Push/in-app notification with new ETA

---

### 8. Delivery Failure & Rescheduling
**Backend:** `DELIVERY_FAILED`, `RESCHEDULED` scan event types exist  
**Frontend:** `POST /api/delivery/{parcelId}/failed` in mobile, not clearly in web  
**What's needed:**
- Courier failure report form (reason, photo)
- Client notification of failure
- Reschedule delivery UI (new date/time selection)

---

### 9. Return to Sender Workflow
**Backend:** `RETURNED_TO_SENDER` parcel status exists  
**Frontend:** No workflow implemented  
**What's needed:**
- After N delivery failures, trigger return flow
- Notify sender
- Update parcel status in UI

---

### 10. Refund Status Tracking (Client View)
**Page:** Refunds management exists for FINANCE  
**Client side:** `ClientPayments.tsx` — refund request exists but status tracking unclear  
**What's needed:**
- Client sees their refund requests with PENDING/APPROVED/REJECTED status
- Notification when refund is processed

---

## Incomplete Implementations

### 11. Notifications Mark-as-Read
**Component:** `Notifications.tsx`, `NotificationsDrawer.tsx`  
**Status:** UI exists, API call may not work  
**Issue:** Backend `PUT /notifications/{id}/read` endpoint needs verification  
**What's needed:**
- Working mark-as-read per notification
- Mark-all-read
- Unread count badge in sidebar

---

### 12. Address Management (Client)
**Page:** `Addresses.tsx`  
**Status:** Page exists but not fully wired  
**What's needed:**
- List saved addresses
- Add new address (with map picker)
- Edit/delete addresses
- Set default sender/recipient address

---

### 13. MTN MoMo Payment (Web)
**Page:** `MoMoPaymentPage.tsx`, `MtnTest.tsx`  
**Status:** Test page exists, not integrated in client payment flow  
**What's needed:**
- Integrated into `ClientPayments.tsx` → "Pay Now" triggers MoMo flow
- Polling payment status until SUCCESS/FAILED
- Clear error handling for MoMo-specific codes

---

### 14. Pickup QR Page
**Page:** `PickupQrPage.tsx`  
**Status:** Route exists, content unclear  
**What's needed:**
- QR code for pickup confirmation (courier scans at client location)
- Clear instructions for both courier and client

---

### 15. Staff Management — Courier Creation
**Page:** `StaffManagement.tsx` — merged view of staff + couriers  
**Status:** Role selector includes COURIER but courier-specific fields (vehicleId) may be missing  
**What's needed:**
- Vehicle ID field when role = COURIER
- Agency assignment for couriers

---

### 16. Integration Management
**Page:** `IntegrationManagement.tsx`  
**Status:** Listed in nav but implementation unclear  
**What's needed:**
- View active integrations (Twilio, MTN, Maps, OpenAI)
- Enable/disable integrations
- API key management (masked display)
- Connection health check

---

## Role-Specific Missing Screens

| Role | Missing Feature |
|---|---|
| CLIENT | Track individual scan event on map |
| CLIENT | Invoice download from payment history |
| AGENT | Parcel list filtered by agency |
| COURIER | Route optimization map (flutter_map exists in mobile, not web) |
| COURIER | Failed delivery report form |
| STAFF | Congestion alerts view |
| ADMIN | Audit log page |
| ADMIN | AI recommendations review |
| FINANCE | Invoice management (create/void) |
| RISK | Compliance report creation |
| RISK | Full compliance report detail view |

---

## Missing UX Patterns

| Issue | Impact |
|---|---|
| No loading skeleton on dashboard stats cards | Layout shift / blank cards on slow connections |
| No empty state on Analytics page | Confusing blank charts |
| No pagination on notifications list | Performance degrades with many notifications |
| No search/filter on Support tickets list | Hard to find old tickets |
| No confirmation dialog on parcel status changes | Accidental status updates |
| Export button present but not all tables wired | User expects export, gets error |
| Language switcher not persisted in some flows | French user gets English after redirect |

---

## TODO / Technical Debt

| Location | Issue |
|---|---|
| `ApiCoverage.tsx` | Debug page should not exist in production |
| `MtnTest.tsx` | Test page at `/mtn-test` should be removed or guarded |
| `ScanPage.tsx` (in common/) | Duplicate/unused version of scan page |
| Multiple `placeholder` patterns | Several features route to the same empty state |
| `useOfflineSync.ts` | Offline sync not actively triggered in web UI pages |
| Dark mode | Theme toggle exists but some pages may not fully support it |
