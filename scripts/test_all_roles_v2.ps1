# SmartCAMPOST Test Script V2 — Extended role-based API tests
$ErrorActionPreference = "Continue"
$base = "http://localhost:8082/api"
$results = @()
$errors = @()

function Test-Endpoint {
    param($name, $uri, $method, $body, $token, $expectFail)
    $headers = @{"Content-Type"="application/json"}
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    try {
        $params = @{ Uri = "$base$uri"; Method = $method; Headers = $headers; ContentType = "application/json" }
        if ($body) { $params["Body"] = $body }
        $r = Invoke-RestMethod @params
        if ($expectFail) {
            $script:results += "[UNEXPECTED-PASS] $name"
            $script:errors += "[UNEXPECTED-PASS] $name - Expected failure but got success"
        } else {
            $script:results += "[PASS] $name"
        }
        return $r
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $errBody = ""
        try { $errBody = $_.ErrorDetails.Message } catch {}
        if ($expectFail) {
            $script:results += "[PASS-EXPECTED-$code] $name"
        } else {
            $script:results += "[FAIL-$code] $name : $errBody"
            $script:errors += "[FAIL-$code] $name : $errBody"
        }
        return $null
    }
}

Write-Host "============================================" -ForegroundColor Yellow
Write-Host "  SmartCAMPOST COMPREHENSIVE ROLE TESTING" -ForegroundColor Yellow
Write-Host "  (Rate Limiting DISABLED)" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

# ==============================================================================
#  1. AUTH MODULE
# ==============================================================================
Write-Host "=== 1. AUTH MODULE ===" -ForegroundColor Cyan

$adminLogin = Test-Endpoint "Admin login" "/auth/login" POST '{"phone":"+237690000000","password":"Admin@SmartCAMPOST2026"}'
$adminTk = $adminLogin.accessToken
if (-not $adminTk) { Write-Host "CRITICAL: Admin login failed!" -ForegroundColor Red; exit 1 }

# Register CLIENT
$otpResp = Test-Endpoint "Send OTP (register)" "/auth/send-otp" POST '{"phone":"+237699000001"}'
$otp = $otpResp.otp
$regBody = @{phone="+237699000001"; password="Client@2026!"; fullName="Marie Ngono"; email="marie@test.cm"; otp=$otp} | ConvertTo-Json
$regResp = Test-Endpoint "Register CLIENT" "/auth/register" POST $regBody
$clientTk = $regResp.accessToken

$cliLogin = Test-Endpoint "Client login" "/auth/login" POST '{"phone":"+237699000001","password":"Client@2026!"}'
$clientTk = $cliLogin.accessToken

# OTP login flow
$null = Test-Endpoint "Request login OTP" "/auth/login/otp/request" POST '{"phone":"+237699000001"}'
$null = Test-Endpoint "Request password reset" "/auth/password/reset/request" POST '{"phone":"+237699000001"}'

# Negative tests
Test-Endpoint "Wrong password" "/auth/login" POST '{"phone":"+237699000001","password":"wrong"}' $null $true
Test-Endpoint "Nonexistent user" "/auth/login" POST '{"phone":"+237600000000","password":"test"}' $null $true
Test-Endpoint "Verify OTP (random code - should fail)" "/auth/verify-otp" POST '{"phone":"+237699000001","otp":"000000"}' $null $true

# ==============================================================================
#  2. AGENCY MODULE
# ==============================================================================
Write-Host "`n=== 2. AGENCY MODULE ===" -ForegroundColor Cyan

$ag1 = Test-Endpoint "Create agency (Yaounde)" "/agencies" POST '{"agencyName":"Yaounde HQ","agencyCode":"YDE-HQ","city":"Yaounde","region":"Centre"}' $adminTk
$ag2 = Test-Endpoint "Create agency (Douala)" "/agencies" POST '{"agencyName":"Douala Port","agencyCode":"DLA-PT","city":"Douala","region":"Littoral"}' $adminTk
Test-Endpoint "List agencies" "/agencies" GET $null $adminTk
if ($ag1) { Test-Endpoint "Get agency by ID" "/agencies/$($ag1.id)" GET $null $adminTk }
if ($ag1) { Test-Endpoint "Update agency" "/agencies/$($ag1.id)" PUT '{"agencyName":"Yaounde Central","agencyCode":"YDE-HQ","city":"Yaounde","region":"Centre"}' $adminTk }

# ==============================================================================
#  3. ADMIN MODULE
# ==============================================================================
Write-Host "`n=== 3. ADMIN MODULE ===" -ForegroundColor Cyan

