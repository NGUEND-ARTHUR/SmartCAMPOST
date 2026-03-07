# SmartCAMPOST Backend — Comprehensive Code Audit Report

**Date**: 2025  
**Scope**: All controllers, service implementations, config files  
**Categories**: INCOMPLETE | BROKEN_FLOW | DEAD_CODE | MISSING_VALIDATION | WRONG_LOGIC | PERFORMANCE | SECURITY  
**Severities**: 🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🟢 LOW  

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 8 |
| 🟠 HIGH | 14 |
| 🟡 MEDIUM | 18 |
| 🟢 LOW | 10 |
| **TOTAL** | **50** |

**Top risks**: Hardcoded fake data in production endpoints, missing `@Transactional` on payment/parcel operations, blanket CORS wildcard, `findAll().stream()` memory bombs, 15+ controllers with no authorization.

---

## 1. AUTH

### #1 — 🟡 MEDIUM — WRONG_LOGIC — `AuthServiceImpl.java` L91-94
**Duplicate OTP step: validate then consume separately**
```java
boolean validOtp = otpService.validateOtp(request.getPhone(), request.getOtp(), OtpPurpose.REGISTER);
if (!validOtp) { throw ... }
// ... later ...
otpService.consumeOtp(request.getPhone(), request.getOtp(), OtpPurpose.REGISTER);
```
OTP is validated, then the entire registration flow runs, _then_ consumed. If registration succeeds but `consumeOtp` fails, the OTP remains reusable. If another request races between validate and consume, the same OTP can register two accounts.  
**Fix**: Use a single atomic `validateAndConsumeOtp()` method, or consume immediately after validation inside a transaction.

### #2 — 🟡 MEDIUM — MISSING_VALIDATION — `AuthServiceImpl.java` L260-275
**Password change has no current-user ownership check**
```java
public void changePassword(ChangePasswordRequest request) {
    UUID uid = Objects.requireNonNull(request.getUserId(), "userId is required");
    UserAccount user = userAccountRepository.findById(uid)...
```
Any authenticated user can change any other user's password by supplying their `userId` — there is no check that `request.getUserId()` matches the currently authenticated principal.  
**Fix**: Validate `request.getUserId()` equals the authenticated user's ID.

### #3 — 🟡 MEDIUM — INCOMPLETE — `AuthServiceImpl.java` L204
**`resolveFullName()` returns `null` for unknown roles**
```java
default: return null;
```
If the enum gains new values, login succeeds but `fullName` is silently `null`.  
**Fix**: Log a warning or throw for unknown role.

---

## 2. PARCELS

### #4 — 🔴 CRITICAL — MISSING_VALIDATION — `ParcelServiceImpl.java` (entire class)
**No `@Transactional` on any method**  
`createParcel` performs: save parcel → confirmPrice → createCodPendingPayment. If the parcel saves but pricing fails, the database is left in an inconsistent state. `updateParcelStatus` records a ScanEvent and updates status across two repositories with no atomicity.  
**Fix**: Add `@Transactional` to `createParcel`, `updateParcelStatus`, `acceptParcelWithValidation`, and `changeDeliveryOption`.

### #5 — 🟠 HIGH — BROKEN_FLOW — `ParcelServiceImpl.java` L153-166
**Silent exception swallowing on critical operations**
```java
try { pricingService.confirmPrice(parcel.getId()); } catch (Exception ignored) { }
if (parcel.getPaymentOption() == PaymentOption.COD) {
    try { paymentService.createCodPendingPayment(parcel.getId()); } catch (Exception ignored) { }
}
```
If pricing confirmation fails, the parcel has **no price**. If COD payment creation fails, parcel is created but payment is never tracked. Neither is logged.  
**Fix**: At minimum log the exception. For pricing, fail-fast or mark the parcel as `PRICING_PENDING`.

### #6 — 🟡 MEDIUM — DEAD_CODE — `ParcelServiceImpl.java` L276-282
**`acceptParcel()` always throws**
```java
public ParcelResponse acceptParcel(UUID parcelId) {
    throw new AuthException(ErrorCode.VALIDATION_FAILED,
        "Acceptance requires GPS. Use PATCH .../validate with latitude/longitude.");
}
```
This method exists only to reject requests. If it's in the `ParcelService` interface, the contract is misleading.  
**Fix**: Remove from interface or deprecate with `@Deprecated`.

