# SmartCAMPOST Test Script V1 — Role-based API tests
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
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

# ==============================================================================
#  1. AUTH MODULE - Public endpoints
# ==============================================================================
Write-Host "=== 1. AUTH MODULE ===" -ForegroundColor Cyan

# Admin login
$adminLogin = Test-Endpoint "Admin login (password)" "/auth/login" POST '{"phone":"+237690000000","password":"Admin@SmartCAMPOST2026"}'
$adminTk = $adminLogin.accessToken
if (-not $adminTk) { Write-Host "CRITICAL: Admin login failed - cannot proceed!" -ForegroundColor Red; exit 1 }

# Register a CLIENT
$otpResp = Test-Endpoint "Send OTP for registration" "/auth/send-otp" POST '{"phone":"+237699000001"}'
$otp = $otpResp.otp
$regBody = @{phone="+237699000001"; password="Client@2026!"; fullName="Marie Ngono"; email="marie@test.cm"; otp=$otp} | ConvertTo-Json
$regResp = Test-Endpoint "Register CLIENT" "/auth/register" POST $regBody
$clientTk = $regResp.accessToken

# Client login 
$cliLogin = Test-Endpoint "Client login (password)" "/auth/login" POST '{"phone":"+237699000001","password":"Client@2026!"}'
$clientTk = $cliLogin.accessToken

# OTP login flow
$null = Test-Endpoint "Request OTP for login" "/auth/login/otp/request" POST '{"phone":"+237699000001"}'
# We can't test OTP confirm easily without capturing OTP

# Password reset flow
$null = Test-Endpoint "Request password reset" "/auth/password/reset/request" POST '{"phone":"+237699000001"}'

# Wrong password / nonexistent
Test-Endpoint "Wrong password" "/auth/login" POST '{"phone":"+237699000001","password":"wrong"}' $null $true
Test-Endpoint "Nonexistent user login" "/auth/login" POST '{"phone":"+237600000000","password":"test"}' $null $true

# Verify OTP
Test-Endpoint "Verify OTP (random code)" "/auth/verify-otp" POST '{"phone":"+237699000001","otp":"000000"}' $null $true

# ==============================================================================
#  2. AGENCY MODULE (Admin creates agencies)
# ==============================================================================
Write-Host ""
Write-Host "=== 2. AGENCY MODULE ===" -ForegroundColor Cyan

$ag1 = Test-Endpoint "Create agency (Yaounde)" "/agencies" POST '{"agencyName":"Yaounde HQ","agencyCode":"YDE-HQ","city":"Yaounde","region":"Centre"}' $adminTk
$ag2 = Test-Endpoint "Create agency (Douala)" "/agencies" POST '{"agencyName":"Douala Port","agencyCode":"DLA-PT","city":"Douala","region":"Littoral"}' $adminTk
Test-Endpoint "List agencies" "/agencies" GET $null $adminTk
if ($ag1) { Test-Endpoint "Get agency by ID" "/agencies/$($ag1.id)" GET $null $adminTk }
if ($ag1) { Test-Endpoint "Update agency" "/agencies/$($ag1.id)" PUT '{"agencyName":"Yaounde Central","agencyCode":"YDE-HQ","city":"Yaounde","region":"Centre"}' $adminTk }

# ==============================================================================
#  3. ADMIN MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 3. ADMIN MODULE ===" -ForegroundColor Cyan

Test-Endpoint "Admin: List all users" "/admin/users" GET $null $adminTk
Test-Endpoint "Admin: List clients by role" "/admin/users/by-role?role=CLIENT" GET $null $adminTk
Test-Endpoint "Admin: List admins by role" "/admin/users/by-role?role=ADMIN" GET $null $adminTk

# Unauthorized access
Test-Endpoint "Client cannot access admin" "/admin/users" GET $null $clientTk $true
Test-Endpoint "Unauth cannot access admin" "/admin/users" GET $null $null $true

