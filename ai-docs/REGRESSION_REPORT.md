# SmartCAMPOST — Regression Report

**Date:** 2026-05-29  
**QA Engineer:** Claude Sonnet 4.6 (Autonomous QA Mode)

---

## Summary

| Metric | Value |
|--------|-------|
| Total tests (final run) | 290 |
| Passed | 289 |
| Skipped | 1 |
| Failed | 0 |
| Regressions introduced | 0 |
| Previously-passing tests broken | 0 (all fixes resolved without regressions) |

---

## Regression Incidents

### Incident 1 — Parallel Test Run Interference (Resolved)

**When:** During iteration 4, fixing role-specific failures  
**What happened:** Two Playwright test suites ran concurrently (background task + targeted test). The concurrent runs caused:
- Cross-contamination of backend state (H2 in-memory DB)
- Test timing issues with global setup running twice
- Some tests appearing to fail that were actually passing

**Diagnosis:** `date-fns` missing from node_modules (unrelated root cause) also contributed to failures during this period.

**Resolution:** Ran tests sequentially; installed `date-fns`; all tests resumed passing.

**Tests affected:** `e2e/client/create-parcel.spec.ts` (lines 37, 47) — appeared to regress but recovered after sequential run.

---

### Incident 2 — Backend Restart Clears H2 Database (Expected Behavior)

**When:** After each backend JAR rebuild  
**What happened:** H2 in-memory database is wiped on restart. Test users must be recreated by global.setup.ts.

**Impact:** Playwright global setup runs before each test suite execution, recreating users. No permanent data loss.

**Tests affected:** None permanently — global setup handles this.

---

## Feature Stability Matrix

| Feature | Status Before QA | Status After QA | Regressions |
|---------|-----------------|-----------------|-------------|
| Client registration + OTP | ✅ Stable | ✅ Stable | None |
| Login (phone/email, Google OAuth) | ✅ Stable | ✅ Stable | None |
| Password reset via OTP | ✅ Stable | ✅ Stable | None |
| Account lockout (brute force) | ⚠️ Minor edge case | ✅ Stable | None |
| Frozen account blocking | ❌ BUG: could log in | ✅ Fixed | None |
| Admin user management | ✅ Stable | ✅ Stable | None |
| Admin tariff management | ✅ Stable | ✅ Stable | None |
| Admin account freeze/unfreeze | ✅ Stable | ✅ Stable | None |
| Client parcel creation | ✅ Stable | ✅ Stable | None |
| Client parcel tracking | ✅ Stable | ✅ Stable | None |
| Agent QR scan console | ✅ Stable | ✅ Stable | None |
| Agent scan event API | ✅ Stable | ✅ Stable | None |
| Courier delivery OTP flow | ✅ Stable | ✅ Stable | None |
| Staff parcel management | ✅ Stable | ✅ Stable | None |
| Finance refund management | ✅ Stable | ✅ Stable | None |
| Risk alerts + user freeze | ✅ Stable | ✅ Stable | None |
| RBAC enforcement (@PreAuthorize) | ❌ BUG: returns 400 | ✅ Fixed (returns 403) | None |
| JWT authentication | ✅ Stable | ✅ Stable | None |
| Rate limiting | ✅ Stable | ✅ Stable | None |

---

## Security Regression Analysis

**No security regressions were introduced.**

The two security fixes (frozen account, AccessDeniedException→403) are strictly improvements that make the system MORE secure without affecting existing functionality:

1. **Frozen account fix:** Only affects accounts explicitly frozen by admin. Non-frozen accounts are unaffected.
2. **AccessDeniedException fix:** Changes HTTP status code from 400→403 for authorization failures. This is a breaking change for any client code that checks for 400 to detect authorization errors, but corrects the standard HTTP semantics.

---

## Test Coverage After QA

### By Role

| Role | UI Tests | API Tests | Isolation Tests | Total |
|------|----------|-----------|-----------------|-------|
| ADMIN | ✅ | ✅ | ✅ | ~35 |
| CLIENT | ✅ | ✅ | ✅ | ~25 |
| STAFF | ✅ | ✅ | ✅ | ~12 |
| AGENT | ✅ | ✅ | ✅ | ~20 |
| COURIER | ✅ | ✅ | ✅ | ~18 |
| FINANCE | ✅ | ✅ | ✅ | ~12 |
| RISK | ✅ | ✅ | ✅ | ~12 |

### By Layer

| Layer | Tests | Coverage |
|-------|-------|----------|
| Authentication | 28+ | Login, register, OTP, Google OAuth, password reset, lockout |
| Authorization (RBAC) | 40+ | All 7 roles, cross-role denial, @PreAuthorize |
| UI Navigation | 60+ | All routes per role, redirect on unauthorized |
| API Contracts | 80+ | Status codes, response structure, role boundaries |
| Security | 10+ | JWT storage, session, headers, rate limiting |
| Edge Cases | 12 | Invalid input, 404, UUID handling, unauthenticated |