Test-Endpoint "Admin: List all users" "/admin/users" GET $null $adminTk
Test-Endpoint "Admin: List users by role CLIENT" "/admin/users/by-role?role=CLIENT" GET $null $adminTk
Test-Endpoint "Admin: List users by role ADMIN" "/admin/users/by-role?role=ADMIN" GET $null $adminTk
Test-Endpoint "Client CANNOT access admin" "/admin/users" GET $null $clientTk $true
Test-Endpoint "Unauth CANNOT access admin" "/admin/users" GET $null $null $true

# ==============================================================================
#  4. CLIENT PROFILE
# ==============================================================================
Write-Host "`n=== 4. CLIENT PROFILE ===" -ForegroundColor Cyan

Test-Endpoint "Client: My profile" "/clients/me" GET $null $clientTk
Test-Endpoint "Client: Update profile" "/clients/me" PUT '{"fullName":"Marie Ngono Updated","email":"marie.new@test.cm","phone":"+237699000001"}' $clientTk
Test-Endpoint "Client: Update language" "/clients/me/preferred-language" PATCH '{"preferredLanguage":"EN"}' $clientTk
Test-Endpoint "Admin: List clients (paginated)" "/clients" GET $null $adminTk
Test-Endpoint "Unauth CANNOT get profile" "/clients/me" GET $null $null $true

# ==============================================================================
#  5. STAFF MODULE
# ==============================================================================
Write-Host "`n=== 5. STAFF MODULE ===" -ForegroundColor Cyan

# CORRECTED: Include email and role (required fields)
$staffBody = @{fullName="Staff Jean"; phone="+237699000005"; password="Staff@2026!"; email="jean@smartcampost.cm"; role="STAFF"} | ConvertTo-Json
$staff = Test-Endpoint "Admin: Create STAFF" "/staff" POST $staffBody $adminTk

if ($staff) { Test-Endpoint "Admin: Get staff by ID" "/staff/$($staff.id)" GET $null $adminTk }
Test-Endpoint "Admin: List staff" "/staff" GET $null $adminTk

$staffLogin = Test-Endpoint "Staff login" "/auth/login" POST '{"phone":"+237699000005","password":"Staff@2026!"}'
$staffTk = $staffLogin.accessToken

if ($staff) { Test-Endpoint "Admin: Update staff status" "/staff/$($staff.id)/status" PATCH '{"status":"ACTIVE"}' $adminTk }
if ($staff) { Test-Endpoint "Admin: Update staff role to FINANCE" "/staff/$($staff.id)/role" PATCH '{"role":"FINANCE"}' $adminTk }

Test-Endpoint "Client CANNOT create staff" "/staff" POST $staffBody $clientTk $true

# Create a 2nd staff as FINANCE role for Finance module tests
$financeBody = @{fullName="Finance Officer"; phone="+237699000006"; password="Finance@2026!"; email="finance@smartcampost.cm"; role="FINANCE"} | ConvertTo-Json
$null = Test-Endpoint "Admin: Create FINANCE staff" "/staff" POST $financeBody $adminTk
$financeLogin = Test-Endpoint "Finance login" "/auth/login" POST '{"phone":"+237699000006","password":"Finance@2026!"}'
$financeTk = $financeLogin.accessToken

# Create RISK staff
$riskBody = @{fullName="Risk Officer"; phone="+237699000007"; password="Risk@2026!"; email="risk@smartcampost.cm"; role="RISK"} | ConvertTo-Json
$null = Test-Endpoint "Admin: Create RISK staff" "/staff" POST $riskBody $adminTk
$riskLogin = Test-Endpoint "Risk login" "/auth/login" POST '{"phone":"+237699000007","password":"Risk@2026!"}'
$riskTk = $riskLogin.accessToken

# ==============================================================================
#  6. AGENT MODULE
# ==============================================================================
Write-Host "`n=== 6. AGENT MODULE ===" -ForegroundColor Cyan

if ($ag1) {
    $agentBody = @{fullName="Agent Pierre"; phone="+237699000010"; password="Agent@2026!"; staffNumber="AGT-001"; agencyId=$ag1.id} | ConvertTo-Json
} else {
    $agentBody = @{fullName="Agent Pierre"; phone="+237699000010"; password="Agent@2026!"; staffNumber="AGT-001"} | ConvertTo-Json
}
$agent = Test-Endpoint "Admin: Create AGENT" "/agents" POST $agentBody $adminTk

if ($agent) { Test-Endpoint "Get agent by ID" "/agents/$($agent.id)" GET $null $adminTk }
Test-Endpoint "List agents" "/agents" GET $null $adminTk

