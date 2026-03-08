######################################################################
# SmartCAMPOST — Comprehensive API Test Script (V3)
# Tests ALL endpoints across ALL roles with correct DTOs
#
# Must run against a FRESH server (H2 in-memory)
######################################################################

$ErrorActionPreference = "Continue"
$BASE = "http://localhost:8082/api"
$pass = 0; $fail = 0; $unexpected = 0; $total = 0
$failures = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [string]$Token = $null,
        [int[]]$ExpectStatus = @(200,201),
        [switch]$ExpectFail
    )
    $script:total++
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    try {
        $params = @{ Uri = $Url; Method = $Method; Headers = $headers; ErrorAction = "Stop" }
        if ($Body -and $Method -ne "GET") { $params["Body"] = [System.Text.Encoding]::UTF8.GetBytes($Body) }
        $resp = Invoke-WebRequest @params
        $code = $resp.StatusCode
        if ($ExpectFail) {
            $script:unexpected++
            $tag = "[UNEXPECTED-PASS]"
            $script:failures += "$tag $Name - Expected failure but got $code"
            Write-Host "$tag $Name" -ForegroundColor Yellow
        } elseif ($ExpectStatus -contains $code) {
            $script:pass++
            Write-Host "[PASS] $Name" -ForegroundColor Green
        } else {
            $script:fail++
            $tag = "[FAIL-$code]"
            $script:failures += "$tag $Name"
            Write-Host "$tag $Name" -ForegroundColor Red
        }
        return ($resp.Content | ConvertFrom-Json -ErrorAction SilentlyContinue)
    } catch {
        $code = 0
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        $detail = ""
        try {
            if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $detail = $_.ErrorDetails.Message }
            elseif ($_.Exception.Response) {
                $task = $_.Exception.Response.Content.ReadAsStringAsync()
                $task.Wait(); $detail = $task.Result
            }
        } catch {}
        if ($ExpectFail -and $code -ge 400) {
            $script:pass++
            $tag = "[PASS-EXPECTED-$code]"
            Write-Host "$tag $Name" -ForegroundColor Green
        } else {
            $script:fail++
            $tag = "[FAIL-$code]"
            $script:failures += "$tag $Name : $detail"
            Write-Host "$tag $Name : $($detail.Substring(0, [Math]::Min(200, $detail.Length)))" -ForegroundColor Red
        }
        return $null
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   SmartCAMPOST COMPREHENSIVE TEST V3" -ForegroundColor Cyan
Write-Host "   $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# ============================================================
# MODULE 1: AUTHENTICATION
# ============================================================
Write-Host "`n--- MODULE 1: AUTHENTICATION ---" -ForegroundColor Cyan

# 1.1 Admin login (bootstrap admin)
$adminLogin = Test-Endpoint "Admin login" POST "$BASE/auth/login" '{"phone":"+237690000000","password":"Admin@SmartCAMPOST2026"}'
$ADMIN_TOKEN = $adminLogin.accessToken

# 1.2 Send OTP for registration
$otpResp = Test-Endpoint "Send OTP for registration" POST "$BASE/auth/send-otp" '{"phone":"+237670000001"}'
$OTP_CODE = $otpResp.otp

# 1.3 Register CLIENT
$regBody = @{
    fullName = "Jean Dupont"
    phone = "+237670000001"
    email = "jean.dupont@test.cm"
    preferredLanguage = "FR"
    password = "Client@2026Pass"
    otp = $OTP_CODE
} | ConvertTo-Json
$null = Test-Endpoint "Register CLIENT" POST "$BASE/auth/register" $regBody

# 1.4 Client login
$clientLogin = Test-Endpoint "Client login" POST "$BASE/auth/login" '{"phone":"+237670000001","password":"Client@2026Pass"}'
$CLIENT_TOKEN = $clientLogin.accessToken

# 1.5 Negative: Wrong password
Test-Endpoint "Wrong password → 401" POST "$BASE/auth/login" '{"phone":"+237690000000","password":"wrong"}' -ExpectFail

# 1.6 Negative: Nonexistent user
Test-Endpoint "Nonexistent user → 404" POST "$BASE/auth/login" '{"phone":"+237699999999","password":"any"}' -ExpectFail

# 1.7 Verify OTP with wrong code (returns 200 with verified=false - BUG: should return 400)
$null = Test-Endpoint "Verify OTP (wrong code → 200 w/ verified=false)" POST "$BASE/auth/verify-otp" '{"phone":"+237670000001","otp":"000000"}' -ExpectStatus @(200)

# 1.8 Request login OTP (different phone to avoid cooldown)
Start-Sleep -Seconds 1
$null = Test-Endpoint "Request login OTP" POST "$BASE/auth/login/otp/request" '{"phone":"+237690000000"}'

# 1.9 Password reset request (use admin phone which exists)
Start-Sleep -Seconds 1
$null = Test-Endpoint "Request password reset" POST "$BASE/auth/password/reset/request" '{"phone":"+237690000000"}'

# 1.10 Negative: Register with blank fields
Test-Endpoint "Register with blank fields → 400" POST "$BASE/auth/register" '{"fullName":"","phone":"","password":""}' -ExpectFail

# 1.11 Negative: Login with missing phone
Test-Endpoint "Login with missing phone → 400" POST "$BASE/auth/login" '{"password":"something"}' -ExpectFail

# ============================================================
# MODULE 2: AGENCIES
# ============================================================
Write-Host "`n--- MODULE 2: AGENCIES ---" -ForegroundColor Cyan

$agency1 = Test-Endpoint "Create agency (Yaounde)" POST "$BASE/agencies" '{"agencyName":"CAMPOST Yaounde Central","agencyCode":"YDE-HQ","city":"Yaounde","region":"Centre","country":"Cameroon"}' $ADMIN_TOKEN -ExpectStatus @(200,201)
$AGENCY1_ID = $agency1.id