# ==============================================================================
#  4. CLIENT PROFILE MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 4. CLIENT PROFILE MODULE ===" -ForegroundColor Cyan

Test-Endpoint "Client: Get my profile" "/clients/me" GET $null $clientTk
Test-Endpoint "Client: Update my profile" "/clients/me" PUT '{"fullName":"Marie Ngono Updated","email":"marie.updated@test.cm","phone":"+237699000001"}' $clientTk
Test-Endpoint "Client: Update language" "/clients/me/preferred-language" PATCH '{"preferredLanguage":"EN"}' $clientTk
Test-Endpoint "Admin: List clients" "/clients" GET $null $adminTk
Test-Endpoint "Unauth: Get profile" "/clients/me" GET $null $null $true

# ==============================================================================
#  5. STAFF MODULE (Admin creates staff)
# ==============================================================================
Write-Host ""
Write-Host "=== 5. STAFF MODULE ===" -ForegroundColor Cyan

$staffBody = @{fullName="Staff Jean"; phone="+237699000005"; password="Staff@2026!"; staffNumber="STF-001"; department="Operations"} | ConvertTo-Json
$staff = Test-Endpoint "Admin: Create STAFF" "/staff" POST $staffBody $adminTk

if ($staff) {
    Test-Endpoint "Admin: Get staff by ID" "/staff/$($staff.id)" GET $null $adminTk
}
Test-Endpoint "Admin: List staff" "/staff" GET $null $adminTk

# Staff login
$staffLogin = Test-Endpoint "Staff login" "/auth/login" POST '{"phone":"+237699000005","password":"Staff@2026!"}'
$null = $staffLogin.accessToken

# Staff status update
if ($staff) {
    $statusBody = @{status="ACTIVE"} | ConvertTo-Json
    Test-Endpoint "Admin: Update staff status" "/staff/$($staff.id)/status" PATCH $statusBody $adminTk
}

# Staff role update
if ($staff) {
    $roleBody = @{role="FINANCE"} | ConvertTo-Json
    Test-Endpoint "Admin: Update staff role" "/staff/$($staff.id)/role" PATCH $roleBody $adminTk
}

# Client cannot create staff
Test-Endpoint "Client cannot create staff" "/staff" POST $staffBody $clientTk $true

# ==============================================================================
#  6. AGENT MODULE (Admin creates agents)
# ==============================================================================
Write-Host ""
Write-Host "=== 6. AGENT MODULE ===" -ForegroundColor Cyan

if ($ag1) {
    $agentBody = @{fullName="Agent Pierre"; phone="+237699000010"; password="Agent@2026!"; staffNumber="AGT-001"; agencyId=$ag1.id} | ConvertTo-Json
    $agent = Test-Endpoint "Admin: Create AGENT" "/agents" POST $agentBody $adminTk
} else {
    $agentBody = @{fullName="Agent Pierre"; phone="+237699000010"; password="Agent@2026!"; staffNumber="AGT-001"} | ConvertTo-Json
    $agent = Test-Endpoint "Admin: Create AGENT (no agency)" "/agents" POST $agentBody $adminTk
}

if ($agent) {
    Test-Endpoint "Get agent by ID" "/agents/$($agent.id)" GET $null $adminTk
}
Test-Endpoint "List agents" "/agents" GET $null $adminTk

# Agent login
$agentLogin = Test-Endpoint "Agent login" "/auth/login" POST '{"phone":"+237699000010","password":"Agent@2026!"}'
$agentTk = $agentLogin.accessToken

# Agent status update
if ($agent) {
    Test-Endpoint "Update agent status" "/agents/$($agent.id)/status" PATCH '{"status":"ACTIVE"}' $adminTk
}

# Agent agency assignment
if ($agent -and $ag2) {
    $assignBody = @{agencyId=$ag2.id} | ConvertTo-Json
    Test-Endpoint "Assign agent to agency" "/agents/$($agent.id)/agency" PATCH $assignBody $adminTk
}

