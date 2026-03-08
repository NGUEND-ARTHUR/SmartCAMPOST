########################################################################
# SmartCAMPOST AI Features E2E Test
########################################################################
$ErrorActionPreference = "Continue"
$BASE = "http://localhost:8082"
$pass = 0; $fail = 0; $total = 0

function Test-AI {
    param([string]$Name, [scriptblock]$Block)
    $script:total++
    try {
        $result = & $Block
        Write-Host "  PASS  $Name"
        $script:pass++
        return $result
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $detail = ""
        try { $detail = $_.ErrorDetails.Message } catch {}
        if ($detail.Length -gt 200) { $detail = $detail.Substring(0,200) + "..." }
        Write-Host "  FAIL  $Name -> HTTP $status : $detail"
        $script:fail++
        return $null
    }
}

Write-Host "========================================"
Write-Host " SmartCAMPOST AI FEATURES E2E TEST"
Write-Host "========================================"

# ---- SETUP: Admin login ----
Write-Host "`n--- SETUP ---"
$adminLogin = Invoke-RestMethod -Uri "$BASE/api/auth/login" -Method POST -ContentType "application/json" -Body '{"phone":"+237690000000","password":"Admin@SmartCAMPOST2026"}'
$adminToken = $adminLogin.accessToken
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
Write-Host "  Admin token obtained"

# Register a test client
$rndPhone = "+2376935" + (Get-Random -Minimum 1000 -Maximum 9999).ToString()
$otpResp = Invoke-RestMethod -Uri "$BASE/api/auth/send-otp" -Method POST -ContentType "application/json" -Body "{`"phone`":`"$rndPhone`"}"
$regBody = @{ fullName="AI Test Client"; phone=$rndPhone; email="aitest@test.cm"; preferredLanguage="en"; password="AiTest@2026!"; otp=$otpResp.otp } | ConvertTo-Json
Invoke-RestMethod -Uri "$BASE/api/auth/register" -Method POST -ContentType "application/json" -Body $regBody | Out-Null
$clientLogin = Invoke-RestMethod -Uri "$BASE/api/auth/login" -Method POST -ContentType "application/json" -Body "{`"phone`":`"$rndPhone`",`"password`":`"AiTest@2026!`"}"
$clientToken = $clientLogin.accessToken
$clientHeaders = @{ Authorization = "Bearer $clientToken" }
Write-Host "  Client token obtained ($rndPhone)"

# Create agencies, addresses, parcel
$ag1 = Invoke-RestMethod -Uri "$BASE/api/agencies" -Method POST -ContentType "application/json" -Headers $adminHeaders -Body '{"agencyName":"AI Douala HQ","agencyCode":"AIDLA001","city":"Douala","region":"Littoral"}'
$ag2 = Invoke-RestMethod -Uri "$BASE/api/agencies" -Method POST -ContentType "application/json" -Headers $adminHeaders -Body '{"agencyName":"AI Yaounde HQ","agencyCode":"AIYDE001","city":"Yaounde","region":"Centre"}'
$addr1 = Invoke-RestMethod -Uri "$BASE/api/addresses" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body '{"label":"AI Sender","street":"1 AI St","city":"Douala","region":"Littoral","country":"Cameroon","latitude":4.0511,"longitude":9.7679}'
$addr2 = Invoke-RestMethod -Uri "$BASE/api/addresses" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body '{"label":"AI Recipient","street":"2 AI Ave","city":"Yaounde","region":"Centre","country":"Cameroon","latitude":3.848,"longitude":11.5021}'

$parcelBody = @{ senderAddressId=$addr1.id; recipientAddressId=$addr2.id; originAgencyId=$ag1.id; destinationAgencyId=$ag2.id; weight=3.5; dimensions="30x20x15"; declaredValue=50000; fragile=$false; serviceType="EXPRESS"; deliveryOption="AGENCY"; paymentOption="PREPAID"; descriptionComment="AI test parcel" } | ConvertTo-Json
$parcel = Invoke-RestMethod -Uri "$BASE/api/parcels" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body $parcelBody

# Validate parcel
$valBody = @{ latitude=4.0511; longitude=9.7679; descriptionConfirmed=$true; validatedWeight=3.5; locationSource="GPS" } | ConvertTo-Json
Invoke-RestMethod -Uri "$BASE/api/parcels/$($parcel.id)/validate" -Method PATCH -ContentType "application/json" -Headers $adminHeaders -Body $valBody | Out-Null

# Pay for parcel
$payInit = Invoke-RestMethod -Uri "$BASE/api/payments/init" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body "{`"parcelId`":`"$($parcel.id)`",`"method`":`"CASH`"}"
Invoke-RestMethod -Uri "$BASE/api/payments/confirm" -Method POST -ContentType "application/json" -Headers $adminHeaders -Body "{`"paymentId`":`"$($payInit.id)`",`"success`":true}" | Out-Null
Write-Host "  Parcel $($parcel.id) created, validated, paid"
Write-Host "  Tracking: $($parcel.trackingNumber)"