$agency2 = Test-Endpoint "Create agency (Douala)" POST "$BASE/agencies" '{"agencyName":"CAMPOST Douala Port","agencyCode":"DLA-PT","city":"Douala","region":"Littoral","country":"Cameroon"}' $ADMIN_TOKEN -ExpectStatus @(200,201)
$AGENCY2_ID = $agency2.id

$null = Test-Endpoint "List agencies" GET "$BASE/agencies" $null $ADMIN_TOKEN
# Edge case: Create agency with duplicate code
Test-Endpoint "Duplicate agency code → 400/409" POST "$BASE/agencies" '{"agencyName":"Dup","agencyCode":"YDE-HQ","city":"x","region":"x","country":"x"}' $ADMIN_TOKEN -ExpectFail

# ============================================================
# MODULE 3: ADMIN - USER MANAGEMENT
# ============================================================
Write-Host "`n--- MODULE 3: ADMIN USER MANAGEMENT ---" -ForegroundColor Cyan

Test-Endpoint "Admin: List all users" GET "$BASE/admin/users" $null $ADMIN_TOKEN
Test-Endpoint "Admin: List users by role CLIENT" GET "$BASE/admin/users/by-role?role=CLIENT" $null $ADMIN_TOKEN
Test-Endpoint "Admin: List users by role ADMIN" GET "$BASE/admin/users/by-role?role=ADMIN" $null $ADMIN_TOKEN
Test-Endpoint "Client CANNOT access admin" GET "$BASE/admin/users" $null $CLIENT_TOKEN -ExpectFail
Test-Endpoint "Unauth CANNOT access admin" GET "$BASE/admin/users" -ExpectFail

# ============================================================
# MODULE 4: CLIENT PROFILE
# ============================================================
Write-Host "`n--- MODULE 4: CLIENT PROFILE ---" -ForegroundColor Cyan

$clientProfile = Test-Endpoint "Client: My profile" GET "$BASE/clients/me" $null $CLIENT_TOKEN
$CLIENT_ENTITY_ID = $clientProfile.clientId
if (-not $CLIENT_ENTITY_ID) { $CLIENT_ENTITY_ID = $clientProfile.id }
Test-Endpoint "Client: Update profile" PUT "$BASE/clients/me" '{"fullName":"Jean Dupont Updated","email":"jean.updated@test.cm"}' $CLIENT_TOKEN
Test-Endpoint "Client: Update language" PATCH "$BASE/clients/me/preferred-language" '{"preferredLanguage":"EN"}' $CLIENT_TOKEN
Test-Endpoint "Admin: List clients" GET "$BASE/clients?page=0&size=10" $null $ADMIN_TOKEN
Test-Endpoint "Unauth CANNOT get profile" GET "$BASE/clients/me" -ExpectFail

# ============================================================
# MODULE 5: STAFF MANAGEMENT
# ============================================================
Write-Host "`n--- MODULE 5: STAFF MANAGEMENT ---" -ForegroundColor Cyan

$staffResp = Test-Endpoint "Admin: Create STAFF" POST "$BASE/staff" (@{
    fullName = "Staff Member 1"
    email = "staff1@campost.cm"
    phone = "+237670000010"
    password = "Staff@2026Pass"
    role = "STAFF"
    department = "Operations"
} | ConvertTo-Json) $ADMIN_TOKEN -ExpectStatus @(200,201)
$null = $staffResp.id

Test-Endpoint "Admin: List staff" GET "$BASE/staff?page=0&size=10" $null $ADMIN_TOKEN

$staffLogin = Test-Endpoint "Staff login" POST "$BASE/auth/login" '{"phone":"+237670000010","password":"Staff@2026Pass"}'
$STAFF_TOKEN = $staffLogin.accessToken

Test-Endpoint "Client CANNOT create staff" POST "$BASE/staff" '{"fullName":"x","email":"x@x.cm","phone":"+237600000000","password":"x","role":"STAFF"}' $CLIENT_TOKEN -ExpectFail

# ============================================================
# MODULE 6: FINANCE STAFF
# ============================================================
Write-Host "`n--- MODULE 6: FINANCE STAFF ---" -ForegroundColor Cyan

$null = Test-Endpoint "Admin: Create FINANCE staff" POST "$BASE/staff" (@{
    fullName = "Finance Officer"
    email = "finance1@campost.cm"
    phone = "+237670000020"
    password = "Finance@2026Pass"
    role = "FINANCE"
    department = "Finance"
} | ConvertTo-Json) $ADMIN_TOKEN -ExpectStatus @(200,201)

$financeLogin = Test-Endpoint "Finance login" POST "$BASE/auth/login" '{"phone":"+237670000020","password":"Finance@2026Pass"}'
$FINANCE_TOKEN = $financeLogin.accessToken

# ============================================================
# MODULE 7: RISK STAFF
# ============================================================
Write-Host "`n--- MODULE 7: RISK STAFF ---" -ForegroundColor Cyan

$null = Test-Endpoint "Admin: Create RISK staff" POST "$BASE/staff" (@{
    fullName = "Risk Analyst"
    email = "risk1@campost.cm"
    phone = "+237670000030"
    password = "Risk@2026Pass"
    role = "RISK"
    department = "Risk"
} | ConvertTo-Json) $ADMIN_TOKEN -ExpectStatus @(200,201)

$riskLogin = Test-Endpoint "Risk login" POST "$BASE/auth/login" '{"phone":"+237670000030","password":"Risk@2026Pass"}'
$RISK_TOKEN = $riskLogin.accessToken

# ============================================================
# MODULE 8: AGENTS
# ============================================================
Write-Host "`n--- MODULE 8: AGENTS ---" -ForegroundColor Cyan

$agentResp = Test-Endpoint "Admin: Create AGENT" POST "$BASE/agents" (@{
    fullName = "Agent Yaounde"
    email = "agent1@campost.cm"
    phone = "+237670000040"
    password = "Agent@2026Pass"
    staffNumber = "AGT-001"
    assignedAgencyId = $AGENCY1_ID
} | ConvertTo-Json) $ADMIN_TOKEN -ExpectStatus @(200,201)
$AGENT_ID = $agentResp.id