### #7 — 🟡 MEDIUM — WRONG_LOGIC — `ParcelServiceImpl.java` L383
**Price recalculation failure silently ignored during acceptance**
```java
try { pricingService.recalculatePriceForParcel(id); } catch (Exception e) { }
```
If weight changed but price recalculation fails, the client is charged the wrong amount.  
**Fix**: Log error and set a flag (e.g., `pricingPendingReview = true`) so staff can see it.

---

## 3. PAYMENTS

### #8 — 🔴 CRITICAL — MISSING_VALIDATION — `PaymentServiceImpl.java` (entire class)
**No `@Transactional` on any method**  
`initPayment`, `confirmPayment`, `processRegistrationPayment`, `processPickupPayment` — all involve multiple database writes (Payment, Parcel status, notifications) with zero transactional guarantees.  
**Fix**: Add `@Transactional` to all payment mutation methods.

### #9 — 🔴 CRITICAL — WRONG_LOGIC — `PaymentServiceImpl.java` L65-70
**Pricing failure silently defaults amount to 0.0**
```java
double price = 0.0;
try { price = pricingService.calculatePrice(...); }
catch (Exception ignored) { }
payment.setAmount(price);
```
If pricing fails, a payment of **0.0 XAF** is created. The user appears to have paid nothing.  
**Fix**: Fail-fast — do not create a payment if pricing cannot be resolved.

### #10 — 🟠 HIGH — BROKEN_FLOW — `PaymentServiceImpl.java` L121, L164, L180, L224, L258
**6 separate `catch (Exception ignored)` blocks**  
Notification failures, verification failures, and pricing failures are all silently swallowed without even logging.  
**Fix**: Replace `catch (Exception ignored)` with `catch (Exception e) { log.warn(..., e); }`.

### #11 — 🟡 MEDIUM — WRONG_LOGIC — `PaymentServiceImpl.java` L235-245
**`processDeliveryPayment` delegates entirely to `processPickupPayment`**  
```java
public PaymentResponse processDeliveryPayment(UUID parcelId, ProcessPaymentRequest req) {
    return processPickupPayment(parcelId, req);
}
```
Delivery payments may have different business rules (COD amounts, delivery surcharges) — this blanket delegation may be incorrect if delivery-specific logic is ever needed.  
**Fix**: Document this as intentional or add delivery-specific logic.

---

## 4. INVOICES

### #12 — 🔴 CRITICAL — DEAD_CODE — `InvoiceServiceImpl.java` L130-133
**`getInvoice(Long)` always returns `null`**
```java
@Override
public InvoiceResponse getInvoice(Long invoiceId) {
    return null; // "unused"
}
```
If any code calls this interface method, it gets `null` → `NullPointerException`.  
**Fix**: Throw `UnsupportedOperationException` or remove from interface.

### #13 — 🔴 CRITICAL — DEAD_CODE — `InvoiceServiceImpl.java` L160-163
**`loadInvoicePdf(Long)` always returns `null`**
```java
@Override
public byte[] loadInvoicePdf(Long invoiceId) {
    return null;
}
```
Same issue — callers would get NPE when trying to write the byte array to an HTTP response.  
**Fix**: Same as above.

### #14 — 🟠 HIGH — WRONG_LOGIC — `InvoiceServiceImpl.java` L125-128
**`getInvoicesForUser(Long)` creates wrong UUID from Long**
```java
UUID uuid = UUID.nameUUIDFromBytes(Long.toString(userId).getBytes());
```
`UUID.nameUUIDFromBytes()` generates a **v3 MD5-based UUID** — this will _never_ match an actual entity UUID stored in the database. The query will always return empty results.  
**Fix**: Accept `UUID` directly instead of `Long`, or use the actual user lookup.

### #15 — 🟠 HIGH — PERFORMANCE — `InvoiceController.java` L56
**`findAll().stream()` for non-CLIENT invoice listing**
```java
return invoiceRepository.findAll().stream()...
```
Loads every invoice in the database into memory for admin/staff users.  
**Fix**: Use `invoiceRepository.findAll(PageRequest.of(page, size))`.

---

## 5. MAPS & GEOLOCATION