# Client cannot create agents
Test-Endpoint "Client cannot create agent" "/agents" POST $agentBody $clientTk $true

# ==============================================================================
#  7. COURIER MODULE (Admin creates couriers)
# ==============================================================================
Write-Host ""
Write-Host "=== 7. COURIER MODULE ===" -ForegroundColor Cyan

$courierBody = @{fullName="Courier Paul"; phone="+237699000020"; password="Courier@2026!"; vehicleIdentifier="CM-YDE-123"} | ConvertTo-Json
$courier = Test-Endpoint "Admin: Create COURIER" "/couriers" POST $courierBody $adminTk

if ($courier) {
    Test-Endpoint "Get courier by ID" "/couriers/$($courier.id)" GET $null $adminTk
}
Test-Endpoint "List couriers" "/couriers" GET $null $adminTk

# Courier login
$courierLogin = Test-Endpoint "Courier login" "/auth/login" POST '{"phone":"+237699000020","password":"Courier@2026!"}'
$courierTk = $courierLogin.accessToken

# Courier status update
if ($courier) {
    Test-Endpoint "Update courier status" "/couriers/$($courier.id)/status" PATCH '{"status":"ACTIVE"}' $adminTk
}

# Courier vehicle update
if ($courier) {
    Test-Endpoint "Update courier vehicle" "/couriers/$($courier.id)/vehicle" PATCH '{"vehicleIdentifier":"CM-DLA-456"}' $adminTk
}

# Client cannot create courier
Test-Endpoint "Client cannot create courier" "/couriers" POST $courierBody $clientTk $true

# ==============================================================================
#  8. ADDRESS MODULE (Client creates addresses)
# ==============================================================================
Write-Host ""
Write-Host "=== 8. ADDRESS MODULE ===" -ForegroundColor Cyan

$addr1 = Test-Endpoint "Client: Create sender address" "/addresses" POST '{"label":"Home","fullName":"Marie Ngono","phone":"+237699000001","city":"Yaounde","neighbourhood":"Bastos","street":"Rue 1234","region":"Centre","country":"CM"}' $clientTk
$addr2 = Test-Endpoint "Client: Create recipient address" "/addresses" POST '{"label":"Office","fullName":"Paul Recipient","phone":"+237677000044","city":"Douala","neighbourhood":"Bonanjo","street":"Blvd Liberte","region":"Littoral","country":"CM"}' $clientTk
Test-Endpoint "Client: List my addresses" "/addresses/me" GET $null $clientTk
if ($addr1) { Test-Endpoint "Client: Get address by ID" "/addresses/$($addr1.id)" GET $null $clientTk }
if ($addr1) { Test-Endpoint "Client: Update address" "/addresses/$($addr1.id)" PUT '{"label":"Home Updated","fullName":"Marie Ngono","phone":"+237699000001","city":"Yaounde","neighbourhood":"Bastos","street":"Rue 5678","region":"Centre","country":"CM"}' $clientTk }

# ==============================================================================
#  9. PARCEL MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 9. PARCEL MODULE ===" -ForegroundColor Cyan

$parcel = $null
if ($addr1 -and $addr2 -and $ag1 -and $ag2) {
    $parcelBody = @{
        senderAddressId=$addr1.id
        recipientAddressId=$addr2.id
        originAgencyId=$ag1.id
        destinationAgencyId=$ag2.id
        weight=3.0
        serviceType="STANDARD"
        deliveryOption="AGENCY"
        paymentOption="PREPAID"
        fragile=$false
        descriptionComment="Test Books Parcel"
    } | ConvertTo-Json
    $parcel = Test-Endpoint "Client: Create parcel" "/parcels" POST $parcelBody $clientTk
}