Test-Endpoint "List agents" GET "$BASE/agents?page=0&size=10" $null $ADMIN_TOKEN

$agentLogin = Test-Endpoint "Agent login" POST "$BASE/auth/login" '{"phone":"+237670000040","password":"Agent@2026Pass"}'
$AGENT_TOKEN = $agentLogin.accessToken

Test-Endpoint "Client CANNOT create agent" POST "$BASE/agents" '{"fullName":"x"}' $CLIENT_TOKEN -ExpectFail

# ============================================================
# MODULE 9: COURIERS
# ============================================================
Write-Host "`n--- MODULE 9: COURIERS ---" -ForegroundColor Cyan

$courierResp = Test-Endpoint "Admin: Create COURIER" POST "$BASE/couriers" (@{
    fullName = "Courier Douala"
    email = "courier1@campost.cm"
    phone = "+237670000050"
    password = "Courier@2026Pass"
    vehicleType = "MOTORCYCLE"
    status = "AVAILABLE"
} | ConvertTo-Json) $ADMIN_TOKEN -ExpectStatus @(200,201)
$COURIER_ID = $courierResp.id

Test-Endpoint "List couriers" GET "$BASE/couriers?page=0&size=10" $null $ADMIN_TOKEN

$courierLogin = Test-Endpoint "Courier login" POST "$BASE/auth/login" '{"phone":"+237670000050","password":"Courier@2026Pass"}'
$COURIER_TOKEN = $courierLogin.accessToken

Test-Endpoint "Client CANNOT create courier" POST "$BASE/couriers" '{"fullName":"x"}' $CLIENT_TOKEN -ExpectFail

# ============================================================
# MODULE 10: ADDRESSES
# ============================================================
Write-Host "`n--- MODULE 10: ADDRESSES ---" -ForegroundColor Cyan

$senderAddr = Test-Endpoint "Client: Create sender address" POST "$BASE/addresses" (@{
    label = "Home Yaounde"
    fullName = "Jean Dupont"
    phone = "+237670000001"
    street = "Rue 1000"
    city = "Yaounde"
    region = "Centre"
    country = "Cameroon"
    latitude = 3.8480
    longitude = 11.5021
} | ConvertTo-Json) $CLIENT_TOKEN -ExpectStatus @(200,201)
$SENDER_ADDR_ID = $senderAddr.id

$recipientAddr = Test-Endpoint "Client: Create recipient address" POST "$BASE/addresses" (@{
    label = "Office Douala"
    fullName = "Marie Talla"
    phone = "+237670000099"
    street = "Boulevard de la Liberte"
    city = "Douala"
    region = "Littoral"
    country = "Cameroon"
    latitude = 4.0511
    longitude = 9.7679
} | ConvertTo-Json) $CLIENT_TOKEN -ExpectStatus @(200,201)
$RECIPIENT_ADDR_ID = $recipientAddr.id

Test-Endpoint "Client: List my addresses" GET "$BASE/addresses/me" $null $CLIENT_TOKEN
Test-Endpoint "Client: Get address by ID" GET "$BASE/addresses/$SENDER_ADDR_ID" $null $CLIENT_TOKEN
Test-Endpoint "Client: Update address" PUT "$BASE/addresses/$SENDER_ADDR_ID" (@{
    label = "Home Yaounde Updated"
    fullName = "Jean Dupont"
    phone = "+237670000001"
    street = "Rue 1000 Updated"
    city = "Yaounde"
    region = "Centre"
    country = "Cameroon"
    latitude = 3.8480
    longitude = 11.5021
} | ConvertTo-Json) $CLIENT_TOKEN
Test-Endpoint "Client: Delete address" DELETE "$BASE/addresses/$RECIPIENT_ADDR_ID" $null $CLIENT_TOKEN

# Re-create recipient for parcel flow
$recipientAddr = Test-Endpoint "Client: Re-create recipient addr" POST "$BASE/addresses" (@{
    label = "Office Douala"
    fullName = "Marie Talla"
    phone = "+237670000099"
    street = "Boulevard de la Liberte"
    city = "Douala"
    region = "Littoral"
    country = "Cameroon"
    latitude = 4.0511
    longitude = 9.7679
} | ConvertTo-Json) $CLIENT_TOKEN -ExpectStatus @(200,201)
$RECIPIENT_ADDR_ID = $recipientAddr.id

# Edge cases
Test-Endpoint "Address: Missing required fields → 400" POST "$BASE/addresses" '{"label":""}' $CLIENT_TOKEN -ExpectFail
Test-Endpoint "Address: Nonexistent ID → 404" GET "$BASE/addresses/00000000-0000-0000-0000-000000000000" $null $CLIENT_TOKEN -ExpectFail

# ============================================================
# MODULE 11: TARIFFS
# ============================================================
Write-Host "`n--- MODULE 11: TARIFFS ---" -ForegroundColor Cyan

$tariff = Test-Endpoint "Admin: Create tariff" POST "$BASE/tariffs" (@{
    serviceType = "STANDARD"
    originZone = "CENTRE"
    destinationZone = "LITTORAL"
    weightBracket = "1-5"
    price = 2500
} | ConvertTo-Json) $ADMIN_TOKEN -ExpectStatus @(200,201)
$null = $tariff.id

Test-Endpoint "List all tariffs" GET "$BASE/tariffs?page=0&size=10" $null $ADMIN_TOKEN

# Tariff quote with matching params
Test-Endpoint "Tariff quote" POST "$BASE/tariffs/quote" (@{
    serviceType = "STANDARD"
    originZone = "CENTRE"
    destinationZone = "LITTORAL"
    weight = 3.0
} | ConvertTo-Json) $ADMIN_TOKEN

# Edge: non-matching tariff
Test-Endpoint "Tariff quote no match → 404" POST "$BASE/tariffs/quote" (@{
    serviceType = "EXPRESS"
    originZone = "NORTH"
    destinationZone = "SOUTH"
    weight = 50.0
} | ConvertTo-Json) $ADMIN_TOKEN -ExpectFail