### #16 — 🟠 HIGH — PERFORMANCE — `MapController.java` L74
**`parcelRepository.findAll().stream()` in `courierPersonalMap()`**
```java
List<ParcelMapEntry> parcels = parcelRepository.findAll().stream()...
```
Loads the **entire parcel table** into memory to filter by courier. With thousands of parcels, this causes memory pressure and latency spikes.  
**Fix**: `parcelRepository.findByCourierId(courierId)` with a targeted query.

### #17 — 🟠 HIGH — PERFORMANCE — `MapController.java` L109
**Same `findAll().stream()` in `adminOverview()`**  
Loads all parcels just to build map entries.  
**Fix**: Use a projection query that only fetches ID, trackingRef, status, and coordinates.

### #18 — 🟡 MEDIUM — WRONG_LOGIC — `MapController.java` L69
**Parses UUID principal as `Long`**
```java
Long uid = null;
try { uid = Long.parseLong(principal.getName()); } catch (Exception ignored) {}
```
The auth system uses UUIDs for user IDs, but this code tries to parse them as `Long`. This will **always** fail silently, and `uid` will remain `null`, meaning the courier-specific filter never works.  
**Fix**: Parse as `UUID.fromString(principal.getName())`.

### #19 — 🟡 MEDIUM — WRONG_LOGIC — `LocationController.java` L24, L34
**Same Long-parse-from-UUID issue**
```java
try { loc.setUserId(Long.parseLong(principal.getName())); } catch (Exception ignored) {}
```
User ID is always `null` after this, so location updates are anonymous.  
**Fix**: Parse as UUID, or redesign the Location model to accept UUID.

---

## 6. FINANCE

### #20 — 🔴 CRITICAL — WRONG_LOGIC — `FinanceController.java` L42-48
**`getStats()` returns hardcoded fake data**
```java
stats.put("totalRevenue", 245680);
stats.put("refundsThisMonth", 15420);
stats.put("netRevenue", 230260);
stats.put("transactionCount", 4850);
stats.put("avgTransactionValue", 12.5);
```
This production endpoint returns fake, constant numbers regardless of actual database state.  
**Fix**: Query the database via a `FinanceService.calculateStats()` method.

### #21 — 🔴 CRITICAL — WRONG_LOGIC — `FinanceController.java` L28-34
**`createFinance()` returns fake data, never persists**
```java
Map<String, Object> resp = new HashMap<>();
resp.put("id", UUID.randomUUID());
resp.put("amount", request.get("amount"));
resp.put("status", "CREATED");
return ResponseEntity.ok(resp);
```
The POST endpoint appears to succeed but writes nothing to the database.  
**Fix**: Implement actual persistence through `FinanceService`.

---

## 7. RISK & COMPLIANCE

### #22 — 🔴 CRITICAL — WRONG_LOGIC — `RiskController.java` L31-39
**`createRisk()` returns hardcoded fake data**
```java
resp.put("id", UUID.randomUUID());
resp.put("severity", "HIGH");
resp.put("status", "OPEN");
```
Same pattern as Finance — the POST endpoint never persists the risk alert.  
**Fix**: Delegate to `RiskService.createRiskAlert()` with actual persistence.

### #23 — 🟠 HIGH — PERFORMANCE — `ComplianceServiceImpl.java` L114-140
**`riskAlertRepository.findAll()` with 5 separate stream passes**
```java
List<RiskAlert> all = riskAlertRepository.findAll();
long total = all.stream().filter(...).count();
long unresolved = all.stream().filter(...).count();
long highCritical = all.stream().filter(...).count();
long amlCount = all.stream().filter(...).count();
Map<String, Long> byType = all.stream()...collect(groupingBy(...));
```
Iterates the full collection 5 times, and loads _all_ alerts even outside the date range.  
**Fix**: Use a single-pass `Collectors.teeing()` or a repository query with date filters: `findByCreatedAtBetween(from, to)`.

### #24 — 🟡 MEDIUM — WRONG_LOGIC — `AnalyticsServiceImpl.java` L55-60
**Payment anomaly detection is trivially simple**
```java
// Hardcoded 200,000 XAF threshold
if (payment.getAmount() > 200000) { flagged = true; }
```
A static threshold for anomaly detection misses transfer splitting, velocity-based anomalies, and undervalued parcels.  
**Fix**: At minimum, make the threshold configurable via `application.yaml`.