$agentLogin = Test-Endpoint "Agent login" "/auth/login" POST '{"phone":"+237699000010","password":"Agent@2026!"}'
$agentTk = $agentLogin.accessToken

if ($agent) { Test-Endpoint "Update agent status" "/agents/$($agent.id)/status" PATCH '{"status":"ACTIVE"}' $adminTk }
if ($agent -and $ag2) {
    $assignBody = @{agencyId=$ag2.id} | ConvertTo-Json
    Test-Endpoint "Assign agent to agency" "/agents/$($agent.id)/agency" PATCH $assignBody $adminTk
}
Test-Endpoint "Client CANNOT create agent" "/agents" POST $agentBody $clientTk $true

# ==============================================================================
#  7. COURIER MODULE
# ==============================================================================
Write-Host "`n=== 7. COURIER MODULE ===" -ForegroundColor Cyan

$courierBody = @{fullName="Courier Paul"; phone="+237699000020"; password="Courier@2026!"; vehicleIdentifier="CM-YDE-123"} | ConvertTo-Json
$courier = Test-Endpoint "Admin: Create COURIER" "/couriers" POST $courierBody $adminTk

if ($courier) { Test-Endpoint "Get courier by ID" "/couriers/$($courier.id)" GET $null $adminTk }
Test-Endpoint "List couriers" "/couriers" GET $null $adminTk

$courierLogin = Test-Endpoint "Courier login" "/auth/login" POST '{"phone":"+237699000020","password":"Courier@2026!"}'
$courierTk = $courierLogin.accessToken

# CORRECTED: CourierStatus values are AVAILABLE, ON_ROUTE, INACTIVE, BUSY, OFFLINE (not ACTIVE)
if ($courier) { Test-Endpoint "Update courier status (AVAILABLE)" "/couriers/$($courier.id)/status" PATCH '{"status":"AVAILABLE"}' $adminTk }

# CORRECTED: field is vehicleId, not vehicleIdentifier
if ($courier) { Test-Endpoint "Update courier vehicle" "/couriers/$($courier.id)/vehicle" PATCH '{"vehicleId":"CM-DLA-456"}' $adminTk }

Test-Endpoint "Client CANNOT create courier" "/couriers" POST $courierBody $clientTk $true

# ==============================================================================
#  8. ADDRESS MODULE
# ==============================================================================
Write-Host "`n=== 8. ADDRESS MODULE ===" -ForegroundColor Cyan

$addr1 = Test-Endpoint "Client: Create sender addr" "/addresses" POST '{"label":"Home","fullName":"Marie Ngono","phone":"+237699000001","city":"Yaounde","neighbourhood":"Bastos","street":"Rue 1234","region":"Centre","country":"CM"}' $clientTk
$addr2 = Test-Endpoint "Client: Create recipient addr" "/addresses" POST '{"label":"Office","fullName":"Paul Recipient","phone":"+237677000044","city":"Douala","neighbourhood":"Bonanjo","street":"Blvd Liberte","region":"Littoral","country":"CM"}' $clientTk
Test-Endpoint "Client: List my addresses" "/addresses/me" GET $null $clientTk
if ($addr1) { Test-Endpoint "Client: Get address by ID" "/addresses/$($addr1.id)" GET $null $clientTk }
if ($addr1) { Test-Endpoint "Client: Update address" "/addresses/$($addr1.id)" PUT '{"label":"Home Updated","fullName":"Marie Ngono","phone":"+237699000001","city":"Yaounde","neighbourhood":"Bastos","street":"Rue 5678","region":"Centre","country":"CM"}' $clientTk }
if ($addr1) { Test-Endpoint "Client: Delete address" "/addresses/$($addr1.id)" DELETE $null $clientTk }

# ==============================================================================
#  9. PARCEL MODULE
# ==============================================================================
Write-Host "`n=== 9. PARCEL MODULE ===" -ForegroundColor Cyan

# Re-create address since we deleted it
$addr1 = Test-Endpoint "Client: Re-create sender addr" "/addresses" POST '{"label":"Home","fullName":"Marie Ngono","phone":"+237699000001","city":"Yaounde","neighbourhood":"Bastos","street":"Rue 1234","region":"Centre","country":"CM"}' $clientTk

$parcel = $null
if ($addr1 -and $addr2 -and $ag1 -and $ag2) {
    $parcelBody = @{
        senderAddressId=$addr1.id; recipientAddressId=$addr2.id
        originAgencyId=$ag1.id; destinationAgencyId=$ag2.id
        weight=3.0; serviceType="STANDARD"; deliveryOption="AGENCY"; paymentOption="PREPAID"
        fragile=$false; descriptionComment="Test Books"
    } | ConvertTo-Json
    $parcel = Test-Endpoint "Client: Create parcel" "/parcels" POST $parcelBody $clientTk
}

