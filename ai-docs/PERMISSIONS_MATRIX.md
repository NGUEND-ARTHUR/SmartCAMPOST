# SmartCAMPOST — Permissions Matrix

## Legend
✅ Full access | 🔍 Read-only | ✏️ Own data only | ❌ No access

---

## Authentication & Account Management

| Action | CLIENT | AGENT | COURIER | STAFF | ADMIN | FINANCE | RISK |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Self-register | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Login (phone/OTP/Google) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change own password | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reset password (OTP) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create CLIENT account | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create STAFF account | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Create AGENT account | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Create COURIER account | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Create FINANCE account | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Create RISK account | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Freeze user account | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Unfreeze user account | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View all user accounts | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## Parcel Management

| Action | CLIENT | AGENT | COURIER | STAFF | ADMIN | FINANCE | RISK |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Create parcel | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View own parcels | ✏️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View all parcels | ❌ | 🔍 | ❌ | ✅ | ✅ | ❌ | ❌ |
| Correct parcel (before lock) | ✏️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Update parcel metadata | ✏️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Change delivery option | ✏️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Accept parcel (physical intake) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Validate & lock parcel | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Update parcel status | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Admin override (unlock) | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Public tracking (no auth) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Print shipping label | ✏️ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |

---

## QR Codes

| Action | CLIENT | AGENT | COURIER | STAFF | ADMIN | FINANCE | RISK |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| View partial QR (own parcel) | ✏️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View final QR | ✏️ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Validate QR | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Generate final QR | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Revoke QR | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## Scan Events

| Action | CLIENT | AGENT | COURIER | STAFF | ADMIN | FINANCE | RISK |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Create scan event | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View scan history | ✏️ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Offline sync events | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## Pickup Requests

| Action | CLIENT | AGENT | COURIER | STAFF | ADMIN | FINANCE | RISK |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Request pickup | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View own pickups | ✏️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View all pickups | ❌ | ❌ | 🔍 | ✅ | ✅ | ❌ | ❌ |
| Assign courier to pickup | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Confirm pickup (courier) | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cancel pickup | ✏️ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |

---

## Delivery

| Action | CLIENT | AGENT | COURIER | STAFF | ADMIN | FINANCE | RISK |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Start delivery | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Send delivery OTP | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Verify delivery OTP | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Submit delivery proof | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Complete delivery | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Mark delivery failed | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update courier GPS | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Payments

| Action | CLIENT | AGENT | COURIER | STAFF | ADMIN | FINANCE | RISK |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Initiate payment | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View own payments | ✏️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View all payments | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Request refund | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve refund | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Reject refund | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| View invoices | ✏️ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Download invoice PDF | ✏️ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |

---

## Analytics & Reporting

| Action | CLIENT | AGENT | COURIER | STAFF | ADMIN | FINANCE | RISK |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| View own dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Parcel volume analytics | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Revenue analytics | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Courier performance | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Export reports | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |

---

## Risk & Compliance

| Action | CLIENT | AGENT | COURIER | STAFF | ADMIN | FINANCE | RISK |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| View risk alerts | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Manage risk alerts | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| View compliance reports | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Create compliance report | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View audit log | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |

---

## System Administration

| Action | CLIENT | AGENT | COURIER | STAFF | ADMIN | FINANCE | RISK |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Manage agencies | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Manage tariffs | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Manage integrations | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Approve AI recommendations | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Self-healing actions | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View AI recommendations | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Access actuator endpoints | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

---

## Support

| Action | CLIENT | AGENT | COURIER | STAFF | ADMIN | FINANCE | RISK |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Create support ticket | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own tickets | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all tickets | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Update ticket status | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |

---

## Notifications

| Action | CLIENT | AGENT | COURIER | STAFF | ADMIN | FINANCE | RISK |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| View own notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mark notification read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Send notification (system) | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