---

## 8. DASHBOARD

### #25 — 🟠 HIGH — PERFORMANCE — `DashboardServiceImpl.java` L73
**`userAccountRepository.findAll().stream()` for active user count**
```java
long activeUsers = userAccountRepository.findAll().stream()
    .filter(u -> !u.isFrozen())
    .count();
```
Loads all user accounts into memory.  
**Fix**: `userAccountRepository.countByFrozenFalse()` (single SQL COUNT query).

### #26 — 🟠 HIGH — PERFORMANCE — `AdminServiceImpl.java` L44
**`userAccountRepository.findAll().stream()` for listing all users**
```java
return userAccountRepository.findAll().stream().map(this::toResponse).toList();
```
No pagination — returns all users in a single response.  
**Fix**: Use `findAll(PageRequest.of(page, size))`.

---

## 9. SECURITY & CONFIG

### #27 — 🟠 HIGH — SECURITY — `WebConfig.java` L30
**CORS allows all origins**
```java
.allowedOriginPatterns("*")
```
When `cors.allowed-origins` is not configured (or empty), this falls through to `"*"`, effectively disabling all CORS protection.  
**Fix**: Fail-fast by throwing if `allowedOrigins` is empty, or default to a safe origin.

### #28 — 🟠 HIGH — SECURITY — Controllers missing `@PreAuthorize`
The following controllers have **NO** `@PreAuthorize` on any endpoint:

| Controller | Endpoints |
|---|---|
| `NotificationController` | 6 |
| `SupportTicketController` | 6 |
| `RefundController` | 5 |
| `AdminController` | 3 |
| `AgencyController` | 4 |
| `ScanEventController` | 2 |
| `DashboardController` | 1 |
| `GeolocationController` | 3 |
| `ClientController` | 5 (except profile) |
| `AnalyticsController` | 2 |
| `OfflineSyncController` | 1 |
| `TariffController` | 6 |
| `PricingDetailController` | 2 |
| `IntegrationConfigController` | 4 |
| `AiRecommendationController` | 2 |
| `AddressController` | 5 |

Some of these do manual role checks _inside_ the service layer, but this is inconsistent — most controllers use `@PreAuthorize` at the controller level.  
**Fix**: Add `@PreAuthorize` annotations to every endpoint, matching the role requirements from the business rules.

### #29 — 🟡 MEDIUM — SECURITY — `AgentController.java`
**Only `createAgent` has `@PreAuthorize('ADMIN')`** — `getAgent`, `listAgents`, `updateStatus`, `assignAgency` are unprotected.  
**Fix**: Add `@PreAuthorize("hasAnyRole('ADMIN','STAFF')")` to the other endpoints.

### #30 — 🟡 MEDIUM — SECURITY — `CourierController.java`
**Only `createCourier` has `@PreAuthorize('ADMIN')`** — `getCourier`, `listCouriers`, `updateStatus`, `updateVehicle` are unprotected.  
**Fix**: Same as above.

### #31 — 🟡 MEDIUM — SECURITY — `StaffController.java`
**Only `createStaff` has `@PreAuthorize('ADMIN')`** — `getStaff`, `listStaff`, `updateStatus`, `updateRole` are unprotected.  
**Fix**: Same.

### #32 — 🟢 LOW — DEAD_CODE — `SecurityConfig.java`
**Entire file is empty** — just contains a comment pointing to `MethodSecurityConfig`.  
**Fix**: Delete the file to avoid confusion.

---

## 10. QR CODES

### #33 — 🟡 MEDIUM — SECURITY — `QrSecurityServiceImpl.java` L88-93
**Falls back from QR secret to JWT secret**
```java
if (effectiveSecretKey == null || effectiveSecretKey.isBlank()) {
    if (jwtSecret != null && !jwtSecret.isBlank()) {
        effectiveSecretKey = jwtSecret;
    }
```
The QR HMAC key and the JWT signing key should be separate. If the QR secret is compromised, attackers also have the JWT secret (and vice versa).  
**Fix**: Require `QR_SECRET_KEY` explicitly in production — remove the JWT fallback.

---

## 11. SCAN & TRACKING