########################################################################
# FLOW 1: AI Route Optimization
########################################################################
Write-Host "`n--- FLOW 1: AI Route Optimization ---"

Test-AI "1.1 Optimize route (3 stops, BALANCED)" {
    $body = @{
        stops = @(
            @{ id="s1"; type="PICKUP"; latitude=4.0511; longitude=9.7679; address="Douala"; priority=1 },
            @{ id="s2"; type="DELIVERY"; latitude=3.848; longitude=11.5021; address="Yaounde"; priority=2 },
            @{ id="s3"; type="DELIVERY"; latitude=5.9631; longitude=10.1591; address="Bamenda"; priority=3 }
        )
        courierLat = 4.06; courierLng = 9.75
        optimizationStrategy = "BALANCED"
    } | ConvertTo-Json -Depth 5
    $r = Invoke-RestMethod -Uri "$BASE/api/ai/optimize-route" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body $body
    if (-not $r.optimizedRoute -or $r.optimizedRoute.Count -eq 0) { throw "Empty route" }
    Write-Host "    -> stops=$($r.optimizedRoute.Count), dist=$($r.totalDistanceKm)km, fuel=$($r.fuelSavingsPercent)%"
}

Test-AI "1.2 Optimize route (SHORTEST strategy)" {
    $body = @{
        stops = @(
            @{ id="a1"; type="PICKUP"; latitude=4.0511; longitude=9.7679; priority=1 },
            @{ id="a2"; type="DELIVERY"; latitude=4.1; longitude=9.8; priority=2 }
        )
        courierLat = 4.05; courierLng = 9.76
        optimizationStrategy = "SHORTEST"
    } | ConvertTo-Json -Depth 5
    $r = Invoke-RestMethod -Uri "$BASE/api/ai/optimize-route" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body $body
    if ($r.totalDistanceKm -le 0) { throw "Invalid distance" }
}

Test-AI "1.3 Optimize route (FASTEST strategy)" {
    $body = @{
        stops = @(
            @{ id="b1"; type="PICKUP"; latitude=4.0511; longitude=9.7679; priority=2 },
            @{ id="b2"; type="DELIVERY"; latitude=5.9631; longitude=10.1591; priority=1 }
        )
        optimizationStrategy = "FASTEST"
    } | ConvertTo-Json -Depth 5
    $r = Invoke-RestMethod -Uri "$BASE/api/ai/optimize-route" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body $body
    if ($r.estimatedDurationMinutes -le 0) { throw "Invalid duration" }
}

########################################################################
# FLOW 2: AI Chatbot (Knowledge-based)
########################################################################
Write-Host "`n--- FLOW 2: AI Chatbot ---"

Test-AI "2.1 Chat - track parcel (EN)" {
    $body = '{"message":"How can I track my parcel?","language":"en"}'
    $r = Invoke-RestMethod -Uri "$BASE/api/ai/chat" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body $body
    if (-not $r.message) { throw "Empty response" }
    Write-Host "    -> intent=$($r.intent), confidence=$($r.confidence)"
}

Test-AI "2.2 Chat - pricing question (EN)" {
    $body = '{"message":"What is the price for a 5kg parcel?","language":"en"}'
    $r = Invoke-RestMethod -Uri "$BASE/api/ai/chat" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body $body
    if (-not $r.message) { throw "Empty response" }
    Write-Host "    -> intent=$($r.intent)"
}