if ($parcel) {
    Test-Endpoint "Client: List my parcels" "/parcels/me" GET $null $clientTk
    Test-Endpoint "Client: Get parcel by ID" "/parcels/$($parcel.id)" GET $null $clientTk
    if ($parcel.trackingRef) { Test-Endpoint "Get by tracking ref" "/parcels/tracking/$($parcel.trackingRef)" GET $null $clientTk }
}

Test-Endpoint "Admin: List all parcels" "/parcels" GET $null $adminTk

# Accept parcel
if ($parcel) {
    $acceptB = @{latitude=3.8480; longitude=11.5021; descriptionConfirmed=$true; validationComment="OK"} | ConvertTo-Json
    Test-Endpoint "Admin: Accept parcel" "/parcels/$($parcel.id)/validate" PATCH $acceptB $adminTk
    Test-Endpoint "Check can-correct" "/parcels/$($parcel.id)/can-correct" GET $null $adminTk
}

# Change delivery option - CORRECTED: field is newDeliveryOption (enum)
if ($parcel) {
    Test-Endpoint "Change delivery option (AGENCY->HOME)" "/parcels/$($parcel.id)/delivery-option" PATCH '{"newDeliveryOption":"HOME"}' $clientTk
}

# Update parcel metadata
if ($parcel) {
    Test-Endpoint "Update parcel metadata" "/parcels/$($parcel.id)/metadata" PATCH '{"photoUrl":"https://example.com/photo.jpg","descriptionComment":"Fragile!"}' $clientTk
}

# Update parcel status
if ($parcel) {
    $statusB = @{status="IN_TRANSIT"; latitude=3.85; longitude=11.50; locationSource="DEVICE_GPS"; comment="In transit"} | ConvertTo-Json
    Test-Endpoint "Admin: Update parcel status" "/parcels/$($parcel.id)/status" PATCH $statusB $adminTk
}

# Create 2nd parcel (EXPRESS/COD)
$parcel2 = $null
if ($addr1 -and $addr2 -and $ag1 -and $ag2) {
    $p2Body = @{
        senderAddressId=$addr1.id; recipientAddressId=$addr2.id
        originAgencyId=$ag1.id; destinationAgencyId=$ag2.id
        weight=1.5; serviceType="EXPRESS"; deliveryOption="HOME"; paymentOption="COD"
        fragile=$true; descriptionComment="Fragile Electronics"
    } | ConvertTo-Json
    $parcel2 = Test-Endpoint "Client: Create 2nd parcel (EXPRESS/COD)" "/parcels" POST $p2Body $clientTk
}

# ==============================================================================
#  10. TARIFF MODULE
# ==============================================================================
Write-Host "`n=== 10. TARIFF MODULE ===" -ForegroundColor Cyan

# CORRECTED: Include originZone, destinationZone, weightBracket, price
$tariffBody = @{serviceType="STANDARD"; originZone="CENTRE"; destinationZone="LITTORAL"; weightBracket="0-5kg"; price=1500} | ConvertTo-Json
$tariff = Test-Endpoint "Admin: Create tariff" "/tariffs" POST $tariffBody $adminTk

if ($tariff) {
    Test-Endpoint "Get tariff by ID" "/tariffs/$($tariff.id)" GET $null $adminTk
    $updateTariff = @{serviceType="STANDARD"; originZone="CENTRE"; destinationZone="LITTORAL"; weightBracket="0-5kg"; price=1800} | ConvertTo-Json
    Test-Endpoint "Update tariff" "/tariffs/$($tariff.id)" PUT $updateTariff $adminTk
}
Test-Endpoint "List all tariffs" "/tariffs" GET $null $adminTk

# CORRECTED: Tariff quote needs originZone + destinationZone
$quoteBody = @{serviceType="STANDARD"; originZone="CENTRE"; destinationZone="LITTORAL"; weight=3.0} | ConvertTo-Json
Test-Endpoint "Tariff quote" "/tariffs/quote" POST $quoteBody $adminTk

Test-Endpoint "Client CANNOT access tariffs" "/tariffs" GET $null $clientTk $true

# ==============================================================================
#  11. PRICING MODULE
# ==============================================================================
Write-Host "`n=== 11. PRICING MODULE ===" -ForegroundColor Cyan

if ($parcel) {
    Test-Endpoint "Pricing quote for parcel" "/pricing/quote/$($parcel.id)" GET $null $clientTk
    Test-Endpoint "Pricing details" "/pricing-details/parcel/$($parcel.id)" GET $null $clientTk
    Test-Endpoint "All pricing details" "/pricing-details/parcel/$($parcel.id)/all" GET $null $adminTk
}