if ($parcel) {
    Test-Endpoint "Client: List my parcels" "/parcels/me" GET $null $clientTk
    Test-Endpoint "Client: Get parcel by ID" "/parcels/$($parcel.id)" GET $null $clientTk
    if ($parcel.trackingRef) {
        Test-Endpoint "Get parcel by tracking ref" "/parcels/tracking/$($parcel.trackingRef)" GET $null $clientTk
    }
}

Test-Endpoint "Admin: List all parcels" "/parcels" GET $null $adminTk

# Accept parcel with validation (Agent/Admin)
if ($parcel) {
    $acceptBody = @{latitude=3.8480; longitude=11.5021; descriptionConfirmed=$true; validationComment="Looks good"} | ConvertTo-Json
    Test-Endpoint "Admin: Accept parcel with validation" "/parcels/$($parcel.id)/validate" PATCH $acceptBody $adminTk
}

# Check can-correct
if ($parcel) {
    Test-Endpoint "Check can-correct parcel" "/parcels/$($parcel.id)/can-correct" GET $null $adminTk
}

# Change delivery option
if ($parcel) {
    Test-Endpoint "Change delivery option" "/parcels/$($parcel.id)/delivery-option" PATCH '{"deliveryOption":"HOME","deliveryAddress":"123 Rue Example, Douala"}' $clientTk
}

# Update parcel metadata
if ($parcel) {
    Test-Endpoint "Update parcel metadata" "/parcels/$($parcel.id)/metadata" PATCH '{"photoUrl":"https://example.com/photo.jpg","comment":"Fragile items inside"}' $clientTk
}

# Update parcel status
if ($parcel) {
    $statusReqBody = @{status="IN_TRANSIT"; latitude=3.85; longitude=11.50; locationSource="DEVICE_GPS"; comment="In transit"} | ConvertTo-Json
    Test-Endpoint "Admin: Update parcel status" "/parcels/$($parcel.id)/status" PATCH $statusReqBody $adminTk
}

# Create a second parcel for more tests
$parcel2 = $null
if ($addr1 -and $addr2 -and $ag1 -and $ag2) {
    $parcel2Body = @{
        senderAddressId=$addr1.id
        recipientAddressId=$addr2.id
        originAgencyId=$ag1.id
        destinationAgencyId=$ag2.id
        weight=1.5
        serviceType="EXPRESS"
        deliveryOption="HOME"
        paymentOption="COD"
        fragile=$true
        descriptionComment="Fragile Electronics"
    } | ConvertTo-Json
    $parcel2 = Test-Endpoint "Client: Create 2nd parcel (EXPRESS/COD)" "/parcels" POST $parcel2Body $clientTk
}

# ==============================================================================
#  10. TARIFF MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 10. TARIFF MODULE ===" -ForegroundColor Cyan

$tariff = Test-Endpoint "Admin: Create tariff" "/tariffs" POST '{"serviceType":"STANDARD","minWeight":0,"maxWeight":5.0,"baseFee":1000,"perKgFee":200,"currency":"XAF"}' $adminTk
if ($tariff) {
    Test-Endpoint "Get tariff by ID" "/tariffs/$($tariff.id)" GET $null $adminTk
    Test-Endpoint "Update tariff" "/tariffs/$($tariff.id)" PUT '{"serviceType":"STANDARD","minWeight":0,"maxWeight":5.0,"baseFee":1200,"perKgFee":250,"currency":"XAF"}' $adminTk
}
Test-Endpoint "List all tariffs" "/tariffs" GET $null $adminTk

# Tariff quote
Test-Endpoint "Tariff quote" "/tariffs/quote" POST '{"serviceType":"STANDARD","weight":3.0}' $adminTk

# Client cannot access tariffs
Test-Endpoint "Client cannot access tariffs" "/tariffs" GET $null $clientTk $true

# ==============================================================================
#  11. PRICING MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 11. PRICING MODULE ===" -ForegroundColor Cyan

if ($parcel) {
    Test-Endpoint "Get pricing quote" "/pricing/quote/$($parcel.id)" GET $null $clientTk
}

