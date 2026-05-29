# SmartCAMPOST — Full Feature Map

## Feature Status Legend
✅ Implemented | ⚠️ Partial | ❌ Missing | 🔧 Planned (infrastructure exists)

---

## Authentication & Identity

| Feature | Backend | Web | Mobile | Notes |
|---|:---:|:---:|:---:|---|
| Phone + password login | ✅ | ✅ | ✅ | |
| OTP login | ✅ | ✅ | ✅ | |
| Google OAuth2 login | ✅ | ✅ | ✅ | Client ID hardcoded in dev |
| Registration (CLIENT) | ✅ | ✅ | ✅ | OTP verification required |
| Password reset (OTP) | ✅ | ✅ | ✅ | |
| Token refresh | ❌ | ❌ | ❌ | No refresh token system |
| Account lockout (5 failures) | ✅ | 🔧 | 🔧 | Backend-only; frontend shows error code |
| Account freeze/unfreeze | ✅ | ✅ | ❌ | Web admin only |
| Session restoration | N/A | ✅ | ✅ | localStorage / FlutterSecureStorage |
| JWT expiry detection | ❌ | ❌ | ❌ | No client-side check |

---

## Client Parcel Management

| Feature | Backend | Web | Mobile | Notes |
|---|:---:|:---:|:---:|---|
| Create parcel | ✅ | ✅ | ✅ | |
| Multi-step parcel form | N/A | ✅ | ✅ | |
| GPS capture at creation | ✅ | ✅ | ✅ | |
| Parcel list (paginated) | ✅ | ✅ | ✅ | |
| Parcel detail view | ✅ | ✅ | ✅ | |
| Scan event timeline | ✅ | ✅ | ❌ | Mobile detail has no timeline |
| Correct parcel (pre-lock) | ✅ | ⚠️ | ❌ | Web partial; mobile missing |
| Change delivery option | ✅ | ⚠️ | ❌ | Backend exists; frontend partial |
| Update metadata (photo/comment) | ✅ | ⚠️ | ❌ | |
| Print shipping label | N/A | ✅ | ❌ | |
| View QR code | ✅ | ✅ | ✅ | |

---

## Parcel Tracking (Public)

| Feature | Backend | Web | Mobile | Notes |
|---|:---:|:---:|:---:|---|
| Track by reference | ✅ | ✅ | ✅ | |
| Track by QR scan | ✅ | ✅ | ✅ | html5-qrcode / mobile_scanner |
| Timeline display | ✅ | ✅ | ❌ | Mobile shows basic info only |
| Map marker (current GPS) | ✅ | ✅ | ❌ | Mobile no map |
| Audit trail (staff/admin) | ✅ | ✅ | ❌ | |

---

## Agency Intake (Agent)

| Feature | Backend | Web | Mobile | Notes |
|---|:---:|:---:|:---:|---|
| QR scan intake | ✅ | ✅ | ✅ | |
| GPS with scan events | ✅ | ✅ | ✅ | |
| Parcel validation (weight/dims) | ✅ | ⚠️ | ✅ | Web partial; mobile has button |
| Validate & lock parcel | ✅ | ✅ | ✅ | |
| Generate final QR | ✅ | ✅ | N/A | Backend generates on lock |
| Multi-parcel batch scan | N/A | ⚠️ | ✅ | Mobile ScanIntake accumulates list |
| Offline scan queuing | ✅ | ⚠️ | ❌ | Infrastructure exists; not wired |

---

## In-Transit Operations

| Feature | Backend | Web | Mobile | Notes |
|---|:---:|:---:|:---:|---|
| Create scan event | ✅ | ✅ | ✅ | |
| Mandatory GPS on scan | ✅ | ✅ | ✅ | |
| Offline sync (POST /sync) | ✅ | 🔧 | 🔧 | Infrastructure exists; not triggered |
| Live admin SSE feed | ✅ | ✅ | ❌ | Web only |
| Location source tracking | ✅ | ⚠️ | ✅ | Mobile sends GPS/MANUAL |

---

## Pickup Requests

| Feature | Backend | Web | Mobile | Notes |
|---|:---:|:---:|:---:|---|
| Client creates pickup | ✅ | ✅ | ❌ | Mobile has no create pickup UI |
| Courier views pickups | ✅ | ✅ | ✅ | |
| Staff assigns courier | ✅ | ✅ | ❌ | Mobile no assign UI |
| Courier confirms pickup | ✅ | ✅ | ✅ | |
| Pickup QR verification | ✅ | ✅ | ❌ | |

---

## Home Delivery

| Feature | Backend | Web | Mobile | Notes |
|---|:---:|:---:|:---:|---|
| Start delivery | ✅ | ✅ | ✅ | |
| Send delivery OTP (SMS) | ✅ | ✅ | ✅ | Twilio integration |
| Verify delivery OTP | ✅ | ✅ | ✅ | |
| Photo proof capture | ✅ | ✅ | ❌ | Mobile image_picker unused |
| Signature proof | ✅ | ⚠️ | ❌ | Backend supports; UI partial |
| Complete delivery | ✅ | ✅ | ✅ | |
| Delivery failure report | ✅ | ❌ | ⚠️ | Backend + mobile endpoint exist |
| Return to sender | ✅ | ❌ | ❌ | Status exists; no workflow UI |