# ==============================================================================
#  12. PAYMENT MODULE
# ==============================================================================
Write-Host "`n=== 12. PAYMENT MODULE ===" -ForegroundColor Cyan

$payment = $null
if ($parcel) {
    $payBody = @{parcelId=$parcel.id; method="CASH"} | ConvertTo-Json
    $payment = Test-Endpoint "Client: Init payment (CASH)" "/payments/init" POST $payBody $clientTk
}

if ($payment) {
    Test-Endpoint "Get payment by ID" "/payments/$($payment.id)" GET $null $clientTk
    # CORRECTED: ConfirmPaymentRequest needs paymentId, success (boolean), optionally gatewayRef
    $confirmB = @{paymentId=$payment.id; success=$true; gatewayRef="TXN-CASH-001"} | ConvertTo-Json
    Test-Endpoint "Confirm payment" "/payments/confirm" POST $confirmB $adminTk
}

if ($parcel) { Test-Endpoint "Payments for parcel" "/payments/parcel/$($parcel.id)" GET $null $clientTk }
Test-Endpoint "Admin: List all payments" "/payments" GET $null $adminTk

# Registration payment
if ($parcel2) { Test-Endpoint "Registration payment" "/payments/registration/$($parcel2.id)" POST $null $clientTk }

# ==============================================================================
#  13. SCAN EVENT MODULE
# ==============================================================================
Write-Host "`n=== 13. SCAN EVENT MODULE ===" -ForegroundColor Cyan

# CORRECTED: ScanEventType values are: CREATED, ACCEPTED, IN_TRANSIT, etc. (not PICKUP)
if ($parcel) {
    $scanBody = @{
        parcelId=$parcel.id; eventType="AT_ORIGIN_AGENCY"
        latitude=3.8480; longitude=11.5021; locationSource="DEVICE_GPS"
        comment="Arrived at origin agency"
    } | ConvertTo-Json
    Test-Endpoint "Admin: Record scan event" "/scan-events" POST $scanBody $adminTk
    Test-Endpoint "Get scan events for parcel" "/scan-events/parcel/$($parcel.id)" GET $null $adminTk
}

# Scan via /parcels sub-route
if ($parcel) {
    $scanB2 = @{eventType="IN_TRANSIT"; latitude=4.0; longitude=9.7; locationSource="DEVICE_GPS"; comment="In transit to Douala"} | ConvertTo-Json
    Test-Endpoint "Scan parcel (via /parcels)" "/parcels/$($parcel.id)/scan" POST $scanB2 $adminTk
    Test-Endpoint "Get scan events (via /parcels)" "/parcels/$($parcel.id)/scan-events" GET $null $adminTk
}

# ==============================================================================
#  14. QR CODE MODULE
# ==============================================================================
Write-Host "`n=== 14. QR CODE MODULE ===" -ForegroundColor Cyan

if ($parcel) {
    Test-Endpoint "Get QR for parcel" "/qr/parcel/$($parcel.id)" GET $null $clientTk
    if ($parcel.trackingRef) { Test-Endpoint "Get QR by tracking ref" "/qr/tracking/$($parcel.trackingRef)" GET $null $clientTk }
    Test-Endpoint "Get QR image" "/qr/parcel/$($parcel.id)/image" GET $null $clientTk
    Test-Endpoint "Get QR label" "/qr/label/$($parcel.id)" GET $null $clientTk
    Test-Endpoint "Get parcel QR (via /parcels)" "/parcels/$($parcel.id)/qr" GET $null $clientTk
    Test-Endpoint "Print parcel QR" "/parcels/$($parcel.id)/qr/print" GET $null $clientTk
    Test-Endpoint "Generate secure QR" "/qr/secure/$($parcel.id)" POST $null $adminTk
}

Test-Endpoint "QR verify (POST)" "/qr/verify" POST '{"qrContent":"FAKE-QR"}' $adminTk

# ==============================================================================
#  15. TRACKING MODULE (Public)
# ==============================================================================
Write-Host "`n=== 15. TRACKING MODULE ===" -ForegroundColor Cyan

if ($parcel -and $parcel.trackingRef) {
    Test-Endpoint "Public: Track by ref" "/track/parcel/$($parcel.trackingRef)" GET $null $null
}
Test-Endpoint "Track nonexistent" "/track/parcel/FAKE-000" GET $null $null $true

# ==============================================================================
#  16. NOTIFICATION MODULE
# ==============================================================================
Write-Host "`n=== 16. NOTIFICATION MODULE ===" -ForegroundColor Cyan