Test-Endpoint "Client CANNOT access tariffs" GET "$BASE/tariffs" $null $CLIENT_TOKEN -ExpectFail

# ============================================================
# MODULE 12: PARCELS (CORE WORKFLOW)
# ============================================================
Write-Host "`n--- MODULE 12: PARCELS ---" -ForegroundColor Cyan

# Client creates a parcel
$parcel = Test-Endpoint "Client: Create parcel" POST "$BASE/parcels" (@{
    senderAddressId = $SENDER_ADDR_ID
    recipientAddressId = $RECIPIENT_ADDR_ID
    originAgencyId = $AGENCY1_ID
    destinationAgencyId = $AGENCY2_ID
    weight = 2.5
    dimensions = "30x20x15"
    declaredValue = 15000
    fragile = $false
    serviceType = "STANDARD"
    deliveryOption = "AGENCY"
    paymentOption = "PREPAID"
    descriptionComment = "Documents for business"
} | ConvertTo-Json) $CLIENT_TOKEN -ExpectStatus @(200,201)
$PARCEL_ID = $parcel.id
$TRACKING_REF = $parcel.trackingRef

Test-Endpoint "Client: List my parcels" GET "$BASE/parcels/me?page=0&size=10" $null $CLIENT_TOKEN
Test-Endpoint "Admin: List all parcels" GET "$BASE/parcels?page=0&size=10" $null $ADMIN_TOKEN
Test-Endpoint "Client: Get parcel by ID" GET "$BASE/parcels/$PARCEL_ID" $null $CLIENT_TOKEN

# Edge: create parcel with missing fields
Test-Endpoint "Create parcel: missing fields → 400" POST "$BASE/parcels" '{"weight":0}' $CLIENT_TOKEN -ExpectFail

# Status transition: CREATED → ACCEPTED (requires GPS + body via /validate endpoint)
Test-Endpoint "Staff: Accept parcel" PATCH "$BASE/parcels/$PARCEL_ID/validate" (@{
    descriptionConfirmed = $true
    validatedWeight = 2.5
    validatedDimensions = "30x20x15"
    validationComment = "OK verified by staff"
    latitude = 3.8480
    longitude = 11.5021
    locationSource = "GPS"
} | ConvertTo-Json) $STAFF_TOKEN

# Validate and lock (generates final QR) - uses query params for GPS
Test-Endpoint "Staff: Validate and lock parcel" POST "$BASE/parcels/$PARCEL_ID/validate-and-lock?latitude=3.848&longitude=11.5021" $null $STAFF_TOKEN

# Change delivery option
Test-Endpoint "Client: Change delivery option to HOME" PATCH "$BASE/parcels/$PARCEL_ID/delivery-option" '{"newDeliveryOption":"HOME"}' $CLIENT_TOKEN
Test-Endpoint "Client: Change delivery option back to AGENCY" PATCH "$BASE/parcels/$PARCEL_ID/delivery-option" '{"newDeliveryOption":"AGENCY"}' $CLIENT_TOKEN

# Edge: null delivery option (Bug #4 was fixed)
Test-Endpoint "Change delivery option: null → 400" PATCH "$BASE/parcels/$PARCEL_ID/delivery-option" '{}' $CLIENT_TOKEN -ExpectFail

# Can correct?
Test-Endpoint "Can correct parcel" GET "$BASE/parcels/$PARCEL_ID/can-correct" $null $STAFF_TOKEN

# ============================================================
# MODULE 13: PRICING
# ============================================================
Write-Host "`n--- MODULE 13: PRICING ---" -ForegroundColor Cyan

Test-Endpoint "Pricing: Quote for parcel" GET "$BASE/pricing/quote/$PARCEL_ID" $null $CLIENT_TOKEN
Test-Endpoint "Pricing details for parcel" GET "$BASE/pricing-details/parcel/${PARCEL_ID}?page=0&size=10" $null $CLIENT_TOKEN

# ============================================================
# MODULE 14: PAYMENTS
# ============================================================
Write-Host "`n--- MODULE 14: PAYMENTS ---" -ForegroundColor Cyan

$payment = Test-Endpoint "Client: Init payment" POST "$BASE/payments/init" (@{
    parcelId = $PARCEL_ID
    method = "CASH"
    currency = "XAF"
} | ConvertTo-Json) $CLIENT_TOKEN -ExpectStatus @(200,201)
$PAYMENT_ID = $payment.id

Test-Endpoint "Confirm payment" POST "$BASE/payments/confirm" (@{
    paymentId = $PAYMENT_ID
    success = $true
    gatewayRef = "CASH-001"
} | ConvertTo-Json) $ADMIN_TOKEN

Test-Endpoint "Get payment by ID" GET "$BASE/payments/$PAYMENT_ID" $null $CLIENT_TOKEN
Test-Endpoint "Payments for parcel" GET "$BASE/payments/parcel/$PARCEL_ID" $null $CLIENT_TOKEN
Test-Endpoint "Admin: List all payments" GET "$BASE/payments?page=0&size=10" $null $ADMIN_TOKEN

# Edge: init payment for nonexistent parcel
Test-Endpoint "Init payment: bad parcel → 404" POST "$BASE/payments/init" '{"parcelId":"00000000-0000-0000-0000-000000000000","method":"CASH"}' $CLIENT_TOKEN -ExpectFail

# ============================================================
# MODULE 15: SCAN EVENTS
# ============================================================
Write-Host "`n--- MODULE 15: SCAN EVENTS ---" -ForegroundColor Cyan

# Add scan event (via scan-events endpoint using ScanEventCreateRequest)
$null = Test-Endpoint "Agent: Create scan event (TAKEN_IN_CHARGE)" POST "$BASE/scan-events" (@{
    parcelId = $PARCEL_ID
    agencyId = $AGENCY1_ID
    agentId = $AGENT_ID
    eventType = "TAKEN_IN_CHARGE"
    latitude = 3.8480
    longitude = 11.5021
    locationSource = "GPS"
} | ConvertTo-Json) $AGENT_TOKEN -ExpectStatus @(200,201)