Test-AI "2.3 Chat - French language" {
    $body = '{"message":"Comment suivre mon colis?","language":"fr"}'
    $r = Invoke-RestMethod -Uri "$BASE/api/ai/chat" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body $body
    if (-not $r.message) { throw "Empty response" }
    Write-Host "    -> intent=$($r.intent)"
}

Test-AI "2.4 Chat - greeting" {
    $body = '{"message":"Hello!","language":"en"}'
    $r = Invoke-RestMethod -Uri "$BASE/api/ai/chat" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body $body
    if (-not $r.message) { throw "Empty response" }
    Write-Host "    -> intent=$($r.intent)"
}

Test-AI "2.5 Chat - delivery info" {
    $body = '{"message":"How long does delivery take?","language":"en"}'
    $r = Invoke-RestMethod -Uri "$BASE/api/ai/chat" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body $body
    if (-not $r.message) { throw "Empty response" }
    Write-Host "    -> intent=$($r.intent)"
}

Test-AI "2.6 Chat - payment question" {
    $body = '{"message":"What payment methods do you accept?","language":"en"}'
    $r = Invoke-RestMethod -Uri "$BASE/api/ai/chat" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body $body
    if (-not $r.message) { throw "Empty response" }
    Write-Host "    -> intent=$($r.intent)"
}

Test-AI "2.7 Chat - help" {
    $body = '{"message":"help","language":"en"}'
    $r = Invoke-RestMethod -Uri "$BASE/api/ai/chat" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body $body
    if (-not $r.message) { throw "Empty response" }
    Write-Host "    -> intent=$($r.intent), suggestions=$($r.suggestions.Count)"
}

Test-AI "2.8 Chat stream endpoint" {
    $r = Invoke-WebRequest -Uri "$BASE/api/ai/chat/stream" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body '{"message":"What services do you offer?","language":"en"}' -UseBasicParsing
    if ($r.StatusCode -ne 200) { throw "Non-200 status" }
    Write-Host "    -> streamed $($r.Content.Length) chars"
}

########################################################################
# FLOW 3: Delivery Time Prediction
########################################################################
Write-Host "`n--- FLOW 3: Delivery Prediction ---"

Test-AI "3.1 Predict EXPRESS delivery" {
    $body = '{"originLat":4.0511,"originLng":9.7679,"destinationLat":3.848,"destinationLng":11.5021,"serviceType":"EXPRESS","weight":3.5}'
    $r = Invoke-RestMethod -Uri "$BASE/api/ai/predict-delivery" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body $body
    if (-not $r.estimatedDeliveryDate) { throw "No delivery date" }
    Write-Host "    -> date=$($r.estimatedDeliveryDate), confidence=$($r.confidenceScore)"
}

Test-AI "3.2 Predict STANDARD delivery" {
    $body = '{"originLat":4.0511,"originLng":9.7679,"destinationLat":5.9631,"destinationLng":10.1591,"serviceType":"STANDARD","weight":10}'
    $r = Invoke-RestMethod -Uri "$BASE/api/ai/predict-delivery" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body $body
    if (-not $r.estimatedDeliveryDate) { throw "No delivery date" }
    Write-Host "    -> date=$($r.estimatedDeliveryDate), confidence=$($r.confidenceScore)"
}

########################################################################
# FLOW 4: ETA Prediction (Analytics)
########################################################################
Write-Host "`n--- FLOW 4: Analytics ETA ---"

Test-AI "4.1 ETA for parcel" {
    $r = Invoke-RestMethod -Uri "$BASE/api/analytics/parcels/$($parcel.id)/eta" -Method GET -Headers $clientHeaders
    Write-Host "    -> predictedAt=$($r.predictedDeliveryAt), confidence=$($r.confidenceScore)"
}

########################################################################
# FLOW 5: Payment Anomaly Detection
########################################################################
Write-Host "`n--- FLOW 5: Payment Anomaly Detection ---"

Test-AI "5.1 Check payment anomaly" {
    $r = Invoke-RestMethod -Uri "$BASE/api/analytics/payments/$($payInit.id)/anomaly" -Method GET -Headers $adminHeaders
    Write-Host "    -> anomalous=$($r.anomalous), score=$($r.anomalyScore)"
}