# Pricing details
if ($parcel) {
    Test-Endpoint "Get pricing details" "/pricing-details/parcel/$($parcel.id)" GET $null $clientTk
    Test-Endpoint "Get all pricing details" "/pricing-details/parcel/$($parcel.id)/all" GET $null $adminTk
}

# ==============================================================================
#  12. PAYMENT MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 12. PAYMENT MODULE ===" -ForegroundColor Cyan

$payment = $null
if ($parcel) {
    $payBody = @{parcelId=$parcel.id; method="CASH"} | ConvertTo-Json
    $payment = Test-Endpoint "Client: Init payment (CASH)" "/payments/init" POST $payBody $clientTk
}

if ($payment) {
    Test-Endpoint "Get payment by ID" "/payments/$($payment.id)" GET $null $clientTk
    # Confirm payment
    $confirmBody = @{paymentId=$payment.id; status="CONFIRMED"; transactionRef="TXN-001"} | ConvertTo-Json
    Test-Endpoint "Confirm payment" "/payments/confirm" POST $confirmBody $adminTk
}

if ($parcel) {
    Test-Endpoint "Payments for parcel" "/payments/parcel/$($parcel.id)" GET $null $clientTk
}

Test-Endpoint "Admin: List all payments" "/payments" GET $null $adminTk

# Payment summary
Test-Endpoint "Admin: Payment summary" "/payments/summary" GET $null $adminTk

# ==============================================================================
#  13. SCAN EVENT MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 13. SCAN EVENT MODULE ===" -ForegroundColor Cyan

if ($parcel) {
    $scanBody = @{
        parcelId=$parcel.id
        eventType="PICKUP"
        latitude=3.8480
        longitude=11.5021
        locationSource="DEVICE_GPS"
        comment="Picked up from sender"
    } | ConvertTo-Json
    Test-Endpoint "Admin: Record scan event" "/scan-events" POST $scanBody $adminTk
    Test-Endpoint "Get scan events for parcel" "/scan-events/parcel/$($parcel.id)" GET $null $adminTk
}

# Scan via parcel route
if ($parcel) {
    $scanBody2 = @{
        eventType="TRANSIT"
        latitude=4.0
        longitude=9.7
        locationSource="DEVICE_GPS"
        comment="Arriving at Douala hub"
    } | ConvertTo-Json
    Test-Endpoint "Scan parcel (via /parcels)" "/parcels/$($parcel.id)/scan" POST $scanBody2 $adminTk
    Test-Endpoint "Get scan events (via /parcels)" "/parcels/$($parcel.id)/scan-events" GET $null $adminTk
}

# ==============================================================================
#  14. QR CODE MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 14. QR CODE MODULE ===" -ForegroundColor Cyan

if ($parcel) {
    Test-Endpoint "Get QR for parcel" "/qr/parcel/$($parcel.id)" GET $null $clientTk
    if ($parcel.trackingRef) {
        Test-Endpoint "Get QR by tracking ref" "/qr/tracking/$($parcel.trackingRef)" GET $null $clientTk
    }
    Test-Endpoint "Get QR image" "/qr/parcel/$($parcel.id)/image" GET $null $clientTk
    Test-Endpoint "Get QR label" "/qr/label/$($parcel.id)" GET $null $clientTk

    # QR sub-route on parcels
    Test-Endpoint "Get parcel QR (via /parcels)" "/parcels/$($parcel.id)/qr" GET $null $clientTk
    Test-Endpoint "Print parcel QR" "/parcels/$($parcel.id)/qr/print" GET $null $clientTk
}

# QR verify
Test-Endpoint "QR verify (POST)" "/qr/verify" POST '{"qrContent":"TEST-QR-CODE"}' $adminTk

# QR secure generate
if ($parcel) {
    Test-Endpoint "Generate secure QR" "/qr/secure/$($parcel.id)" POST $null $adminTk
}

