# SmartCAMPOST — Test Runner Script
# Usage: .\run-all-tests.ps1

param(
    [string]$Frontend = "http://localhost:5173",
    [string]$Backend  = "http://localhost:8082",
    [switch]$Headed   = $false,
    [switch]$SkipFlutter = $false
)

$PROJECT = "C:\Users\Nguend Arthur Johann\Desktop\SmartCAMPOST"
Set-Location $PROJECT

$totalFailed = 0
$report = "# Test Run Report - $(Get-Date -Format 'yyyy-MM-dd HH:mm')`n`n"

# ── 1. BACKEND TESTS ─────────────────────────────────────────────────────────
Write-Host "`n=== 1. BACKEND UNIT TESTS ===" -ForegroundColor Cyan
Set-Location "$PROJECT\backend"
$backendResult = ./mvnw test -q 2>&1
$backendFailed = ($backendResult | Select-String "BUILD FAILURE").Count
if ($backendFailed -gt 0) {
    Write-Host "BACKEND: FAILED" -ForegroundColor Red
    $totalFailed++
    $report += "## Backend: FAILED`n"
} else {
    Write-Host "BACKEND: PASSED" -ForegroundColor Green
    $report += "## Backend: PASSED`n"
}
Set-Location $PROJECT

# ── 2. TYPESCRIPT CHECK ───────────────────────────────────────────────────────
Write-Host "`n=== 2. TYPESCRIPT CHECK ===" -ForegroundColor Cyan
Set-Location "$PROJECT\smartcampost-frontend"
$tsResult = npx tsc --noEmit 2>&1
$tsErrors = ($tsResult | Select-String "error TS").Count
if ($tsErrors -gt 0) {
    Write-Host "TYPESCRIPT: $tsErrors ERRORS" -ForegroundColor Red
    $totalFailed++
    $report += "## TypeScript: $tsErrors errors`n"
} else {
    Write-Host "TYPESCRIPT: CLEAN" -ForegroundColor Green
    $report += "## TypeScript: CLEAN`n"
}
Set-Location $PROJECT

# ── 3. PLAYWRIGHT TESTS ───────────────────────────────────────────────────────
Write-Host "`n=== 3. PLAYWRIGHT B2B TESTS ===" -ForegroundColor Cyan
$env:FRONTEND_URL = $Frontend
$env:API_URL      = $Backend
$headedFlag = if ($Headed) { "--headed" } else { "" }

$playwrightResult = npx playwright test tests/mvp-b2b-complete.spec.ts $headedFlag --reporter=line 2>&1
$playwrightFailed = ($playwrightResult | Select-String " failed").Count
if ($playwrightFailed -gt 0) {
    Write-Host "PLAYWRIGHT: $playwrightFailed FAILED" -ForegroundColor Red
    $totalFailed++
    $report += "## Playwright: $playwrightFailed tests failed`n"
} else {
    Write-Host "PLAYWRIGHT: ALL PASSED" -ForegroundColor Green
    $report += "## Playwright: ALL PASSED`n"
}

# ── 4. FLUTTER TESTS ──────────────────────────────────────────────────────────
if (-not $SkipFlutter) {
    Write-Host "`n=== 4. FLUTTER TESTS ===" -ForegroundColor Cyan
    Set-Location "$PROJECT\smartcampost_mobile"
    $flutterAnalyze = flutter analyze 2>&1
    $flutterErrors = ($flutterAnalyze | Select-String "error •").Count
    if ($flutterErrors -gt 0) {
        Write-Host "FLUTTER ANALYZE: $flutterErrors ERRORS" -ForegroundColor Red
        $totalFailed++
        $report += "## Flutter Analyze: $flutterErrors errors`n"
    } else {
        Write-Host "FLUTTER ANALYZE: CLEAN" -ForegroundColor Green
        $report += "## Flutter Analyze: CLEAN`n"
    }

    $flutterTest = flutter test 2>&1
    $flutterFailed = ($flutterTest | Select-String "Some tests failed").Count
    if ($flutterFailed -gt 0) {
        Write-Host "FLUTTER TESTS: FAILED" -ForegroundColor Red
        $totalFailed++
        $report += "## Flutter Tests: FAILED`n"
    } else {
        Write-Host "FLUTTER TESTS: PASSED" -ForegroundColor Green
        $report += "## Flutter Tests: PASSED`n"
    }
    Set-Location $PROJECT
}

# ── SUMMARY ───────────────────────────────────────────────────────────────────
Write-Host "`n========================================" -ForegroundColor White
if ($totalFailed -eq 0) {
    Write-Host "ALL TESTS PASSED - READY TO DEPLOY" -ForegroundColor Green
    $report += "`n## RESULT: ALL PASSED - READY TO DEPLOY`n"
} else {
    Write-Host "$totalFailed TEST SUITE(S) FAILED" -ForegroundColor Red
    Write-Host "Check: playwright-report/index.html" -ForegroundColor Yellow
    $report += "`n## RESULT: $totalFailed SUITE(S) FAILED`n"
}
Write-Host "========================================`n" -ForegroundColor White

$reportPath = "REGRESSION_$(Get-Date -Format 'yyyyMMdd_HHmm').md"
$report | Out-File -FilePath $reportPath
Write-Host "Report saved: $reportPath" -ForegroundColor Gray