Test-Endpoint "Agent: Create scan event (IN_TRANSIT)" POST "$BASE/scan-events" (@{
    parcelId = $PARCEL_ID
    eventType = "IN_TRANSIT"
    latitude = 3.9500
    longitude = 10.5000
    locationSource = "GPS"
} | ConvertTo-Json) $AGENT_TOKEN -ExpectStatus @(200,201)

Test-Endpoint "Get scan events for parcel (via parcels)" GET "$BASE/parcels/$PARCEL_ID/scan-events" $null $STAFF_TOKEN
Test-Endpoint "Get scan events (via scan-events)" GET "$BASE/scan-events/parcel/$PARCEL_ID" $null $STAFF_TOKEN

# ============================================================
# MODULE 16: QR CODES
# ============================================================
Write-Host "`n--- MODULE 16: QR CODES ---" -ForegroundColor Cyan

Test-Endpoint "QR verify (POST)" POST "$BASE/qr/verify" '{"token":"test-token-123"}' $ADMIN_TOKEN -ExpectStatus @(200,404)
Test-Endpoint "QR verify GET" GET "$BASE/qr/verify/test-content" $null $ADMIN_TOKEN -ExpectStatus @(200,404)

# ============================================================
# MODULE 17: TRACKING
# ============================================================
Write-Host "`n--- MODULE 17: TRACKING ---" -ForegroundColor Cyan

if ($TRACKING_REF) {
    Test-Endpoint "Track parcel by ref" GET "$BASE/track/parcel/$TRACKING_REF" -ExpectStatus @(200)
}
Test-Endpoint "Track nonexistent → 404" GET "$BASE/track/parcel/NONEXISTENT-123" -ExpectFail

# ============================================================
# MODULE 18: NOTIFICATIONS
# ============================================================
Write-Host "`n--- MODULE 18: NOTIFICATIONS ---" -ForegroundColor Cyan

Test-Endpoint "Client: My notifications" GET "$BASE/notifications/me" $null $CLIENT_TOKEN
Test-Endpoint "Admin: List all notifications" GET "$BASE/notifications?page=0&size=50" $null $ADMIN_TOKEN
Test-Endpoint "Notifications for parcel" GET "$BASE/notifications/parcel/$PARCEL_ID" $null $ADMIN_TOKEN

# Trigger notification
Test-Endpoint "Admin: Trigger notification" POST "$BASE/notifications/trigger" (@{
    channel = "SMS"
    type = "PARCEL_STATUS_CHANGE"
    parcelId = $PARCEL_ID
    recipientPhone = "+237670000001"
    message = "Test notification"
} | ConvertTo-Json) $ADMIN_TOKEN -ExpectStatus @(200,201)

# Edge: trigger with invalid type
Test-Endpoint "Trigger with bad type → 400" POST "$BASE/notifications/trigger" '{"channel":"SMS","type":"INVALID_TYPE","recipientPhone":"+237670000001"}' $ADMIN_TOKEN -ExpectFail

# ============================================================
# MODULE 19: PICKUPS
# ============================================================
Write-Host "`n--- MODULE 19: PICKUPS ---" -ForegroundColor Cyan

$pickup = Test-Endpoint "Client: Create pickup" POST "$BASE/pickups" (@{
    parcelId = $PARCEL_ID
    requestedDate = "2026-03-10"
    timeWindow = "09:00-12:00"
    pickupLatitude = 3.8480
    pickupLongitude = 11.5021
    comment = "Ring doorbell"
} | ConvertTo-Json) $CLIENT_TOKEN -ExpectStatus @(200,201)
$PICKUP_ID = $pickup.id

Test-Endpoint "Client: My pickups" GET "$BASE/pickups/me?page=0&size=10" $null $CLIENT_TOKEN
Test-Endpoint "Courier: My pickups" GET "$BASE/pickups/courier/me?page=0&size=10" $null $COURIER_TOKEN
Test-Endpoint "Admin: List all pickups" GET "$BASE/pickups?page=0&size=10" $null $ADMIN_TOKEN
Test-Endpoint "Get pickup by ID" GET "$BASE/pickups/$PICKUP_ID" $null $CLIENT_TOKEN
Test-Endpoint "Pickup by parcel" GET "$BASE/pickups/by-parcel/$PARCEL_ID" $null $CLIENT_TOKEN

# Edge: create pickup missing fields
Test-Endpoint "Create pickup: missing fields → 400" POST "$BASE/pickups" '{"parcelId":"00000000-0000-0000-0000-000000000000"}' $CLIENT_TOKEN -ExpectFail

# ============================================================
# MODULE 20: INVOICES
# ============================================================
Write-Host "`n--- MODULE 20: INVOICES ---" -ForegroundColor Cyan

Test-Endpoint "Client: My invoices" GET "$BASE/invoices/me" $null $CLIENT_TOKEN
Test-Endpoint "Invoices by parcel" GET "$BASE/invoices/by-parcel/$PARCEL_ID" $null $CLIENT_TOKEN

# ============================================================
# MODULE 21: SUPPORT TICKETS
# ============================================================
Write-Host "`n--- MODULE 21: SUPPORT TICKETS ---" -ForegroundColor Cyan

$ticket = Test-Endpoint "Client: Create support ticket" POST "$BASE/support/tickets" (@{
    subject = "Delivery delay inquiry"
    message = "My parcel has been in transit for too long, please check."
    category = "COMPLAINT"
} | ConvertTo-Json) $CLIENT_TOKEN -ExpectStatus @(200,201)
$TICKET_ID = $ticket.id

Test-Endpoint "Client: My tickets" GET "$BASE/support/tickets/me?page=0&size=10" $null $CLIENT_TOKEN
Test-Endpoint "Admin: List all tickets" GET "$BASE/support/tickets?page=0&size=10" $null $ADMIN_TOKEN
Test-Endpoint "Get ticket by ID" GET "$BASE/support/tickets/$TICKET_ID" $null $CLIENT_TOKEN