# ==============================================================================
#  15. TRACKING MODULE (Public)
# ==============================================================================
Write-Host ""
Write-Host "=== 15. TRACKING MODULE ===" -ForegroundColor Cyan

if ($parcel -and $parcel.trackingRef) {
    Test-Endpoint "Public: Track by ref" "/track/parcel/$($parcel.trackingRef)" GET $null $null
}
Test-Endpoint "Track nonexistent" "/track/parcel/FAKE-REF-000" GET $null $null $true

# ==============================================================================
#  16. NOTIFICATION MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 16. NOTIFICATION MODULE ===" -ForegroundColor Cyan

Test-Endpoint "Client: My notifications" "/notifications/me" GET $null $clientTk
Test-Endpoint "Admin: List all notifications" "/notifications" GET $null $adminTk

if ($parcel) {
    Test-Endpoint "Notifications for parcel" "/notifications/parcel/$($parcel.id)" GET $null $adminTk
}

# Trigger notification
if ($parcel) {
    $notifBody = @{parcelId=$parcel.id; type="STATUS_CHANGE"; message="Your parcel status changed"} | ConvertTo-Json
    Test-Endpoint "Trigger notification" "/notifications/trigger" POST $notifBody $adminTk
}

# ==============================================================================
#  17. PICKUP REQUEST MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 17. PICKUP REQUEST MODULE ===" -ForegroundColor Cyan

$pickup = $null
if ($parcel2) {
    $pickupBody = @{
        parcelId=$parcel2.id
        pickupAddress="123 Rue Bastos, Yaounde"
        preferredDate="2026-03-10"
        notes="Please call before coming"
    } | ConvertTo-Json
    $pickup = Test-Endpoint "Client: Create pickup request" "/pickups" POST $pickupBody $clientTk
}

if ($pickup) {
    Test-Endpoint "Get pickup by ID" "/pickups/$($pickup.id)" GET $null $clientTk
}

Test-Endpoint "Client: My pickups" "/pickups/me" GET $null $clientTk
Test-Endpoint "Courier: My assigned pickups" "/pickups/courier/me" GET $null $courierTk
Test-Endpoint "Admin: List all pickups" "/pickups" GET $null $adminTk

if ($parcel2) {
    Test-Endpoint "Get pickup by parcel" "/pickups/by-parcel/$($parcel2.id)" GET $null $clientTk
}

# Assign courier to pickup
if ($pickup -and $courier) {
    $assignPickupBody = @{courierId=$courier.id} | ConvertTo-Json
    Test-Endpoint "Assign courier to pickup" "/pickups/$($pickup.id)/assign-courier" POST $assignPickupBody $adminTk
}

# Update pickup state
if ($pickup) {
    Test-Endpoint "Update pickup state" "/pickups/$($pickup.id)/state" PATCH '{"state":"CONFIRMED"}' $adminTk
}

# ==============================================================================
#  18. INVOICE MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 18. INVOICE MODULE ===" -ForegroundColor Cyan

Test-Endpoint "Client: My invoices" "/invoices/me" GET $null $clientTk

if ($parcel) {
    Test-Endpoint "Invoice by parcel" "/invoices/by-parcel/$($parcel.id)" GET $null $clientTk
}

# ==============================================================================
#  19. SUPPORT TICKET MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 19. SUPPORT TICKET MODULE ===" -ForegroundColor Cyan

$ticketBody = @{subject="Parcel damaged"; message="My parcel arrived damaged, please help"; category="COMPLAINT"} | ConvertTo-Json
$ticket = Test-Endpoint "Client: Create support ticket" "/support/tickets" POST $ticketBody $clientTk

if ($ticket) {
    Test-Endpoint "Get ticket by ID" "/support/tickets/$($ticket.id)" GET $null $clientTk
    Test-Endpoint "Reply to ticket" "/support/tickets/$($ticket.id)/reply" POST '{"message":"Thanks for reporting, we will investigate"}' $adminTk
    Test-Endpoint "Update ticket status" "/support/tickets/$($ticket.id)/status" PATCH '{"status":"IN_PROGRESS"}' $adminTk
}

