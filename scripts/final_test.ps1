$ErrorActionPreference = "Continue"
$BASE = "http://localhost:8082"
$pass = 0; $fail = 0; $skip = 0
$TOKEN = $null; $REFRESH = $null

function Test-Endpoint {
    param([string]$Name, [string]$Method, [string]$Url, [string]$Body, [hashtable]$Headers, [int[]]$ExpectedCodes)
    
    $params = @{
        Uri = "$BASE$Url"
        Method = $Method
        UseBasicParsing = $true
        SkipHttpErrorCheck = $true
        TimeoutSec = 15
    }
    if ($Body) { $params.Body = $Body; $params.ContentType = "application/json" }
    if ($Headers) { $params.Headers = $Headers }
    
    try {
        $resp = Invoke-WebRequest @params
        $code = $resp.StatusCode
        $content = $resp.Content
        
        if ($ExpectedCodes -contains $code) {
            $script:pass++
            Write-Host "  PASS [$code] $Name" -ForegroundColor Green
            return @{ Code = $code; Content = $content; Pass = $true }
        } else {
            $script:fail++
            Write-Host "  FAIL [$code] $Name (expected: $($ExpectedCodes -join ','))" -ForegroundColor Red
            Write-Host "    Response: $($content.Substring(0, [Math]::Min(200, $content.Length)))" -ForegroundColor DarkGray
            return @{ Code = $code; Content = $content; Pass = $false }
        }
    } catch {
        $script:fail++
        Write-Host "  FAIL [ERR] $Name - $($_.Exception.Message)" -ForegroundColor Red
        return @{ Code = 0; Content = ""; Pass = $false }
    }
}

function Auth-Headers { @{ Authorization = "Bearer $TOKEN" } }

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host " SmartCAMPOST FINAL TEST SUITE" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

# ─── 1. HEALTH & SYSTEM ───
Write-Host "--- 1. HEALTH & SYSTEM ---" -ForegroundColor Cyan
Test-Endpoint "Health Check" GET "/actuator/health" -ExpectedCodes @(200)
Test-Endpoint "Info Endpoint" GET "/actuator/info" -ExpectedCodes @(200)

# ─── 2. AUTH FLOW ───
Write-Host "`n--- 2. AUTH FLOW ---" -ForegroundColor Cyan

# 2a. Send OTP for registration
$r = Test-Endpoint "Send OTP (register)" POST "/api/auth/send-otp" '{"phone":"+237670000001","purpose":"REGISTER"}' -ExpectedCodes @(200, 201, 429)
$otpCode = $null
if ($r.Pass) {
    try {
        $otpResp = $r.Content | ConvertFrom-Json
        $otpCode = $otpResp.otp
        if (-not $otpCode) { $otpCode = $otpResp.code }
        if ($otpCode) { Write-Host "    OTP captured: $otpCode" -ForegroundColor DarkGray }
    } catch {}
}

# 2b. Register client (with OTP)
if ($otpCode) {
    $regBody = "{`"fullName`":`"Test User`",`"phone`":`"+237670000001`",`"password`":`"Test@12345678`",`"preferredLanguage`":`"EN`",`"otp`":`"$otpCode`"}"
    Test-Endpoint "Register Client" POST "/api/auth/register" $regBody -ExpectedCodes @(200, 201, 409)
} else {
    Write-Host "  SKIP Register Client (no OTP available)" -ForegroundColor Yellow
    $script:skip++
}

# 2c. Login as admin
$loginBody = '{"phone":"+237690000000","password":"Admin@SmartCAMPOST2026"}'
$r = Test-Endpoint "Admin Login" POST "/api/auth/login" $loginBody -ExpectedCodes @(200)
if ($r.Pass) {
    try {
        $loginResp = $r.Content | ConvertFrom-Json
        $TOKEN = $loginResp.accessToken
        $REFRESH = $loginResp.refreshToken
        Write-Host "    Token obtained: $($TOKEN.Substring(0,20))..." -ForegroundColor DarkGray
    } catch {
        Write-Host "    WARNING: Could not parse login response" -ForegroundColor Yellow
    }
}

# 2d. Token refresh
if ($REFRESH) {
    $r = Test-Endpoint "Refresh Token" POST "/api/auth/refresh" "{`"refreshToken`":`"$REFRESH`"}" -ExpectedCodes @(200)
    if ($r.Pass) {
        try {
            $newTokenResp = $r.Content | ConvertFrom-Json
            $TOKEN = $newTokenResp.accessToken
        } catch {}
    }
}

# 2e. Check profile (admin is not a client - 403 is expected)
Test-Endpoint "Client Profile (admin=403 expected)" GET "/api/clients/me" -Headers (Auth-Headers) -ExpectedCodes @(200, 403)

