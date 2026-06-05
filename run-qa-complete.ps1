# ============================================================
# SmartCAMPOST — Full QA Runner
# Usage: .\run-qa-complete.ps1 [-Headed] [-SkipFlutter]
# ============================================================
param(
    [switch]$Headed      = $false,
    [switch]$SkipFlutter = $false,
    [string]$Frontend    = "http://localhost:5173",
    [string]$Backend     = "http://localhost:8082"
)

$PROJECT = "C:\Users\Nguend Arthur Johann\Desktop\SmartCAMPOST"
Set-Location $PROJECT
$timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$logDir    = "$PROJECT\qa-logs\$timestamp"
New-Item -ItemType Directory -Force $logDir | Out-Null
$report    = "# QA Run Report - $timestamp`n`n"
$failed    = 0

function Log($msg, $color = "White") {
    Write-Host $msg -ForegroundColor $color
    $script:report += "$msg`n"
}

Log "============================================================" Cyan
Log "  SmartCAMPOST Complete QA Suite — $timestamp" Cyan
Log "  Frontend: $Frontend" Cyan
Log "  Backend:  $Backend" Cyan
Log "============================================================" Cyan

# ── 0. Pre-flight: verify both servers are UP ─────────────────
Log "`n[PRE-FLIGHT] Checking servers..." Yellow
try {
    $health = Invoke-RestMethod -Uri "$Backend/actuator/health" -TimeoutSec 5
    if ($health.status -eq "UP") { Log "  Backend:  UP" Green }
    else { Log "  Backend:  DEGRADED ($($health.status))" Red; $failed++ }
} catch {
    Log "  Backend:  UNREACHABLE - is it running on $Backend ?" Red
    $failed++
}

try {
    $fe = Invoke-WebRequest -Uri "$Frontend" -TimeoutSec 5 -UseBasicParsing
    Log "  Frontend: UP ($($fe.StatusCode))" Green
} catch {
    Log "  Frontend: UNREACHABLE - is it running on $Frontend ?" Red
    $failed++
}

if ($failed -gt 0) {
    Log "`nPre-flight failed. Start both servers before running QA." Red
    exit 1
}

# ── 1. Backend Unit Tests ─────────────────────────────────────
Log "`n[PHASE 1] Backend Unit Tests..." Yellow
Set-Location "$PROJECT\backend"
$backendOut = ./mvnw.cmd test -q 2>&1 | Tee-Object "$logDir\backend.log"
$buildFail  = ($backendOut | Select-String "BUILD FAILURE").Count
if ($buildFail -gt 0) {
    Log "  FAILED — see $logDir\backend.log" Red; $failed++
    $testLine = $backendOut | Select-String "Tests run:" | Select-Object -Last 1
    Log "  $testLine" Red
} else {
    $testLine = $backendOut | Select-String "Tests run:" | Select-Object -Last 1
    Log "  PASSED — $testLine" Green
}
Set-Location $PROJECT

# ── 2. TypeScript Check ───────────────────────────────────────
Log "`n[PHASE 2] TypeScript Check..." Yellow
Set-Location "$PROJECT\smartcampost-frontend"
$tsOut    = npx tsc --noEmit 2>&1 | Tee-Object "$logDir\typescript.log"
$tsErrors = ($tsOut | Select-String "error TS").Count
if ($tsErrors -gt 0) {
    Log "  FAILED — $tsErrors TypeScript errors" Red; $failed++
    $tsOut | Select-String "error TS" | Select-Object -First 5 | ForEach-Object { Log "    $_" Red }
} else {
    Log "  PASSED — No TypeScript errors" Green
}
Set-Location $PROJECT

# ── 3. Flutter Analyze ────────────────────────────────────────
Log "`n[PHASE 3] Flutter Analysis..." Yellow
Set-Location "$PROJECT\smartcampost_mobile"
$flutterOut = flutter analyze 2>&1 | Tee-Object "$logDir\flutter-analyze.log"
$flutterErr = ($flutterOut | Select-String " error •").Count
if ($flutterErr -gt 0) {
    Log "  FAILED — $flutterErr Flutter errors" Red; $failed++
} else {
    Log "  PASSED — No Flutter errors" Green
}
Set-Location $PROJECT

# ── 4. Playwright Complete QA Suite ──────────────────────────
Log "`n[PHASE 4] Playwright Complete QA Suite..." Yellow
$env:FRONTEND_URL = $Frontend
$env:API_URL      = $Backend
$headedFlag = if ($Headed) { "--headed" } else { "" }

$maxRuns = 3
for ($run = 1; $run -le $maxRuns; $run++) {
    Log "  Run $run/$maxRuns..." White
    $pwOut = npx playwright test tests/qa-complete.spec.ts $headedFlag --reporter=line 2>&1 |
             Tee-Object "$logDir\playwright-run-$run.log"

    $failCount = 0
    $pwOut | Select-String "(\d+) failed" | ForEach-Object {
        if ($_ -match "(\d+) failed") { $failCount = [int]$Matches[1] }
    }

    if ($failCount -eq 0) {
        Log "  Run $run: ALL PASSED" Green; break
    } else {
        Log "  Run $run: $failCount failed — analyzing..." Yellow
        # Show first 10 failures
        $pwOut | Select-String "×|✘|FAILED" | Select-Object -First 10 | ForEach-Object { Log "    $_" Red }
        if ($run -lt $maxRuns) { Log "  Retrying..." Yellow }
        else { $failed++ }
    }
}

# ── 5. Flutter Integration Tests ─────────────────────────────
if (-not $SkipFlutter) {
    Log "`n[PHASE 5] Flutter Integration Tests..." Yellow
    $devices = flutter devices 2>&1 | Select-String "emulator|device"
    if ($devices) {
        Set-Location "$PROJECT\smartcampost_mobile"
        $flutterTest = flutter test integration_test/app_test.dart 2>&1 |
                       Tee-Object "$logDir\flutter-integration.log"
        $flutterFail = ($flutterTest | Select-String "Some tests failed|FAILED").Count
        if ($flutterFail -gt 0) { Log "  Flutter integration: FAILED" Red; $failed++ }
        else { Log "  Flutter integration: PASSED" Green }
        Set-Location $PROJECT
    } else {
        Log "  No emulator/device found - skipping Flutter integration tests" Yellow
        Log "  Run: emulator -avd Pixel_7_API_34 to start an emulator" Yellow
    }
}

# ── 6. Generate Report ────────────────────────────────────────
Log "`n============================================================" Cyan
if ($failed -eq 0) {
    Log "  RESULT: ALL SUITES PASSED ✅" Green
} else {
    Log "  RESULT: $failed SUITE(S) FAILED ❌" Red
    Log "  Logs:   $logDir" Yellow
    Log "  Report: playwright-report/index.html" Yellow
}
Log "============================================================" Cyan

$reportPath = "$PROJECT\QA_REPORT_$timestamp.md"
$report | Out-File -FilePath $reportPath -Encoding UTF8
Log "`nReport saved: $reportPath" Gray

# Open HTML report automatically
if (Test-Path "$PROJECT\playwright-report\index.html") {
    Start-Process "$PROJECT\playwright-report\index.html"
}

exit $failed