Test-Endpoint "Client: My notifications" "/notifications/me" GET $null $clientTk
Test-Endpoint "Admin: List all notifications" "/notifications" GET $null $adminTk
if ($parcel) { Test-Endpoint "Notifications for parcel" "/notifications/parcel/$($parcel.id)" GET $null $adminTk }

if ($parcel) {
    $notifBody = @{parcelId=$parcel.id; type="STATUS_CHANGE"; message="Status changed"} | ConvertTo-Json
    Test-Endpoint "Trigger notification" "/notifications/trigger" POST $notifBody $adminTk
}

# ==============================================================================
#  17. PICKUP REQUEST MODULE
# ==============================================================================
Write-Host "`n=== 17. PICKUP REQUEST MODULE ===" -ForegroundColor Cyan

$pickup = $null
if ($parcel2) {
    $pickupBody = @{parcelId=$parcel2.id; pickupAddress="123 Rue Bastos, Yaounde"; preferredDate="2026-03-10"; notes="Call before"} | ConvertTo-Json
    $pickup = Test-Endpoint "Client: Create pickup request" "/pickups" POST $pickupBody $clientTk
}

if ($pickup) { Test-Endpoint "Get pickup by ID" "/pickups/$($pickup.id)" GET $null $clientTk }
Test-Endpoint "Client: My pickups" "/pickups/me" GET $null $clientTk
Test-Endpoint "Courier: My pickups" "/pickups/courier/me" GET $null $courierTk
Test-Endpoint "Admin: List all pickups" "/pickups" GET $null $adminTk
if ($parcel2) { Test-Endpoint "Pickup by parcel" "/pickups/by-parcel/$($parcel2.id)" GET $null $clientTk }

if ($pickup -and $courier) {
    $assignPBody = @{courierId=$courier.id} | ConvertTo-Json
    Test-Endpoint "Assign courier to pickup" "/pickups/$($pickup.id)/assign-courier" POST $assignPBody $adminTk
}
if ($pickup) { Test-Endpoint "Update pickup state" "/pickups/$($pickup.id)/state" PATCH '{"state":"CONFIRMED"}' $adminTk }

# ==============================================================================
#  18. INVOICE MODULE
# ==============================================================================
Write-Host "`n=== 18. INVOICE MODULE ===" -ForegroundColor Cyan

Test-Endpoint "Client: My invoices" "/invoices/me" GET $null $clientTk
if ($parcel) { Test-Endpoint "Invoice by parcel" "/invoices/by-parcel/$($parcel.id)" GET $null $clientTk }

# ==============================================================================
#  19. SUPPORT TICKET MODULE
# ==============================================================================
Write-Host "`n=== 19. SUPPORT TICKET MODULE ===" -ForegroundColor Cyan

$ticketBody = @{subject="Parcel damaged"; message="Help!"; category="COMPLAINT"} | ConvertTo-Json
$ticket = Test-Endpoint "Client: Create ticket" "/support/tickets" POST $ticketBody $clientTk

if ($ticket) {
    Test-Endpoint "Get ticket by ID" "/support/tickets/$($ticket.id)" GET $null $clientTk
    Test-Endpoint "Reply to ticket" "/support/tickets/$($ticket.id)/reply" POST '{"message":"We will investigate"}' $adminTk
    Test-Endpoint "Update ticket status" "/support/tickets/$($ticket.id)/status" PATCH '{"status":"IN_PROGRESS"}' $adminTk
}
Test-Endpoint "Client: My tickets" "/support/tickets/me" GET $null $clientTk
Test-Endpoint "Admin: List all tickets" "/support/tickets" GET $null $adminTk

# ==============================================================================
#  20. DASHBOARD MODULE
# ==============================================================================
Write-Host "`n=== 20. DASHBOARD MODULE ===" -ForegroundColor Cyan

Test-Endpoint "Admin: Dashboard summary" "/dashboard/summary" GET $null $adminTk
Test-Endpoint "Client: Dashboard summary" "/dashboard/summary" GET $null $clientTk
Test-Endpoint "Staff: Dashboard summary" "/dashboard/summary" GET $null $staffTk
Test-Endpoint "Unauth CANNOT access dashboard" "/dashboard/summary" GET $null $null $true

# ==============================================================================
#  21. FINANCE MODULE (FINANCE/ADMIN only)
# ==============================================================================
Write-Host "`n=== 21. FINANCE MODULE ===" -ForegroundColor Cyan