---

## Payments

| Feature | Backend | Web | Mobile | Notes |
|---|:---:|:---:|:---:|---|
| PREPAID payment | ✅ | ⚠️ | ❌ | Web partial; mobile no payment UI |
| COD payment | ✅ | ⚠️ | ❌ | |
| MTN MoMo integration | ✅ | ⚠️ | ❌ | Backend full; web test page only |
| MTN webhook handling | ✅ | N/A | N/A | |
| Payment status polling | ✅ | ⚠️ | ❌ | |
| Invoice generation (PDF) | ✅ | ❌ | ❌ | Backend generates; no download UI |
| Invoice list view | ✅ | ❌ | ❌ | Page exists, not implemented |
| Client payment history | ✅ | ✅ | ❌ | |

---

## Refunds

| Feature | Backend | Web | Mobile | Notes |
|---|:---:|:---:|:---:|---|
| Client requests refund | ✅ | ⚠️ | ❌ | |
| Finance approves/rejects | ✅ | ✅ | ❌ | |
| Refund status tracking | ✅ | ⚠️ | ❌ | |
| Refund adjustments | ✅ | ❌ | ❌ | |

---

## Admin: User Management

| Feature | Backend | Web | Mobile | Notes |
|---|:---:|:---:|:---:|---|
| Create staff/agents/couriers | ✅ | ✅ | ❌ | Mobile placeholder |
| List all clients | ✅ | ✅ | ❌ | |
| List all staff/agents/couriers | ✅ | ✅ | ❌ | |
| Agency management | ✅ | ✅ | ❌ | |
| Tariff management | ✅ | ✅ | ❌ | |
| Integration management | ✅ | ✅ | ❌ | |

---

## Finance

| Feature | Backend | Web | Mobile | Notes |
|---|:---:|:---:|:---:|---|
| Finance dashboard | ✅ | ✅ | ✅ | Mobile shows stats; no detail |
| Payment ledger | ✅ | ✅ | ❌ | |
| Revenue analytics | ✅ | ⚠️ | ❌ | Web analytics stub |
| Export (CSV/XLSX/PDF) | N/A | ✅ | ❌ | |

---

## Risk & Compliance

| Feature | Backend | Web | Mobile | Notes |
|---|:---:|:---:|:---:|---|
| Risk alerts | ✅ | ✅ | ✅ | Mobile shows top 5 only |
| Alert management | ✅ | ✅ | ❌ | |
| Compliance reports | ✅ | ⚠️ | ❌ | |
| AI risk detection | ✅ | ❌ | ❌ | No review UI |
| Freeze user from alert | ✅ | ✅ | ❌ | |

---

## AI & Self-Healing

| Feature | Backend | Web | Mobile | Notes |
|---|:---:|:---:|:---:|---|
| AI recommendations | ✅ | ❌ | ❌ | No review UI on any client |
| AI chat | ✅ | ✅ | ❌ | Web has AIChatbot component |
| Anomaly detection | ✅ | ❌ | ❌ | Backend only |
| Route optimization | ✅ | ❌ | ❌ | |
| Self-healing congestion | ✅ | ✅ | ❌ | |
| Congestion detection | ✅ | ✅ | ❌ | |

---

## Notifications

| Feature | Backend | Web | Mobile | Notes |
|---|:---:|:---:|:---:|---|
| SMS notifications | ✅ | N/A | N/A | Twilio |
| In-app notifications | ✅ | ✅ | ✅ | Pull-based |
| Mark as read | ✅ | ⚠️ | ⚠️ | Endpoint may not work |
| Push notifications (FCM) | ❌ | ❌ | ❌ | Not implemented anywhere |
| Unread badge count | ✅ | ⚠️ | ⚠️ | Endpoint exists; UI partial |

---

## Maps & Geolocation

| Feature | Backend | Web | Mobile | Notes |
|---|:---:|:---:|:---:|---|
| Cameroon map view | ✅ | ✅ | ❌ | flutter_map unused |
| Courier live tracking | ✅ | ✅ | ❌ | GPS update endpoint exists |
| Parcel tracking on map | ✅ | ✅ | ❌ | |
| Route optimization | ✅ | ⚠️ | ❌ | |
| Location picker (address) | N/A | ✅ | ❌ | Web LocationPicker component |

---

## USSD (Feature Phones)

| Feature | Backend | Web | Mobile | Notes |
|---|:---:|:---:|:---:|---|
| USSD gateway handler | ✅ | N/A | N/A | `POST /api/ussd` public endpoint |
| USSD session management | ✅ | N/A | N/A | UssdSession entity |
| USSD menu flows | ✅ | N/A | N/A | UssdService |

---

## i18n & Accessibility

| Feature | Backend | Web | Mobile | Notes |
|---|:---:|:---:|:---:|---|
| English support | ✅ | ✅ | ✅ | |
| French support | ✅ | ✅ | ✅ | Default on mobile |
| Language persistence | N/A | ✅ | ✅ | localStorage / SharedPreferences |
| Dark mode | N/A | ✅ | ❌ | Mobile ignores system theme |