Test-Endpoint "Client: My tickets" "/support/tickets/me" GET $null $clientTk
Test-Endpoint "Admin: List all tickets" "/support/tickets" GET $null $adminTk

# ==============================================================================
#  20. DASHBOARD MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 20. DASHBOARD MODULE ===" -ForegroundColor Cyan

Test-Endpoint "Admin: Dashboard summary" "/dashboard/summary" GET $null $adminTk
Test-Endpoint "Client: Dashboard summary" "/dashboard/summary" GET $null $clientTk
Test-Endpoint "Unauth: Dashboard" "/dashboard/summary" GET $null $null $true

# ==============================================================================
#  21. FINANCE MODULE (FINANCE/ADMIN only)
# ==============================================================================
Write-Host ""
Write-Host "=== 21. FINANCE MODULE ===" -ForegroundColor Cyan

Test-Endpoint "Admin: Finance stats" "/finance/stats" GET $null $adminTk
Test-Endpoint "Admin: Finance refunds" "/finance/refunds" GET $null $adminTk
Test-Endpoint "Client cannot access finance" "/finance/stats" GET $null $clientTk $true

# ==============================================================================
#  22. RISK MODULE (RISK/ADMIN only)
# ==============================================================================
Write-Host ""
Write-Host "=== 22. RISK MODULE ===" -ForegroundColor Cyan

Test-Endpoint "Admin: Risk alerts" "/risk/alerts" GET $null $adminTk
Test-Endpoint "Client cannot access risk" "/risk/alerts" GET $null $clientTk $true

# Create risk alert
Test-Endpoint "Admin: Create risk alert" "/risk" POST '{"type":"SUSPICIOUS_ACTIVITY","description":"Multiple parcels from same sender flagged","severity":"HIGH"}' $adminTk

# ==============================================================================
#  23. REFUND MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 23. REFUND MODULE ===" -ForegroundColor Cyan