Test-Endpoint "Admin: Finance stats" "/finance/stats" GET $null $adminTk
Test-Endpoint "Finance: Finance stats" "/finance/stats" GET $null $financeTk
Test-Endpoint "Admin: Finance refunds" "/finance/refunds" GET $null $adminTk
Test-Endpoint "Client CANNOT access finance" "/finance/stats" GET $null $clientTk $true
Test-Endpoint "Agent CANNOT access finance" "/finance/stats" GET $null $agentTk $true
Test-Endpoint "Courier CANNOT access finance" "/finance/stats" GET $null $courierTk $true

# ==============================================================================
#  22. RISK MODULE (RISK/ADMIN only)
# ==============================================================================
Write-Host "`n=== 22. RISK MODULE ===" -ForegroundColor Cyan

Test-Endpoint "Admin: Risk alerts" "/risk/alerts" GET $null $adminTk
Test-Endpoint "Risk: Risk alerts" "/risk/alerts" GET $null $riskTk
Test-Endpoint "Admin: Create risk alert" "/risk" POST '{"type":"SUSPICIOUS_ACTIVITY","description":"Flagged sender","severity":"HIGH"}' $adminTk
Test-Endpoint "Client CANNOT access risk" "/risk/alerts" GET $null $clientTk $true
Test-Endpoint "Agent CANNOT access risk" "/risk/alerts" GET $null $agentTk $true

# ==============================================================================
#  23. REFUND MODULE
# ==============================================================================
Write-Host "`n=== 23. REFUND MODULE ===" -ForegroundColor Cyan

if ($payment) {
    $refundBody = @{paymentId=$payment.id; reason="Not delivered on time"; amount=500} | ConvertTo-Json
    $refund = Test-Endpoint "Client: Request refund" "/refunds" POST $refundBody $clientTk
    if ($refund) {
        Test-Endpoint "Get refund by ID" "/refunds/$($refund.id)" GET $null $clientTk
        Test-Endpoint "Update refund status" "/refunds/$($refund.id)/status" PATCH '{"status":"APPROVED"}' $adminTk
    }
    Test-Endpoint "Refunds for payment" "/refunds/payment/$($payment.id)" GET $null $clientTk
}
Test-Endpoint "Admin: List all refunds" "/refunds" GET $null $adminTk

# ==============================================================================
#  24. DELIVERY MODULE
# ==============================================================================
Write-Host "`n=== 24. DELIVERY MODULE ===" -ForegroundColor Cyan

if ($parcel) {
    $startBody = @{parcelId=$parcel.id; latitude=4.05; longitude=9.70; notes="Starting delivery"} | ConvertTo-Json
    Test-Endpoint "Courier: Start delivery" "/delivery/start" POST $startBody $courierTk

    $otpSendBody = @{parcelId=$parcel.id; phoneNumber="+237677000044"; latitude=4.05; longitude=9.70} | ConvertTo-Json
    Test-Endpoint "Send delivery OTP" "/delivery/otp/send" POST $otpSendBody $courierTk

    $otpVerifyBody = @{parcelId=$parcel.id; otpCode="123456"; latitude=4.05; longitude=9.70} | ConvertTo-Json
    Test-Endpoint "Verify delivery OTP (wrong)" "/delivery/otp/verify" POST $otpVerifyBody $courierTk
}

# ==============================================================================
#  25. DELIVERY RECEIPT MODULE
# ==============================================================================
Write-Host "`n=== 25. DELIVERY RECEIPT MODULE ===" -ForegroundColor Cyan

if ($parcel) { Test-Endpoint "Get receipt for parcel" "/receipts/parcel/$($parcel.id)" GET $null $clientTk }

# ==============================================================================
#  26. LOCATION MODULE
# ==============================================================================
Write-Host "`n=== 26. LOCATION MODULE ===" -ForegroundColor Cyan

Test-Endpoint "Courier: Update location" "/location/update" POST '{"latitude":3.85,"longitude":11.50,"accuracy":15}' $courierTk
Test-Endpoint "Courier: My location" "/location/me" GET $null $courierTk
Test-Endpoint "Client: My location" "/location/me" GET $null $clientTk
Test-Endpoint "Agent: Update location" "/location/update" POST '{"latitude":3.86,"longitude":11.51,"accuracy":10}' $agentTk

# ==============================================================================
#  27. MAP MODULE
# ==============================================================================
Write-Host "`n=== 27. MAP MODULE ===" -ForegroundColor Cyan

if ($parcel) { Test-Endpoint "Map: parcel location" "/map/parcels/$($parcel.id)" GET $null $clientTk }
Test-Endpoint "Map: courier me" "/map/couriers/me" GET $null $courierTk
Test-Endpoint "Map: admin overview" "/map/admin/overview" GET $null $adminTk