########################################################################
# FLOW 6: Shipment Risk Assessment (AI)
########################################################################
Write-Host "`n--- FLOW 6: Shipment Risk Assessment ---"

Test-AI "6.1 Assess risk by parcelId" {
    $body = "{`"parcelId`":`"$($parcel.id)`"}"
    $r = Invoke-RestMethod -Uri "$BASE/api/ai/assess-risk" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body $body
    Write-Host "    -> level=$($r.riskLevel), reasons=$($r.reasonCodes -join ',')"
}

Test-AI "6.2 Assess risk by trackingRef" {
    $body = "{`"trackingRef`":`"$($parcel.trackingNumber)`"}"
    $r = Invoke-RestMethod -Uri "$BASE/api/ai/assess-risk" -Method POST -ContentType "application/json" -Headers $clientHeaders -Body $body
    Write-Host "    -> level=$($r.riskLevel), action=$($r.recommendedAction.Substring(0,[Math]::Min(60,$r.recommendedAction.Length)))"
}

########################################################################
# FLOW 7: Self-Healing System
########################################################################
Write-Host "`n--- FLOW 7: Self-Healing ---"

Test-AI "7.1 Detect congestion (all agencies)" {
    $r = Invoke-RestMethod -Uri "$BASE/api/self-healing/congestion" -Method GET -Headers $adminHeaders
    Write-Host "    -> alerts count=$($r.Count)"
}

Test-AI "7.2 Detect congestion (specific agency)" {
    $r = Invoke-RestMethod -Uri "$BASE/api/self-healing/congestion/agency/$($ag1.id)" -Method GET -Headers $adminHeaders
    Write-Host "    -> level=$($r.congestionLevel), parcels=$($r.parcelCount)"
}

Test-AI "7.3 Get suggested self-healing actions" {
    $r = Invoke-RestMethod -Uri "$BASE/api/self-healing/actions" -Method GET -Headers $adminHeaders
    Write-Host "    -> actions count=$($r.Count)"
}

########################################################################
# FLOW 8: Risk Management (CRUD)
########################################################################
Write-Host "`n--- FLOW 8: Risk Management ---"

Test-AI "8.1 Create risk alert" {
    $body = @{ type="HIGH_VALUE"; severity="MEDIUM"; description="AI test: high-value parcel flagged" } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$BASE/api/risk" -Method POST -ContentType "application/json" -Headers $adminHeaders -Body $body
    if (-not $r.id) { throw "No id returned" }
    $script:riskAlertId = $r.id
    Write-Host "    -> id=$($r.id), type=$($r.alertType), severity=$($r.severity)"
}

Test-AI "8.2 List risk alerts" {
    $r = Invoke-RestMethod -Uri "$BASE/api/risk/alerts?page=0&size=10" -Method GET -Headers $adminHeaders
    Write-Host "    -> total=$($r.totalElements)"
}

Test-AI "8.3 Update risk alert" {
    $body = @{ description="Updated by AI test"; severity="HIGH" } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$BASE/api/risk/alerts/$riskAlertId" -Method PATCH -ContentType "application/json" -Headers $adminHeaders -Body $body
    Write-Host "    -> severity=$($r.severity)"
}

########################################################################
# FLOW 9: AI Agent Status & Recommendations
########################################################################
Write-Host "`n--- FLOW 9: Agent Status & Recommendations ---"

Test-AI "9.1 Agent status (client)" {
    $r = Invoke-RestMethod -Uri "$BASE/api/ai/agent/status" -Method GET -Headers $clientHeaders
    Write-Host "    -> role=$($r.role)"
}

Test-AI "9.2 Agent status (admin)" {
    $r = Invoke-RestMethod -Uri "$BASE/api/ai/agent/status" -Method GET -Headers $adminHeaders
    Write-Host "    -> role=$($r.role)"
}

# Note: Courier/Agency recommendations require AI agent events to populate
# In fresh DB these return 404 which is expected behavior

########################################################################
# SUMMARY
########################################################################
Write-Host "`n========================================"
Write-Host " AI TESTS: $pass PASS / $fail FAIL (of $total)"
Write-Host "========================================"