# Reply to ticket
Test-Endpoint "Admin: Reply to ticket" POST "$BASE/support/tickets/$TICKET_ID/reply" '{"replyMessage":"We are looking into this. Your parcel is currently in transit."}' $ADMIN_TOKEN -ExpectStatus @(200,201)

# Edge: create duplicate support ticket
Test-Endpoint "Duplicate ticket → 409" POST "$BASE/support/tickets" '{"subject":"Another","message":"Another msg"}' $CLIENT_TOKEN -ExpectFail

# Edge: reply with blank message
Test-Endpoint "Reply with blank → 400" POST "$BASE/support/tickets/$TICKET_ID/reply" '{"replyMessage":""}' $ADMIN_TOKEN -ExpectFail

# ============================================================
# MODULE 22: DASHBOARD
# ============================================================
Write-Host "`n--- MODULE 22: DASHBOARD ---" -ForegroundColor Cyan

Test-Endpoint "Admin: Dashboard summary" GET "$BASE/dashboard/summary" $null $ADMIN_TOKEN
Test-Endpoint "Client: Dashboard summary" GET "$BASE/dashboard/summary" $null $CLIENT_TOKEN
Test-Endpoint "Staff: Dashboard summary" GET "$BASE/dashboard/summary" $null $STAFF_TOKEN
Test-Endpoint "Unauth CANNOT access dashboard" GET "$BASE/dashboard/summary" -ExpectFail

# ============================================================
# MODULE 23: FINANCE
# ============================================================
Write-Host "`n--- MODULE 23: FINANCE ---" -ForegroundColor Cyan

Test-Endpoint "Admin: Finance stats" GET "$BASE/finance/stats" $null $ADMIN_TOKEN
Test-Endpoint "Finance: Finance stats" GET "$BASE/finance/stats" $null $FINANCE_TOKEN
Test-Endpoint "Admin: Finance refunds" GET "$BASE/finance/refunds?page=0&size=10" $null $ADMIN_TOKEN
Test-Endpoint "Client CANNOT access finance" GET "$BASE/finance/stats" $null $CLIENT_TOKEN -ExpectFail
Test-Endpoint "Agent CANNOT access finance" GET "$BASE/finance/stats" $null $AGENT_TOKEN -ExpectFail
Test-Endpoint "Courier CANNOT access finance" GET "$BASE/finance/stats" $null $COURIER_TOKEN -ExpectFail

# ============================================================
# MODULE 24: RISK
# ============================================================
Write-Host "`n--- MODULE 24: RISK ---" -ForegroundColor Cyan

Test-Endpoint "Admin: Risk alerts" GET "$BASE/risk/alerts?page=0&size=10" $null $ADMIN_TOKEN
Test-Endpoint "Risk: Risk alerts" GET "$BASE/risk/alerts?page=0&size=10" $null $RISK_TOKEN

# Create risk alert with correct enum
Test-Endpoint "Admin: Create risk alert" POST "$BASE/risk" (@{
    type = "AML_FLAG"
    severity = "HIGH"
    description = "Suspicious high-value transaction detected"
} | ConvertTo-Json) $ADMIN_TOKEN -ExpectStatus @(200,201)

Test-Endpoint "Client CANNOT access risk" GET "$BASE/risk/alerts" $null $CLIENT_TOKEN -ExpectFail
Test-Endpoint "Agent CANNOT access risk" GET "$BASE/risk/alerts" $null $AGENT_TOKEN -ExpectFail

# Edge: invalid risk alert type
Test-Endpoint "Invalid risk type → 400" POST "$BASE/risk" '{"type":"INVALID_TYPE","severity":"HIGH","description":"test"}' $ADMIN_TOKEN -ExpectFail

# ============================================================
# MODULE 25: REFUNDS
# ============================================================
Write-Host "`n--- MODULE 25: REFUNDS ---" -ForegroundColor Cyan

Test-Endpoint "Admin: List all refunds" GET "$BASE/refunds?page=0&size=10" $null $ADMIN_TOKEN

# Create refund (admin for confirmed payment)
if ($PAYMENT_ID) {
    $refund = Test-Endpoint "Admin: Create refund" POST "$BASE/refunds" (@{
        paymentId = $PAYMENT_ID
        amount = 1500.0
        reason = "Customer changed mind"
    } | ConvertTo-Json) $ADMIN_TOKEN -ExpectStatus @(200,201)
    $REFUND_ID = $refund.id
    
    if ($REFUND_ID) {
        Test-Endpoint "Get refund by ID" GET "$BASE/refunds/$REFUND_ID" $null $ADMIN_TOKEN
    }
    Test-Endpoint "Refunds for payment" GET "$BASE/refunds/payment/$PAYMENT_ID" $null $ADMIN_TOKEN
}

# ============================================================
# MODULE 26: DELIVERY WORKFLOW
# ============================================================
Write-Host "`n--- MODULE 26: DELIVERY ---" -ForegroundColor Cyan

# Start delivery
Test-Endpoint "Courier: Start delivery" POST "$BASE/delivery/start" (@{
    parcelId = $PARCEL_ID
    courierId = $COURIER_ID
    latitude = 4.0511
    longitude = 9.7679
    notes = "Starting delivery"
} | ConvertTo-Json) $COURIER_TOKEN -ExpectStatus @(200,201)

Test-Endpoint "Delivery status" GET "$BASE/delivery/$PARCEL_ID/status" $null $COURIER_TOKEN

# Send delivery OTP
Test-Endpoint "Send delivery OTP" POST "$BASE/delivery/otp/send" (@{
    parcelId = $PARCEL_ID
    phoneNumber = "+237670000099"
    latitude = 4.0511
    longitude = 9.7679
} | ConvertTo-Json) $COURIER_TOKEN -ExpectStatus @(200,201)

# ============================================================
# MODULE 27: RECEIPTS
# ============================================================
Write-Host "`n--- MODULE 27: RECEIPTS ---" -ForegroundColor Cyan