# ==============================================================================
#  28. GEOLOCATION MODULE
# ==============================================================================
Write-Host "`n=== 28. GEOLOCATION MODULE ===" -ForegroundColor Cyan

Test-Endpoint "Geocode address" "/geo/geocode" POST '{"address":"Bastos, Yaounde, Cameroon"}' $clientTk
Test-Endpoint "Geo search" "/geo/search" POST '{"query":"Post office Yaounde"}' $clientTk
Test-Endpoint "Route ETA" "/geo/route-eta" POST '{"originLat":3.85,"originLng":11.50,"destLat":4.05,"destLng":9.70}' $clientTk

# ==============================================================================
#  29. SELF-HEALING MODULE
# ==============================================================================
Write-Host "`n=== 29. SELF-HEALING MODULE ===" -ForegroundColor Cyan

Test-Endpoint "Admin: Congestion overview" "/self-healing/congestion" GET $null $adminTk
if ($ag1) { Test-Endpoint "Congestion by agency" "/self-healing/congestion/agency/$($ag1.id)" GET $null $adminTk }
Test-Endpoint "Healing actions" "/self-healing/actions" GET $null $adminTk
if ($courier) { Test-Endpoint "Route for courier" "/self-healing/route/courier/$($courier.id)" GET $null $adminTk }

# ==============================================================================
#  30. OFFLINE SYNC MODULE
# ==============================================================================
Write-Host "`n=== 30. OFFLINE SYNC MODULE ===" -ForegroundColor Cyan

$syncBody = '{"events":[{"type":"SCAN","data":"test"}]}' 
Test-Endpoint "Offline sync" "/offline/sync" POST $syncBody $courierTk

# ==============================================================================
#  31. USSD MODULE
# ==============================================================================
Write-Host "`n=== 31. USSD MODULE ===" -ForegroundColor Cyan

Test-Endpoint "USSD handle" "/ussd/handle" POST '{"sessionId":"sess-001","serviceCode":"*123#","phoneNumber":"+237699000001","text":""}' $clientTk

# ==============================================================================
#  32. INTEGRATION CONFIG
# ==============================================================================
Write-Host "`n=== 32. INTEGRATION CONFIG ===" -ForegroundColor Cyan

Test-Endpoint "List integrations" "/integrations" GET $null $adminTk

# ==============================================================================
#  33. CROSS-ROLE ACCESS CONTROL
# ==============================================================================
Write-Host "`n=== 33. CROSS-ROLE ACCESS CONTROL ===" -ForegroundColor Cyan

Test-Endpoint "Client CANNOT list all parcels" "/parcels" GET $null $clientTk $true
Test-Endpoint "Agent CANNOT access admin users" "/admin/users" GET $null $agentTk $true
Test-Endpoint "Courier CANNOT access admin users" "/admin/users" GET $null $courierTk $true
Test-Endpoint "Courier CANNOT access finance" "/finance/stats" GET $null $courierTk $true
Test-Endpoint "Agent CANNOT access risk" "/risk/alerts" GET $null $agentTk $true
Test-Endpoint "Courier CANNOT create staff" "/staff" POST $staffBody $courierTk $true
Test-Endpoint "Staff CANNOT create parcel" "/parcels" POST '{"test":"data"}' $staffTk $true
Test-Endpoint "Client CANNOT access delivery" "/delivery/start" POST '{"test":"data"}' $clientTk $true

# ==============================================================================
#                        FINAL REPORT
# ==============================================================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "     COMPREHENSIVE TEST RESULTS SUMMARY" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

$pass = ($results | Where-Object { $_ -match "^\[PASS" }).Count
$fail = ($results | Where-Object { $_ -match "^\[FAIL" }).Count
$unexpected = ($results | Where-Object { $_ -match "^\[UNEXPECTED" }).Count

$results | ForEach-Object {
    if ($_ -match "^\[PASS") { Write-Host $_ -ForegroundColor Green }
    elseif ($_ -match "^\[FAIL") { Write-Host $_ -ForegroundColor Red }
    elseif ($_ -match "^\[UNEXPECTED") { Write-Host $_ -ForegroundColor Magenta }
}

Write-Host "--------------------------------------------"
Write-Host "TOTAL: $($results.Count)  PASS: $pass  FAIL: $fail  UNEXPECTED: $unexpected" -ForegroundColor White
Write-Host "============================================"

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "        ERRORS REQUIRING FIXES" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    $i = 1
    $errors | ForEach-Object { Write-Host "$i. $_" -ForegroundColor Red; $i++ }
    Write-Host "============================================" -ForegroundColor Red
}
