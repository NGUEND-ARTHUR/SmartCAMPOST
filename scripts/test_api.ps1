$ErrorActionPreference = "Continue"
$base = "http://localhost:8082/api"
$results = @()

function Test-Endpoint {
    param($name, $uri, $method, $body, $token, $expectFail)
    $headers = @{}
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    try {
        $params = @{ Uri = "$base$uri"; Method = $method; Headers = $headers; ContentType = "application/json" }
        if ($body) { $params["Body"] = $body }
        $r = Invoke-RestMethod @params
        if ($expectFail) {
            $script:results += "[UNEXPECTED-PASS] $name"
        } else {
            $script:results += "[PASS] $name"
        }
        return $r
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($expectFail) {
            $script:results += "[PASS-EXPECTED-$code] $name"
        } else {
            $errBody = $_.ErrorDetails.Message
            $script:results += "[FAIL-$code] $name : $errBody"
        }
        return $null
    }
}

# ========== AUTH ==========
Write-Host "=== AUTH TESTS ==="
$adminLogin = Test-Endpoint "Admin login" "/auth/login" POST '{"phone":"+237690000000","password":"Admin@SmartCAMPOST2026"}'
$adminTk = $adminLogin.accessToken

$otpResp = Test-Endpoint "Send OTP" "/auth/send-otp" POST '{"phone":"+237699000033"}'
$otp = $otpResp.otp

$regBody = @{phone="+237699000033"; password="Client@2026!"; fullName="Marie Ngono"; email="marie@test.cm"; otp=$otp} | ConvertTo-Json
$regResp = Test-Endpoint "Register client" "/auth/register" POST $regBody
$clientTk = $regResp.accessToken
# userId stored for potential later use
$null = $regResp.userId

$cliLogin = Test-Endpoint "Client login" "/auth/login" POST '{"phone":"+237699000033","password":"Client@2026!"}'
$clientTk = $cliLogin.accessToken

Test-Endpoint "Wrong password" "/auth/login" POST '{"phone":"+237699000033","password":"wrong"}' $null $true
Test-Endpoint "Nonexistent user" "/auth/login" POST '{"phone":"+237600000000","password":"test"}' $null $true

# ========== CLIENT PROFILE ==========
Write-Host "=== PROFILE TESTS ==="
Test-Endpoint "Client profile" "/clients/me" GET $null $clientTk
Test-Endpoint "Unauth profile" "/clients/me" GET $null $null $true

# ========== AGENCIES ==========
Write-Host "=== AGENCY TESTS ==="
$ag1 = Test-Endpoint "Create agency1" "/agencies" POST '{"agencyName":"Yaounde HQ","agencyCode":"YDE-HQ","city":"Yaounde","region":"Centre"}' $adminTk
$ag2 = Test-Endpoint "Create agency2" "/agencies" POST '{"agencyName":"Douala Port","agencyCode":"DLA-PT","city":"Douala","region":"Littoral"}' $adminTk
Test-Endpoint "List agencies" "/agencies" GET $null $adminTk
if ($ag1) { Test-Endpoint "Get agency by ID" "/agencies/$($ag1.id)" GET $null $adminTk }

# ========== ADDRESSES ==========
Write-Host "=== ADDRESS TESTS ==="
$addr1 = Test-Endpoint "Create sender addr" "/addresses" POST '{"label":"Home","fullName":"Marie Ngono","phone":"+237699000033","city":"Yaounde","neighbourhood":"Bastos","street":"Rue 1234","region":"Centre","country":"CM"}' $clientTk
$addr2 = Test-Endpoint "Create recipient addr" "/addresses" POST '{"label":"Office","fullName":"Paul Biya","phone":"+237677000044","city":"Douala","neighbourhood":"Bonanjo","street":"Blvd Liberte","region":"Littoral","country":"CM"}' $clientTk
Test-Endpoint "List my addresses" "/addresses/me" GET $null $clientTk