### #34 — 🟡 MEDIUM — MISSING_VALIDATION — `ScanController.java` L27
**Comment: "ownership should be validated in production" — NOT implemented**
```java
// ownership should be validated in production based on
// the authentication context
```
Any authenticated user can query any parcel's scan events.  
**Fix**: Validate that the user owns the parcel or has an appropriate role.

### #35 — 🟡 MEDIUM — WRONG_LOGIC — `ScanController.java` L41
**Silently ignores invalid parcel UUID**
```java
try { evt.setParcelId(java.util.UUID.fromString(parcelId)); } catch (Exception ignored) {}
```
If `parcelId` is not a valid UUID, `evt.parcelId` stays `null`, and the scan event is either saved without a parcel reference or fails downstream.  
**Fix**: Fail immediately with a 400 Bad Request.

### #36 — 🟡 MEDIUM — WRONG_LOGIC — `ScanController.java` L44
**`scannedBy` parsed as Long from UUID principal**
```java
try { if (auth != null) evt.setScannedBy(Long.parseLong(auth.getName())); } catch (Exception ignored) {}
```
Same UUID-as-Long issue seen in MapController/LocationController. `scannedBy` will always be `null`.  
**Fix**: Parse as UUID or change `scannedBy` field type.

---

## 12. NOTIFICATIONS

### #37 — 🟢 LOW — INCOMPLETE — `NotificationServiceImpl.java`
**No retry mechanism for failed notifications**  
The service sets `retryCount(0)` on creation but never retries failed sends. Method `sendAndUpdate()` presumably marks failures but there's no scheduled retry.  
**Fix**: Implement a `@Scheduled` job to retry FAILED notifications with exponential backoff.

---

## 13. DELIVERY

### #38 — 🟢 LOW — WRONG_LOGIC — `DeliveryServiceImpl.java` L732
**`formatAddress()` returns `null` for null addresses**
```java
if (address == null) return null;
```
If passed to the response builder, UI may display "null" string.  
**Fix**: Return an empty string or "Address unknown".

---

## 14. REFUNDS

### #39 — 🟡 MEDIUM — MISSING_VALIDATION — `RefundServiceImpl.java`
**No check for duplicate refund on same payment**  
A user can call `createRefund` multiple times for the same `paymentId`, each creating a new `REQUESTED` refund. Total refunded could exceed the payment amount.  
**Fix**: Check `refundRepository.findByPayment_Id(paymentId)` and sum existing refund amounts before allowing a new one.

---

## 15. CROSS-CUTTING

### #40 — 🟠 HIGH — BROKEN_FLOW — Project-wide
**20+ `catch (Exception ignored) {}` blocks with no logging**  
Across controllers and services: `PaymentServiceImpl` (6), `ParcelServiceImpl` (3), `ComplianceServiceImpl` (2), `InvoiceServiceImpl` (1), `DeliveryServiceImpl` (1), `AnalyticsServiceImpl` (1), etc.  
**Fix**: Replace every `catch (Exception ignored) {}` with at minimum `catch (Exception e) { log.warn("...", e); }`.

### #41 — 🟢 LOW — WRONG_LOGIC — `InvoiceServiceImpl.java` L85
**PDF generation exception silently ignored**
```java
} catch (Exception ignored) {
    // PDF generation should not block invoice creation
}
```
The invoice is created but the PDF isn't generated, and nobody knows.  
**Fix**: Log the error, set a flag like `pdfGenerated = false`.

### #42 — 🟢 LOW — INCOMPLETE — `AddressController.java` L135-140
**`toBigDecimal()` utility is incomplete (no closing brace visible)**
This is likely just a file-reading artifact, but the method at the end of the file may be truncated.  
**Fix**: Verify the source file is complete.

### #43 — 🟢 LOW — MISSING_VALIDATION — `PricingServiceImpl.java` L178-222
**Multiple `return null` instead of throwing**
```java
if (parcel == null) return null;
if (address == null) return null;
if (addressLine == null || addressLine.isBlank()) return null;
```
Callers must null-check every return. If they don't, NPE.  
**Fix**: Throw `ResourceNotFoundException` or return `Optional`.