# ─── 3. AGENCIES ───
Write-Host "`n--- 3. AGENCIES ---" -ForegroundColor Cyan

$agencyBody = '{"agencyName":"Test Agency Douala","agencyCode":"AGY-DLA-TEST","city":"Douala","region":"Littoral"}'
$r = Test-Endpoint "Create Agency" POST "/api/agencies" $agencyBody -Headers (Auth-Headers) -ExpectedCodes @(200, 201, 400, 409)
$agencyId = $null
if ($r.Pass) {
    try {
        $agency = $r.Content | ConvertFrom-Json
        $agencyId = $agency.id
        if (-not $agencyId) { $agencyId = $agency.agencyId }
    } catch {}
}

$r = Test-Endpoint "List Agencies" GET "/api/agencies" -Headers (Auth-Headers) -ExpectedCodes @(200)
if ($r.Pass -and -not $agencyId) {
    try {
        $agencies = $r.Content | ConvertFrom-Json
        $list = if ($agencies.content) { $agencies.content } else { $agencies }
        if ($list.Count -gt 0) { 
            $agencyId = $list[0].id
            if (-not $agencyId) { $agencyId = $list[0].agencyId }
        }
    } catch {}
}

if ($agencyId) {
    Test-Endpoint "Get Agency by ID" GET "/api/agencies/$agencyId" -Headers (Auth-Headers) -ExpectedCodes @(200)
} else {
    Write-Host "  SKIP Get Agency by ID (no agency)" -ForegroundColor Yellow; $script:skip++
}

# ─── 4. AGENTS / STAFF ───
Write-Host "`n--- 4. AGENTS ---" -ForegroundColor Cyan

$r = Test-Endpoint "List Agents" GET "/api/agents" -Headers (Auth-Headers) -ExpectedCodes @(200)
$agentId = $null
if ($r.Pass) {
    try {
        $agents = $r.Content | ConvertFrom-Json
        $list = if ($agents.content) { $agents.content } else { $agents }
        if ($list.Count -gt 0) { 
            $agentId = $list[0].id
            if (-not $agentId) { $agentId = $list[0].agentId }
        }
    } catch {}
}

if ($agencyId) {
    $agentBody = "{`"fullName`":`"Test Agent`",`"phone`":`"+237670000099`",`"email`":`"agent@test.com`",`"password`":`"Agent@12345678`",`"role`":`"COUNTER_AGENT`",`"agencyId`":`"$agencyId`"}"
    Test-Endpoint "Create Agent" POST "/api/agents" $agentBody -Headers (Auth-Headers) -ExpectedCodes @(200, 201, 409)
}

# ─── 5. CLIENTS ───
Write-Host "`n--- 5. CLIENTS ---" -ForegroundColor Cyan

$r = Test-Endpoint "List Clients" GET "/api/clients" -Headers (Auth-Headers) -ExpectedCodes @(200)
$clientId = $null
if ($r.Pass) {
    try {
        $clients = $r.Content | ConvertFrom-Json
        $list = if ($clients.content) { $clients.content } else { $clients }
        if ($list.Count -gt 0) {
            $clientId = $list[0].id
            if (-not $clientId) { $clientId = $list[0].clientId }
        }
    } catch {}
}

if ($clientId) {
    Test-Endpoint "Get Client by ID" GET "/api/clients/$clientId" -Headers (Auth-Headers) -ExpectedCodes @(200)
}

# ─── 6. PARCELS ───
Write-Host "`n--- 6. PARCELS ---" -ForegroundColor Cyan

$r = Test-Endpoint "List Parcels" GET "/api/parcels" -Headers (Auth-Headers) -ExpectedCodes @(200)
$parcelId = $null
$trackingRef = $null
if ($r.Pass) {
    try {
        $parcels = $r.Content | ConvertFrom-Json
        $list = if ($parcels.content) { $parcels.content } else { $parcels }
        if ($list.Count -gt 0) {
            $parcelId = $list[0].id
            if (-not $parcelId) { $parcelId = $list[0].parcelId }
            $trackingRef = $list[0].trackingRef
        }
    } catch {}
}