# ========== PARCELS ==========
Write-Host "=== PARCEL TESTS ==="
if ($addr1 -and $addr2 -and $ag1 -and $ag2) {
    $parcelBody = @{
        senderAddressId=$addr1.id; recipientAddressId=$addr2.id
        originAgencyId=$ag1.id; destinationAgencyId=$ag2.id
        weight=3.0; serviceType="STANDARD"; deliveryOption="AGENCY"; paymentOption="PREPAID"
        fragile=$false; descriptionComment="Books"
    } | ConvertTo-Json
    $parcel = Test-Endpoint "Create parcel" "/parcels" POST $parcelBody $clientTk
    
    Test-Endpoint "List my parcels" "/parcels/me" GET $null $clientTk
    if ($parcel) {
        Test-Endpoint "Get parcel by ID" "/parcels/$($parcel.id)" GET $null $clientTk
        Test-Endpoint "Get by tracking ref" "/parcels/tracking/$($parcel.trackingRef)" GET $null $clientTk
    }
    Test-Endpoint "Admin list parcels" "/parcels" GET $null $adminTk

    # Accept parcel (requires GPS via /validate endpoint)
    if ($parcel) {
        $acceptBody = @{latitude=3.8480; longitude=11.5021; descriptionConfirmed=$true; validationComment="Looks good"} | ConvertTo-Json
        $null = Test-Endpoint "Accept parcel" "/parcels/$($parcel.id)/validate" PATCH $acceptBody $adminTk
    }
}

# ========== PAYMENTS ==========
Write-Host "=== PAYMENT TESTS ==="
if ($parcel) {
    $payBody = @{parcelId=$parcel.id; method="CASH"} | ConvertTo-Json
    $pay = Test-Endpoint "Init payment" "/payments/init" POST $payBody $clientTk
    Test-Endpoint "List payments" "/payments" GET $null $adminTk
    if ($pay) {
        Test-Endpoint "Get payment" "/payments/$($pay.id)" GET $null $adminTk
    }
    Test-Endpoint "Payments for parcel" "/payments/parcel/$($parcel.id)" GET $null $clientTk
}

# ========== TRACKING ==========
Write-Host "=== TRACKING TESTS ==="
if ($parcel) {
    Test-Endpoint "Track by ref" "/track/parcel/$($parcel.trackingRef)" GET $null $null
}

# ========== AGENTS ==========
Write-Host "=== AGENT TESTS ==="
# Create agent directly (no separate user registration needed - agent has own phone)
if ($ag1) {
    $agentBody = @{fullName="Agent Pierre"; phone="+237699000088"; password="Agent@2026!"; staffNumber="STAFF-001"; agencyId=$ag1.id} | ConvertTo-Json
    $null = Test-Endpoint "Create agent" "/agents" POST $agentBody $adminTk
    Test-Endpoint "List agents" "/agents" GET $null $adminTk
}

# ========== NOTIFICATIONS ==========
Write-Host "=== NOTIFICATION TESTS ==="
Test-Endpoint "My notifications" "/notifications/me" GET $null $clientTk

# ========== INVOICES ==========
Write-Host "=== INVOICE TESTS ==="
Test-Endpoint "My invoices" "/invoices/me" GET $null $clientTk

# ========== SUPPORT TICKETS ==========
Write-Host "=== SUPPORT TESTS ==="
Test-Endpoint "My tickets" "/support/tickets/me" GET $null $clientTk

# ========== COMPLIANCE ==========
Write-Host "=== COMPLIANCE TESTS ==="
Test-Endpoint "Compliance alerts" "/compliance/alerts" GET $null $adminTk

# ========== LOCATIONS ==========
Write-Host "=== LOCATION TESTS ==="
Test-Endpoint "My locations" "/location/me" GET $null $clientTk

# ========== PICKUP REQUESTS ==========
Write-Host "=== PICKUP TESTS ==="
Test-Endpoint "My pickups" "/pickups/me" GET $null $clientTk

# ========== REPORT ==========
Write-Host ""
Write-Host "============================================"
Write-Host "         TEST RESULTS SUMMARY"
Write-Host "============================================"
$pass = ($results | Where-Object { $_ -match "^\[PASS" }).Count
$fail = ($results | Where-Object { $_ -match "^\[FAIL" }).Count
$unexpected = ($results | Where-Object { $_ -match "^\[UNEXPECTED" }).Count
$results | ForEach-Object { Write-Host $_ }
Write-Host "--------------------------------------------"
Write-Host "TOTAL: $($results.Count)  PASS: $pass  FAIL: $fail  UNEXPECTED: $unexpected"
Write-Host "============================================"