### #44 — 🟢 LOW — INCOMPLETE — `CacheConfig.java`
**Generic cache configuration — no per-cache tuning**  
A single 10-minute TTL with 5000 max entries is applied globally. High-frequency caches (pricing) may need shorter TTL; low-frequency caches (tariffs) could have longer TTL.  
**Fix**: Define named cache managers with different configurations.

### #45 — 🟡 MEDIUM — MISSING_VALIDATION — `CourierServiceImpl.java`, `StaffServiceImpl.java`
**No `@Transactional` on create methods that write to 2 tables**  
`createCourier` saves to `CourierRepository` then `UserAccountRepository`. `createStaff` does the same. If the second save fails, you have an orphaned entity.  
**Fix**: Add `@Transactional` to both `createCourier` and `createStaff`.

### #46 — 🟡 MEDIUM — MISSING_VALIDATION — `ClientServiceImpl.java` L83-118
**`updateMyProfile` saves user and client separately without transaction**
```java
Objects.requireNonNull(userAccountRepository.save(user), ...);
// ... later ...
Client savedClient = clientRepository.save(client);
```
If the client save fails, the user's phone is already changed.  
**Fix**: Add `@Transactional`.

### #47 — 🟢 LOW — SECURITY — `AuthServiceImpl.java` L239
**`sendOtp` returns OTP in response body**
```java
public SendOtpResponse sendOtp(String phone) {
    String otp = otpService.generateOtp(phone, OtpPurpose.REGISTER);
    return SendOtpResponse.builder().otp(otp).build();
}
```
The OTP should be sent via SMS only — returning it in the HTTP response defeats the purpose.  
**Fix**: Remove `otp` from the `SendOtpResponse` in production (keep it only for dev/test environments).

### #48 — 🟢 LOW — INCOMPLETE — `QrSecurityServiceImpl.java` L66
**`maxVerificationsPerHour` is configured but never used**
```java
@SuppressWarnings("unused")
private final int maxVerificationsPerHour;
```
Rate limiting for QR verification is declared but not implemented.  
**Fix**: Implement the rate-limiting check in `verifyToken()`.

### #49 — 🟡 MEDIUM — WRONG_LOGIC — `ComplianceServiceImpl.java` L114
**Compliance report loads ALL alerts then filters in-memory**
```java
List<RiskAlert> all = riskAlertRepository.findAll();
```
Even for a 7-day report, this loads potentially years of alerts.  
**Fix**: Use `riskAlertRepository.findByCreatedAtBetween(fromInstant, toInstant)`.

### #50 — 🟡 MEDIUM — WRONG_LOGIC — `RefundServiceImpl.java` L90
**Refund amount check uses `double` comparison (`>`) — floating point math**
```java
if (request.getAmount() > payment.getAmount()) { ... }
```
Floating-point comparison for financial amounts is unreliable.  
**Fix**: Use `BigDecimal` for all financial amounts and `compareTo()`.

---

## Priority Action Items

### Immediate (blocks production safety)
1. **#20, #21, #22** — Remove or implement hardcoded fake endpoints (Finance, Risk)
2. **#4, #8** — Add `@Transactional` to `ParcelServiceImpl` and `PaymentServiceImpl`
3. **#9** — Fix payment amount defaulting to 0.0 on pricing failure
4. **#27** — Fix CORS wildcard fallback
5. **#28** — Add `@PreAuthorize` to 16+ unprotected controllers

### Short-term (data integrity / correctness)
6. **#12, #13** — Remove dead `null`-returning methods in `InvoiceServiceImpl`
7. **#14** — Fix `UUID.nameUUIDFromBytes()` misuse in invoice lookups
8. **#16, #17, #25, #26** — Replace `findAll().stream()` with targeted queries
9. **#18, #19, #36** — Fix UUID-as-Long parsing in Map/Location/Scan controllers
10. **#1** — Fix OTP validate-then-consume race condition
11. **#45, #46** — Add `@Transactional` to Courier, Staff, Client create/update methods

### Medium-term (robustness)
12. **#40** — Replace all `catch (Exception ignored) {}` with proper logging
13. **#2** — Add ownership check in `changePassword`
14. **#34** — Implement ownership validation in `ScanController`
15. **#39** — Add duplicate refund protection
16. **#47** — Stop returning OTP in response body (production)
17. **#50** — Migrate financial amounts to `BigDecimal`