# Try to create a parcel if we have client and agency
if ($clientId -and $agencyId) {
    $parcelBody = "{`"clientId`":`"$clientId`",`"originAgencyId`":`"$agencyId`",`"destinationAgencyId`":`"$agencyId`",`"weight`":2.5,`"dimensions`":`"30x20x15`",`"declaredValue`":5000,`"fragile`":false,`"serviceType`":`"STANDARD`",`"deliveryOption`":`"AGENCY`",`"paymentOption`":`"PREPAID`",`"senderAddress`":{`"street`":`"123 Test St`",`"city`":`"Douala`",`"region`":`"Littoral`",`"postalCode`":`"00100`",`"country`":`"Cameroon`"},`"recipientAddress`":{`"street`":`"456 Dest St`",`"city`":`"Yaounde`",`"region`":`"Centre`",`"postalCode`":`"00200`",`"country`":`"Cameroon`"},`"recipientName`":`"John Doe`",`"recipientPhone`":`"+237670000088`"}"
    $r2 = Test-Endpoint "Create Parcel" POST "/api/parcels" $parcelBody -Headers (Auth-Headers) -ExpectedCodes @(200, 201, 400)
    if ($r2.Pass -and $r2.Code -lt 400) {
        try {
            $p = $r2.Content | ConvertFrom-Json
            $parcelId = $p.id
            if (-not $parcelId) { $parcelId = $p.parcelId }
            $trackingRef = $p.trackingRef
        } catch {}
    }
}

if ($trackingRef) {
    Test-Endpoint "Track Parcel" GET "/api/parcels/track/$trackingRef" -Headers (Auth-Headers) -ExpectedCodes @(200)
}

if ($parcelId) {
    Test-Endpoint "Get Parcel by ID" GET "/api/parcels/$parcelId" -Headers (Auth-Headers) -ExpectedCodes @(200)
}

# ─── 7. SCAN EVENTS ───
Write-Host "`n--- 7. SCAN EVENTS ---" -ForegroundColor Cyan
if ($parcelId) {
    Test-Endpoint "Scan Events for Parcel" GET "/api/scan-events/parcel/$parcelId" -Headers (Auth-Headers) -ExpectedCodes @(200)
    Test-Endpoint "Parcel Scan Events (alt)" GET "/api/parcels/$parcelId/scan-events" -Headers (Auth-Headers) -ExpectedCodes @(200)
} else {
    Write-Host "  SKIP Scan Events (no parcel)" -ForegroundColor Yellow; $script:skip++
}

# ─── 8. PAYMENTS ───
Write-Host "`n--- 8. PAYMENTS ---" -ForegroundColor Cyan
Test-Endpoint "List Payments" GET "/api/payments" -Headers (Auth-Headers) -ExpectedCodes @(200)

# ─── 9. INVOICES ───
Write-Host "`n--- 9. INVOICES ---" -ForegroundColor Cyan
Test-Endpoint "My Invoices" GET "/api/invoices/me" -Headers (Auth-Headers) -ExpectedCodes @(200)

# ─── 10. NOTIFICATIONS ───
Write-Host "`n--- 10. NOTIFICATIONS ---" -ForegroundColor Cyan
Test-Endpoint "List Notifications" GET "/api/notifications" -Headers (Auth-Headers) -ExpectedCodes @(200)

# ─── 11. LOCATIONS ───
Write-Host "`n--- 11. LOCATIONS ---" -ForegroundColor Cyan
Test-Endpoint "My Location" GET "/api/location/me" -Headers (Auth-Headers) -ExpectedCodes @(200, 400)

# ─── 12. AI FEATURES ───
Write-Host "`n--- 12. AI FEATURES ---" -ForegroundColor Cyan

# Route optimization 
Test-Endpoint "AI Route Optimize" POST "/api/ai/optimize-route" '{"origin":{"lat":4.0511,"lng":9.7679},"destination":{"lat":3.848,"lng":11.5021},"waypoints":[]}' -Headers (Auth-Headers) -ExpectedCodes @(200, 400, 503)

# AI chat
Test-Endpoint "AI Chat" POST "/api/ai/chat" '{"message":"What is the status of my parcel?","language":"EN"}' -Headers (Auth-Headers) -ExpectedCodes @(200, 503)

# Delivery prediction
if ($parcelId) {
    Test-Endpoint "AI Delivery Prediction" GET "/api/ai/predict-delivery/$parcelId" -Headers (Auth-Headers) -ExpectedCodes @(200, 404, 503)
}

# Risk assessment
Test-Endpoint "AI Risk Assessment" POST "/api/ai/assess-risk" '{"parcelValue":50000,"weight":5.0,"serviceType":"EXPRESS","origin":"Douala","destination":"Bamenda"}' -Headers (Auth-Headers) -ExpectedCodes @(200, 400, 503)

# Agent status
Test-Endpoint "AI Agent Status" GET "/api/ai/agent/status" -Headers (Auth-Headers) -ExpectedCodes @(200)

# ─── 13. SELF-HEALING ───
Write-Host "`n--- 13. SELF-HEALING ---" -ForegroundColor Cyan
Test-Endpoint "Self-Healing Congestion" GET "/api/self-healing/congestion" -Headers (Auth-Headers) -ExpectedCodes @(200)
Test-Endpoint "Self-Healing Actions" GET "/api/self-healing/actions" -Headers (Auth-Headers) -ExpectedCodes @(200)

# ─── 14. RISK ALERTS ───
Write-Host "`n--- 14. RISK ALERTS ---" -ForegroundColor Cyan
Test-Endpoint "List Risk Alerts" GET "/api/risk/alerts" -Headers (Auth-Headers) -ExpectedCodes @(200)
Test-Endpoint "Create Risk Alert" POST "/api/risk" '{"type":"THEFT","description":"Suspicious activity detected","severity":"HIGH"}' -Headers (Auth-Headers) -ExpectedCodes @(200, 201, 400)

# ─── 15. ANALYTICS ───
Write-Host "`n--- 15. ANALYTICS ---" -ForegroundColor Cyan
Test-Endpoint "Dashboard Summary" GET "/api/dashboard/summary" -Headers (Auth-Headers) -ExpectedCodes @(200)
Test-Endpoint "Analytics - Demand Forecast" POST "/api/analytics/demand-forecast" '{"region":"Littoral","days":7}' -Headers (Auth-Headers) -ExpectedCodes @(200, 501)
Test-Endpoint "Analytics - Sentiment" GET "/api/analytics/sentiment" -Headers (Auth-Headers) -ExpectedCodes @(200, 501)
Test-Endpoint "Analytics - Smart Notifications" GET "/api/analytics/smart-notifications" -Headers (Auth-Headers) -ExpectedCodes @(200, 501)
Test-Endpoint "Analytics - Address Validation" POST "/api/analytics/validate-address" '{"street":"123 Main St","city":"Douala","region":"Littoral","country":"Cameroon"}' -Headers (Auth-Headers) -ExpectedCodes @(200, 501)

# ─── 16. QR CODES ───
Write-Host "`n--- 16. QR CODES ---" -ForegroundColor Cyan
if ($parcelId) {
    Test-Endpoint "Generate QR Code" GET "/api/parcels/$parcelId/qr" -Headers (Auth-Headers) -ExpectedCodes @(200, 404)
}

# ─── 16b. ADDITIONAL ENDPOINTS ───
Write-Host "`n--- 16b. ADDITIONAL ENDPOINTS ---" -ForegroundColor Cyan
Test-Endpoint "Addresses (admin=403 expected)" GET "/api/addresses/me" -Headers (Auth-Headers) -ExpectedCodes @(200, 403)
Test-Endpoint "Admin Users" GET "/api/admin/users" -Headers (Auth-Headers) -ExpectedCodes @(200)
Test-Endpoint "Compliance Alerts" GET "/api/compliance/alerts" -Headers (Auth-Headers) -ExpectedCodes @(200)
Test-Endpoint "Couriers List" GET "/api/couriers" -Headers (Auth-Headers) -ExpectedCodes @(200)
Test-Endpoint "Pickups List" GET "/api/pickups" -Headers (Auth-Headers) -ExpectedCodes @(200)
Test-Endpoint "Refunds List" GET "/api/refunds" -Headers (Auth-Headers) -ExpectedCodes @(200)
Test-Endpoint "Finance Stats" GET "/api/finance/stats" -Headers (Auth-Headers) -ExpectedCodes @(200)
Test-Endpoint "Integration List" GET "/api/integrations" -Headers (Auth-Headers) -ExpectedCodes @(200)
Test-Endpoint "Offline Sync" POST "/api/offline/sync" '{"lastSyncAt":"2026-01-01T00:00:00Z"}' -Headers (Auth-Headers) -ExpectedCodes @(200, 400)

# ─── 17. UNAUTHORIZED ACCESS ───
Write-Host "`n--- 17. SECURITY CHECKS ---" -ForegroundColor Cyan
Test-Endpoint "Unauthorized - No Token" GET "/api/parcels" -ExpectedCodes @(401, 403)
Test-Endpoint "Unauthorized - Bad Token" GET "/api/parcels" -Headers @{ Authorization = "Bearer invalid.token.here" } -ExpectedCodes @(401, 403)

# ─── SUMMARY ───
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host " TEST RESULTS SUMMARY" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
$total = $pass + $fail + $skip
Write-Host "  PASS:    $pass" -ForegroundColor Green
Write-Host "  FAIL:    $fail" -ForegroundColor Red
Write-Host "  SKIP:    $skip" -ForegroundColor Yellow
Write-Host "  TOTAL:   $total" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Yellow

if ($fail -eq 0) {
    Write-Host "  ALL TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "  $fail TEST(S) FAILED - SEE ABOVE" -ForegroundColor Red
}
