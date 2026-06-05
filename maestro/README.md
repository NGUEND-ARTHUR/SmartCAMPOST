# SmartCAMPOST — Mobile E2E Automation (Maestro)

Complete mobile automation suite for the SmartCAMPOST Flutter app using **Maestro** — tests real app interaction on Android emulator or physical device.

## Prerequisites

1. **Maestro CLI** — install once:
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```
2. **Android emulator** running or real device connected (`adb devices`)
3. **SmartCAMPOST app** installed: `com.smartcampost.mobile`
   ```bash
   # From smartcampost_mobile directory:
   flutter build apk --debug
   adb install build/app/outputs/flutter-apk/app-debug.apk
   ```
4. **Backend** running on port 8082 (emulator uses `10.0.2.2:8082`)

## Quick Smoke Test

```bash
# Admin login
maestro test maestro/login_admin.yaml

# Client login
maestro test maestro/login_client.yaml
```

## Run Full Suite

```bash
# All flows (all roles + workflows + security + device)
./maestro/run_all.sh

# Single suite only
./maestro/run_all.sh 02_client
./maestro/run_all.sh 09_workflows
```

## Suite Structure

```
maestro/flows/
  00_guest/          Guest / unauthenticated flows (5 files)
  01_auth/           Login + logout for all 7 roles (10 files)
  02_client/         CLIENT workflows: dashboard, parcels, track, profile (7 files)
  03_agent/          AGENT workflows: dashboard, scan, validation (4 files)
  04_staff/          STAFF workflows: dashboard, parcels, analytics (3 files)
  05_courier/        COURIER workflows: pickups, deliveries, QR scan (4 files)
  06_admin/          ADMIN workflows: users, tariffs, parcels, analytics (5 files)
  07_finance/        FINANCE workflows: dashboard, payments, refunds (3 files)
  08_risk/           RISK workflows: dashboard, compliance alerts (3 files)
  09_workflows/      Cross-role journeys: admin→staff, client lifecycle (4 files)
  10_security/       Session, role isolation, permission boundaries (4 files)
  11_device/         Background/foreground, offline, navigation, crash recovery (4 files)
```

**Total: 56 flow files** across 12 categories.

## Role Credentials

| Role    | Phone           | Password              | Dashboard         |
|---------|----------------|-----------------------|-------------------|
| ADMIN   | +237690000000  | Admin@SmartCAMPOST2026 | Admin Dashboard  |
| CLIENT  | +237699000001  | Test123!Client        | Dashboard         |
| STAFF   | +237699000002  | Test123!Staff         | Staff Dashboard   |
| AGENT   | +237699000003  | Test123!Agent         | Agent Dashboard   |
| COURIER | +237699000004  | Test123!Courier       | Courier Dashboard |
| FINANCE | +237699000005  | Test123!Finance       | Finance Dashboard |
| RISK    | +237699000006  | Test123!Risk          | Risk Dashboard    |

## Coverage

| Requirement                          | Covered By                                   |
|--------------------------------------|----------------------------------------------|
| App launch / splash                  | `00_guest/01_splash_and_launch.yaml`         |
| Login form validation                | `00_guest/02_login_form_validation.yaml`     |
| Registration form                    | `00_guest/03_registration_form.yaml`         |
| OTP login flow                       | `00_guest/05_otp_login_screen.yaml`          |
| All 7 role logins                    | `01_auth/01–07_login_*.yaml`                 |
| Invalid credential handling          | `01_auth/08_invalid_login_attempts.yaml`     |
| Logout / re-login cycle              | `01_auth/09_logout_relogin_cycle.yaml`       |
| Session persistence (background)     | `01_auth/10_session_persistence.yaml`        |
| CLIENT full CRUD                     | `02_client/01–04_*.yaml`                     |
| Role-specific navigation enforcement | `*/0X_forbidden_screens.yaml` (all roles)    |
| Admin creates internal users         | `09_workflows/01_admin_creates_staff_user`   |
| Cross-role data visibility           | `09_workflows/04_cross_role_data_visibility` |
| Parcel lifecycle (client→agent)      | `09_workflows/02–03_*.yaml`                  |
| Role isolation                       | `10_security/02_role_isolation.yaml`         |
| Permission boundaries                | `10_security/03_permission_boundaries.yaml`  |
| Duplicate submission prevention      | `10_security/04_duplicate_submission.yaml`   |
| Background / foreground              | `11_device/01_background_foreground.yaml`    |
| Offline / network failure            | `11_device/02_offline_and_network_failure`   |
| Navigation stack integrity           | `11_device/03_navigation_stack_and_back`     |
| Crash / error recovery               | `11_device/04_crash_and_error_recovery`      |

## Run Individual Flow

```bash
maestro test maestro/flows/02_client/01_dashboard.yaml
maestro test maestro/flows/09_workflows/04_cross_role_data_visibility.yaml
```

## Debug a Failing Flow

```bash
# Interactive Studio (live view while running)
maestro studio

# Verbose output
maestro test --debug maestro/flows/01_auth/01_login_admin.yaml
```

## Screenshots

Screenshots are saved to the device's `Pictures/Maestro/` folder during each run. Pull them with:
```bash
adb pull /sdcard/Pictures/Maestro ./maestro/screenshots/
```