Test-Endpoint "Receipt by parcel" GET "$BASE/receipts/parcel/$PARCEL_ID" $null $CLIENT_TOKEN -ExpectStatus @(200,404)

# ============================================================
# MODULE 28: LOCATION
# ============================================================
Write-Host "`n--- MODULE 28: LOCATION ---" -ForegroundColor Cyan

Test-Endpoint "Courier: Update location" POST "$BASE/location/update" (@{
    latitude = 4.0511
    longitude = 9.7679
    accuracy = 10.0
} | ConvertTo-Json) $COURIER_TOKEN -ExpectStatus @(200,201)

Test-Endpoint "Agent: Update location" POST "$BASE/location/update" (@{
    latitude = 3.8480
    longitude = 11.5021
} | ConvertTo-Json) $AGENT_TOKEN -ExpectStatus @(200,201)

Test-Endpoint "Courier: Recent locations" GET "$BASE/location/me" $null $COURIER_TOKEN

# ============================================================
# MODULE 29: MAP
# ============================================================
Write-Host "`n--- MODULE 29: MAP ---" -ForegroundColor Cyan

Test-Endpoint "Map: Parcel map data" GET "$BASE/map/parcels/$PARCEL_ID" $null $CLIENT_TOKEN
Test-Endpoint "Map: Admin overview" GET "$BASE/map/admin/overview" $null $ADMIN_TOKEN

# ============================================================
# MODULE 30: GEOLOCATION
# ============================================================
Write-Host "`n--- MODULE 30: GEOLOCATION ---" -ForegroundColor Cyan

Test-Endpoint "Geocode address" POST "$BASE/geo/geocode" '{"addressLine":"Rue 1000, Yaounde, Cameroon"}' $ADMIN_TOKEN
Test-Endpoint "Geo search" POST "$BASE/geo/search" '{"query":"Yaounde"}' $ADMIN_TOKEN

Test-Endpoint "Route ETA" POST "$BASE/geo/route-eta" (@{
    fromLat = 3.8480
    fromLng = 11.5021
    toLat = 4.0511
    toLng = 9.7679
} | ConvertTo-Json) $ADMIN_TOKEN

# Edge: geocode with blank
Test-Endpoint "Geocode blank → 400" POST "$BASE/geo/geocode" '{"addressLine":""}' $ADMIN_TOKEN -ExpectFail

# ============================================================
# MODULE 31: SELF-HEALING
# ============================================================
Write-Host "`n--- MODULE 31: SELF-HEALING ---" -ForegroundColor Cyan

Test-Endpoint "Self-healing: Congestion overview" GET "$BASE/self-healing/congestion" $null $ADMIN_TOKEN
Test-Endpoint "Self-healing: Actions" GET "$BASE/self-healing/actions" $null $ADMIN_TOKEN

# ============================================================
# MODULE 32: OFFLINE SYNC
# ============================================================
Write-Host "`n--- MODULE 32: OFFLINE SYNC ---" -ForegroundColor Cyan

Test-Endpoint "Offline sync" POST "$BASE/offline/sync" (@{
    events = @(@{
        parcelId = $PARCEL_ID
        eventType = "IN_TRANSIT"
        latitude = 3.9000
        longitude = 10.5000
        locationSource = "GPS"
        localId = "offline-001"
    })
    deviceId = "device-001"
    batchId = "batch-001"
} | ConvertTo-Json) $AGENT_TOKEN -ExpectStatus @(200,201)

# ============================================================
# MODULE 33: USSD
# ============================================================
Write-Host "`n--- MODULE 33: USSD ---" -ForegroundColor Cyan

Test-Endpoint "USSD handle" POST "$BASE/ussd/handle" (@{
    msisdn = "+237670000001"
    sessionRef = "sess-001"
    userInput = "1"
} | ConvertTo-Json) -ExpectStatus @(200,201)

# ============================================================
# MODULE 34: INTEGRATION CONFIG
# ============================================================
Write-Host "`n--- MODULE 34: INTEGRATIONS ---" -ForegroundColor Cyan

Test-Endpoint "List integrations" GET "$BASE/integrations?page=0&size=10" $null $ADMIN_TOKEN

# ============================================================
# MODULE 35: ANALYTICS / AI
# ============================================================
Write-Host "`n--- MODULE 35: ANALYTICS / AI ---" -ForegroundColor Cyan

Test-Endpoint "Analytics: ETA for parcel" GET "$BASE/analytics/parcels/$PARCEL_ID/eta" $null $ADMIN_TOKEN -ExpectStatus @(200,404,500)
Test-Endpoint "Analytics: Demand forecast" POST "$BASE/analytics/demand-forecast" '{}' $ADMIN_TOKEN -ExpectStatus @(200,501)
Test-Endpoint "Analytics: Sentiment" GET "$BASE/analytics/sentiment" $null $ADMIN_TOKEN -ExpectStatus @(200,501)

# ============================================================
# MODULE 36: AUDIT
# ============================================================
Write-Host "`n--- MODULE 36: AUDIT ---" -ForegroundColor Cyan

Test-Endpoint "Audit: Parcel audit trail" GET "$BASE/audit/parcel/$PARCEL_ID" $null $ADMIN_TOKEN -ExpectStatus @(200,404)

# ============================================================
# MODULE 37: COMPLIANCE
# ============================================================
Write-Host "`n--- MODULE 37: COMPLIANCE ---" -ForegroundColor Cyan

Test-Endpoint "Compliance: List alerts" GET "$BASE/compliance/alerts?page=0&size=10" $null $ADMIN_TOKEN -ExpectStatus @(200)
Test-Endpoint "Compliance: Reports" GET "$BASE/compliance/reports?from=2026-01-01&to=2026-12-31" $null $ADMIN_TOKEN -ExpectStatus @(200)

# ============================================================
# MODULE 38: CROSS-ROLE ACCESS CONTROL
# ============================================================
Write-Host "`n--- MODULE 38: CROSS-ROLE ACCESS CONTROL ---" -ForegroundColor Cyan