if ($payment) {
    $refundBody = @{paymentId=$payment.id; reason="Parcel not delivered on time"; amount=500} | ConvertTo-Json
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
Write-Host ""
Write-Host "=== 24. DELIVERY MODULE ===" -ForegroundColor Cyan

if ($parcel) {
    # Start delivery
    $startBody = @{parcelId=$parcel.id; latitude=4.05; longitude=9.70; notes="Starting delivery"} | ConvertTo-Json
    Test-Endpoint "Courier: Start delivery" "/delivery/start" POST $startBody $courierTk

    # Send OTP
    $otpSendBody = @{parcelId=$parcel.id; phoneNumber="+237677000044"; latitude=4.05; longitude=9.70} | ConvertTo-Json
    Test-Endpoint "Send delivery OTP" "/delivery/otp/send" POST $otpSendBody $courierTk

    # Verify OTP (will fail with wrong code but tests endpoint existence)
    $otpVerifyBody = @{parcelId=$parcel.id; otpCode="123456"; latitude=4.05; longitude=9.70} | ConvertTo-Json
    Test-Endpoint "Verify delivery OTP (wrong code)" "/delivery/otp/verify" POST $otpVerifyBody $courierTk
}

# ==============================================================================
#  25. DELIVERY RECEIPT MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 25. DELIVERY RECEIPT MODULE ===" -ForegroundColor Cyan

if ($parcel) {
    Test-Endpoint "Get receipt for parcel" "/receipts/parcel/$($parcel.id)" GET $null $clientTk
}

# ==============================================================================
#  26. LOCATION MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 26. LOCATION MODULE ===" -ForegroundColor Cyan

$locBody = @{latitude=3.85; longitude=11.50; accuracy=15} | ConvertTo-Json
Test-Endpoint "Courier: Update location" "/location/update" POST $locBody $courierTk
Test-Endpoint "Courier: My location" "/location/me" GET $null $courierTk
Test-Endpoint "Client: My location" "/location/me" GET $null $clientTk

# ==============================================================================
#  27. MAP MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 27. MAP MODULE ===" -ForegroundColor Cyan

if ($parcel) {
    Test-Endpoint "Map: parcel location" "/map/parcels/$($parcel.id)" GET $null $clientTk
}
Test-Endpoint "Map: courier me" "/map/couriers/me" GET $null $courierTk
Test-Endpoint "Map: admin overview" "/map/admin/overview" GET $null $adminTk

# ==============================================================================
#  28. GEOLOCATION MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 28. GEOLOCATION MODULE ===" -ForegroundColor Cyan

Test-Endpoint "Geocode address" "/geo/geocode" POST '{"address":"Bastos, Yaounde, Cameroon"}' $clientTk
Test-Endpoint "Geo search" "/geo/search" POST '{"query":"Post office Yaounde"}' $clientTk
Test-Endpoint "Route ETA" "/geo/route-eta" POST '{"originLat":3.85,"originLng":11.50,"destLat":4.05,"destLng":9.70}' $clientTk

# ==============================================================================
#  29. SELF-HEALING MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 29. SELF-HEALING MODULE ===" -ForegroundColor Cyan

Test-Endpoint "Admin: Congestion overview" "/self-healing/congestion" GET $null $adminTk
if ($ag1) {
    Test-Endpoint "Congestion by agency" "/self-healing/congestion/agency/$($ag1.id)" GET $null $adminTk
}
Test-Endpoint "Healing actions" "/self-healing/actions" GET $null $adminTk
if ($courier) {
    Test-Endpoint "Route for courier" "/self-healing/route/courier/$($courier.id)" GET $null $adminTk
}

# ==============================================================================
#  30. OFFLINE SYNC MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 30. OFFLINE SYNC MODULE ===" -ForegroundColor Cyan

$syncBody = @{events=@(@{type="SCAN"; parcelId="00000000-0000-0000-0000-000000000000"; timestamp="2026-03-08T10:00:00Z"})} | ConvertTo-Json
Test-Endpoint "Offline sync" "/offline/sync" POST $syncBody $courierTk

# ==============================================================================
#  31. USSD MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 31. USSD MODULE ===" -ForegroundColor Cyan

Test-Endpoint "USSD handle" "/ussd/handle" POST '{"sessionId":"sess-001","serviceCode":"*123#","phoneNumber":"+237699000001","text":""}' $clientTk

# ==============================================================================
#  32. INTEGRATION CONFIG MODULE
# ==============================================================================
Write-Host ""
Write-Host "=== 32. INTEGRATION CONFIG ===" -ForegroundColor Cyan

Test-Endpoint "Get integration config" "/config/integrations" GET $null $adminTk

# ==============================================================================
#  33. ACCESS CONTROL TESTS (Cross-role violations)
# ==============================================================================
Write-Host ""
Write-Host "=== 33. CROSS-ROLE ACCESS CONTROL ===" -ForegroundColor Cyan

# Client cannot create parcels on admin routes
Test-Endpoint "Client cannot list all parcels" "/parcels" GET $null $clientTk $true
Test-Endpoint "Agent cannot access admin users" "/admin/users" GET $null $agentTk $true
Test-Endpoint "Courier cannot access admin users" "/admin/users" GET $null $courierTk $true
Test-Endpoint "Courier cannot access finance" "/finance/stats" GET $null $courierTk $true
Test-Endpoint "Agent cannot access risk" "/risk/alerts" GET $null $agentTk $true
Test-Endpoint "Courier cannot create staff" "/staff" POST $staffBody $courierTk $true

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
    Write-Host "        ERRORS DETAILS" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    Write-Host "============================================" -ForegroundColor Red
}