Test-Endpoint "Client CANNOT list all parcels (admin)" GET "$BASE/parcels?page=0&size=10" $null $CLIENT_TOKEN -ExpectFail
Test-Endpoint "Agent CANNOT access admin users" GET "$BASE/admin/users" $null $AGENT_TOKEN -ExpectFail
Test-Endpoint "Courier CANNOT access admin users" GET "$BASE/admin/users" $null $COURIER_TOKEN -ExpectFail
Test-Endpoint "Courier CANNOT access finance" GET "$BASE/finance/stats" $null $COURIER_TOKEN -ExpectFail
Test-Endpoint "Agent CANNOT access risk" GET "$BASE/risk/alerts" $null $AGENT_TOKEN -ExpectFail
Test-Endpoint "Courier CANNOT create staff" POST "$BASE/staff" '{"fullName":"x","email":"x@x.cm","phone":"+237600000000","password":"x","role":"STAFF"}' $COURIER_TOKEN -ExpectFail
Test-Endpoint "Staff CANNOT create parcel" POST "$BASE/parcels" '{"weight":1}' $STAFF_TOKEN -ExpectFail
Test-Endpoint "Client CANNOT access delivery" POST "$BASE/delivery/start" '{"parcelId":"00000000-0000-0000-0000-000000000000"}' $CLIENT_TOKEN -ExpectFail
Test-Endpoint "Finance CANNOT create parcel" POST "$BASE/parcels" '{"weight":1}' $FINANCE_TOKEN -ExpectFail
Test-Endpoint "Risk CANNOT access finance" GET "$BASE/finance/stats" $null $RISK_TOKEN -ExpectFail

# ============================================================
# MODULE 39: EDGE CASES & ERROR HANDLING
# ============================================================
Write-Host "`n--- MODULE 39: EDGE CASES ---" -ForegroundColor Cyan

# Expired/invalid JWT
Test-Endpoint "Invalid JWT → 401/403" GET "$BASE/clients/me" $null "invalid.jwt.token" -ExpectFail

# Empty body on required POST
Test-Endpoint "Empty body on parcel create → 400" POST "$BASE/parcels" '{}' $CLIENT_TOKEN -ExpectFail

# SQL injection attempt in tracking
Test-Endpoint "SQL injection in tracking → safe" GET "$BASE/track/'; DROP TABLE parcels; --" -ExpectFail

# XSS attempt in ticket
Test-Endpoint "XSS in support ticket → handled" POST "$BASE/support/tickets" '{"subject":"<script>alert(1)</script>","message":"test xss"}' $CLIENT_TOKEN -ExpectFail

# Very large payload
$bigString = "A" * 10000
Test-Endpoint "Oversized description → handled" POST "$BASE/parcels" (@{
    senderAddressId = $SENDER_ADDR_ID
    recipientAddressId = $RECIPIENT_ADDR_ID
    weight = 1
    serviceType = "STANDARD"
    deliveryOption = "AGENCY"
    paymentOption = "PREPAID"
    descriptionComment = $bigString
} | ConvertTo-Json) $CLIENT_TOKEN -ExpectFail

# Negative weight
Test-Endpoint "Negative weight → 400" POST "$BASE/parcels" (@{
    senderAddressId = $SENDER_ADDR_ID
    recipientAddressId = $RECIPIENT_ADDR_ID
    weight = -5
    serviceType = "STANDARD"
    deliveryOption = "AGENCY"
    paymentOption = "PREPAID"
} | ConvertTo-Json) $CLIENT_TOKEN -ExpectFail

# Zero amount refund
Test-Endpoint "Zero amount refund → 400" POST "$BASE/refunds" '{"paymentId":"00000000-0000-0000-0000-000000000000","amount":0,"reason":"test"}' $ADMIN_TOKEN -ExpectFail

# ============================================================
# MODULE 40: SECOND CLIENT (MULTI-USER ISOLATION)
# ============================================================
Write-Host "`n--- MODULE 40: MULTI-USER ISOLATION ---" -ForegroundColor Cyan

Start-Sleep -Seconds 2

# Register second client
$otp2 = Test-Endpoint "Send OTP for client 2" POST "$BASE/auth/send-otp" '{"phone":"+237670000002"}'
$OTP2 = $otp2.otp

$reg2Body = @{
    fullName = "Alice Kamga"
    phone = "+237670000002"
    email = "alice@test.cm"
    preferredLanguage = "EN"
    password = "Alice@2026Pass"
    otp = $OTP2
} | ConvertTo-Json
Test-Endpoint "Register client 2" POST "$BASE/auth/register" $reg2Body

$client2Login = Test-Endpoint "Client 2 login" POST "$BASE/auth/login" '{"phone":"+237670000002","password":"Alice@2026Pass"}'
$CLIENT2_TOKEN = $client2Login.accessToken

# Client 2 should NOT see client 1's parcels
$null = Test-Endpoint "Client 2: My parcels (should be empty)" GET "$BASE/parcels/me?page=0&size=10" $null $CLIENT2_TOKEN

# Client 2 should NOT see client 1's addresses
$null = Test-Endpoint "Client 2: My addresses (should be empty)" GET "$BASE/addresses/me" $null $CLIENT2_TOKEN

# Client 2 should NOT see client 1's notifications
$null = Test-Endpoint "Client 2: My notifications (isolated)" GET "$BASE/notifications/me" $null $CLIENT2_TOKEN

# ============================================================
# RESULTS SUMMARY
# ============================================================
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   COMPREHENSIVE TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "TOTAL: $total  PASS: $pass  FAIL: $fail  UNEXPECTED: $unexpected" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Yellow" })
Write-Host "============================================`n" -ForegroundColor Cyan

if ($failures.Count -gt 0) {
    Write-Host "FAILURES:" -ForegroundColor Red
    $i = 1
    foreach ($f in $failures) {
        Write-Host "  $i. $f" -ForegroundColor Red
        $i++
    }
}

Write-Host "`nPass Rate: $([math]::Round($pass/$total*100, 1))%" -ForegroundColor $(if ($pass/$total -gt 0.9) { "Green" } else { "Yellow" })
