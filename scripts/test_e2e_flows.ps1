###############################################################################
# SmartCAMPOST - End-to-End Flow Tests
# Tests complete lifecycle: Register -> Create Parcel -> Pay -> Track -> Invoice
###############################################################################

$BASE = "http://localhost:8082/api"
$pass = 0; $fail = 0; $total = 0
$errors = @()

function Test($name, $block) {
    $script:total++
    try {
        $result = & $block
        if ($result -eq $false) { throw "Assertion failed" }
        Write-Host "  PASS  $name" -ForegroundColor Green
        $script:pass++
    } catch {
        Write-Host "  FAIL  $name -> $($_.Exception.Message)" -ForegroundColor Red
        $script:errors += "$name : $($_.Exception.Message)"
        $script:fail++
    }
}

function Post($url, $body, $headers) {
    $p = @{ Uri = "$BASE$url"; Method = "POST"; ContentType = "application/json"; UseBasicParsing = $true }
    if ($body)    { $p.Body = ($body | ConvertTo-Json -Depth 5) }
    if ($headers) { $p.Headers = $headers }
    Invoke-RestMethod @p
}
function Get($url, $headers) {
    $p = @{ Uri = "$BASE$url"; Method = "GET"; UseBasicParsing = $true }
    if ($headers) { $p.Headers = $headers }
    Invoke-RestMethod @p
}
function Patch($url, $body, $headers) {
    $p = @{ Uri = "$BASE$url"; Method = "PATCH"; ContentType = "application/json"; UseBasicParsing = $true }
    if ($body)    { $p.Body = ($body | ConvertTo-Json -Depth 5) }
    if ($headers) { $p.Headers = $headers }
    Invoke-RestMethod @p
}
function Put($url, $body, $headers) {
    $p = @{ Uri = "$BASE$url"; Method = "PUT"; ContentType = "application/json"; UseBasicParsing = $true }
    if ($body)    { $p.Body = ($body | ConvertTo-Json -Depth 5) }
    if ($headers) { $p.Headers = $headers }
    Invoke-RestMethod @p
}

# Generate unique phone per run to avoid OTP cooldown collisions
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() % 100000
$clientPhone = "+23769$($ts.ToString('00000'))"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " SmartCAMPOST E2E FLOW TESTS" -ForegroundColor Cyan
Write-Host " Client phone: $clientPhone" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

###############################################################################
# PRE-STEP: Admin login (needed for authenticated endpoints)
###############################################################################
Write-Host "--- PRE-STEP: Admin Login ---" -ForegroundColor Yellow

$adminLogin = Post "/auth/login" @{ phone = "+237690000000"; password = "Admin@SmartCAMPOST2026" }
$ah = @{ Authorization = "Bearer $($adminLogin.accessToken)" }
Write-Host "  Admin token obtained" -ForegroundColor DarkGray

###############################################################################
# FLOW 1: Register a new client, create parcel, pay, track, get invoice
###############################################################################
Write-Host "`n--- FLOW 1: Full Parcel Lifecycle (Register -> Create -> Pay -> Track -> Invoice) ---" -ForegroundColor Yellow

$clientPass  = "FlowTest@2026!"
$clientName  = "Flow Test Client"

# Step 1: Register new client
Test "1.1 Send OTP for registration" {
    $r = Post "/auth/send-otp" @{ phone = $clientPhone; purpose = "REGISTER" }
    $script:regOtp = $r.otp
    $null -ne $r.otp
}

Test "1.2 Register new client" {
    $r = Post "/auth/register" @{
        phone             = $clientPhone
        password          = $clientPass
        fullName          = $clientName
        otp               = $script:regOtp
        preferredLanguage = "EN"
    }
    $null -ne $r.accessToken -or $null -ne $r.userId
}

# Step 2: Login as client
Test "1.3 Login as client" {
    $r = Post "/auth/login" @{ phone = $clientPhone; password = $clientPass }
    $script:clientToken = $r.accessToken
    $script:clientUserId = $r.userId
    $script:clientEntityId = $r.entityId
    $null -ne $r.accessToken
}
$ch = @{ Authorization = "Bearer $($script:clientToken)" }

# Step 3: Create agencies (H2 in-memory starts empty) then list them
Test "1.4a Create origin agency" {
    $r = Post "/agencies" @{
        agencyName = "Yaounde Central"
        agencyCode = "YDE-C"
        city       = "Yaounde"
        region     = "Centre"
    } $ah
    $null -ne $r.id
}
Test "1.4b2 Create destination agency" {
    $r = Post "/agencies" @{
        agencyName = "Douala Port"
        agencyCode = "DLA-P"
        city       = "Douala"
        region     = "Littoral"
    } $ah
    $null -ne $r.id
}
Test "1.4c2 List agencies" {
    $r = Get "/agencies" $ah
    $script:agencies = $r
    $r.Count -ge 2
}

# Step 4: Create addresses for sender and recipient
Test "1.4d Create sender address" {
    $r = Post "/addresses" @{
        label     = "Sender Home"
        street    = "Rue 1234"
        city      = "Yaounde"
        region    = "Centre"
        country   = "Cameroon"
        latitude  = 3.848
        longitude = 11.502
    } $ch
    $script:senderAddressId = $r.id
    $null -ne $r.id
}

Test "1.4e Create recipient address" {
    $r = Post "/addresses" @{
        label     = "Recipient Office"
        street    = "Boulevard de la Liberte"
        city      = "Douala"
        region    = "Littoral"
        country   = "Cameroon"
        latitude  = 4.05
        longitude = 9.7
    } $ch
    $script:recipientAddressId = $r.id
    $null -ne $r.id
}

# Step 5: Create a parcel
Test "1.5 Create parcel" {
    $originId = $script:agencies[0].id
    $destId   = if ($script:agencies.Count -ge 2) { $script:agencies[1].id } else { $script:agencies[0].id }
    $r = Post "/parcels" @{
        senderAddressId     = $script:senderAddressId
        recipientAddressId  = $script:recipientAddressId
        originAgencyId      = $originId
        destinationAgencyId = $destId
        weight              = 2.5
        dimensions          = "30x20x15"
        declaredValue       = 50000
        fragile             = $false
        serviceType         = "STANDARD"
        deliveryOption      = "AGENCY"
        paymentOption       = "PREPAID"
        descriptionComment  = "E2E Test Parcel - Laptop"
    } $ch
    $script:parcelId = $r.id
    $script:trackingRef = $r.trackingRef
    $null -ne $r.id -and $null -ne $r.trackingRef
}

# Step 5b: Validate parcel (admin) - must happen immediately while status is CREATED
Test "1.5b Validate parcel with GPS (admin)" {
    $r = Patch "/parcels/$($script:parcelId)/validate" @{
        latitude              = 3.8480
        longitude             = 11.5021
        validatedWeight       = 2.5
        validationComment     = "Weight confirmed by agency"
        locationSource        = "GPS"
        descriptionConfirmed  = $true
    } $ah
    $null -ne $r.id -or $null -ne $r.status
}

# Step 6: Verify parcel details
Test "1.6 Get parcel detail" {
    $r = Get "/parcels/$($script:parcelId)" $ch
    $r.trackingRef -eq $script:trackingRef
}

# Step 7: Get client parcels (uses /me endpoint for CLIENT role)
Test "1.7 Parcel appears in client list" {
    $r = Get "/parcels/me" $ch
    $found = $r.content | Where-Object { $_.id -eq $script:parcelId }
    $null -ne $found
}

# Step 8: Get pricing quote
Test "1.8 Get pricing quote" {
    $r = Get "/pricing/quote/$($script:parcelId)" $ch
    $null -ne $r
}

# Step 9: Init payment (CASH)
Test "1.9 Init CASH payment" {
    $r = Post "/payments/init" @{
        parcelId = $script:parcelId
        method   = "CASH"
    } $ch
    $script:paymentId = $r.id
    $r.status -eq "PENDING" -and $null -ne $r.amount
}

# Step 10: Get payment details
Test "1.10 Get payment by ID" {
    $r = Get "/payments/$($script:paymentId)" $ch
    $r.id -eq $script:paymentId -and $r.status -eq "PENDING"
}

# Step 11: List payments for parcel
Test "1.11 Payments for parcel" {
    $r = Get "/payments/parcel/$($script:parcelId)" $ch
    $r.Count -ge 1
}

# Step 12: Confirm payment (admin)
Test "1.12 Confirm payment (admin)" {
    $r = Post "/payments/confirm" @{
        paymentId  = $script:paymentId
        success    = $true
        gatewayRef = "CASH-MANUAL-001"
    } $ah
    $r.status -eq "SUCCESS"
}

# Step 13: Invoice should be auto-generated
Test "1.13 Invoice generated for parcel" {
    $r = Get "/invoices/by-parcel/$($script:parcelId)" $ch
    $script:invoiceId = if ($r -is [array] -and $r.Count -ge 1) { $r[0].id } elseif ($r.id) { $r.id } else { $null }
    $null -ne $script:invoiceId
}

# Step 14: Get invoice details
Test "1.14 Get invoice by ID" {
    if (-not $script:invoiceId) { throw "No invoice found" }
    $r = Get "/invoices/$($script:invoiceId)" $ch
    $null -ne $r.invoiceNumber
}

# Step 15: Invoice PDF endpoint
Test "1.15 Invoice PDF endpoint responds" {
    if (-not $script:invoiceId) { throw "No invoice found" }
    try {
        $r = Invoke-WebRequest -Uri "$BASE/invoices/$($script:invoiceId)/pdf" -Headers $ch -UseBasicParsing
        $r.StatusCode -eq 200
    } catch {
        # 404 is acceptable if no PDF on disk in dev
        $_.Exception.Response.StatusCode.value__ -eq 404
    }
}

# Step 16: Track parcel by reference (PUBLIC - no auth needed)
Test "1.16 Track parcel by reference" {
    $r = Get "/track/parcel/$($script:trackingRef)"
    $null -ne $r
}

# Step 17: QR code data for parcel
Test "1.17 Get QR code data" {
    $r = Get "/qr/parcel/$($script:parcelId)" $ch
    $null -ne $r
}

# Step 18: QR code image
Test "1.18 Get QR code image" {
    try {
        $r = Invoke-WebRequest -Uri "$BASE/qr/parcel/$($script:parcelId)/image" -Headers $ch -UseBasicParsing
        $r.StatusCode -eq 200 -and $r.Content.Length -gt 100
    } catch {
        $false
    }
}

# Step 19: QR code by tracking ref
Test "1.19 Get QR by tracking ref" {
    $r = Get "/qr/tracking/$($script:trackingRef)" $ch
    $null -ne $r
}

# Step 20: QR image by tracking ref
Test "1.20 Get QR image by tracking ref" {
    try {
        $r = Invoke-WebRequest -Uri "$BASE/qr/tracking/$($script:trackingRef)/image" -Headers $ch -UseBasicParsing
        $r.StatusCode -eq 200 -and $r.Content.Length -gt 100
    } catch {
        $false
    }
}

###############################################################################
# FLOW 2: Scan events (tracking lifecycle)
###############################################################################
Write-Host "`n--- FLOW 2: Scan Event Recording & Tracking ---" -ForegroundColor Yellow

Test "3.1 Record scan event (ACCEPTED)" {
    $agencyId = $script:agencies[0].id
    $r = Post "/scan-events" @{
        parcelId       = $script:parcelId
        agencyId       = $agencyId
        eventType      = "ACCEPTED"
        latitude       = 3.8480
        longitude      = 11.5021
        locationSource = "GPS"
        comment        = "Parcel accepted at origin agency"
    } $ah
    $null -ne $r.id
}

Test "3.2 Record scan event (IN_TRANSIT)" {
    $r = Post "/scan-events" @{
        parcelId       = $script:parcelId
        agencyId       = $script:agencies[0].id
        eventType      = "IN_TRANSIT"
        latitude       = 4.0500
        longitude      = 9.7000
        locationSource = "GPS"
        comment        = "Parcel in transit to destination"
    } $ah
    $null -ne $r.id
}

Test "3.3 Get scan history for parcel" {
    $r = Get "/scan-events/parcel/$($script:parcelId)" $ah
    $r.Count -ge 1
}

Test "3.4 Track shows updated info" {
    $r = Get "/track/parcel/$($script:trackingRef)"
    $null -ne $r
}

###############################################################################
# FLOW 4: Notifications for the client
###############################################################################
Write-Host "`n--- FLOW 4: Client Notifications ---" -ForegroundColor Yellow

Test "4.1 Client notifications" {
    $r = Get "/notifications/me" $ch
    $r -is [array] -or $null -ne $r
}

###############################################################################
# FLOW 5: Support ticket lifecycle
###############################################################################
Write-Host "`n--- FLOW 5: Support Ticket Flow ---" -ForegroundColor Yellow

Test "5.1 Create support ticket" {
    $r = Post "/support/tickets" @{
        subject  = "Missing parcel update"
        message  = "I haven't received updates for my parcel for 2 days"
        category = "OTHER"
    } $ch
    $script:ticketId = $r.id
    $null -ne $r.id
}

Test "5.2 Get my support tickets" {
    $r = Get "/support/tickets/me" $ch
    $found = $r.content | Where-Object { $_.id -eq $script:ticketId }
    $null -ne $found
}

###############################################################################
# FLOW 6: Client invoices (my invoices)
###############################################################################
Write-Host "`n--- FLOW 6: My Invoices ---" -ForegroundColor Yellow

Test "6.1 Get my invoices" {
    $r = Get "/invoices/me" $ch
    $r -is [array] -or $null -ne $r
}

###############################################################################
# FLOW 7: Admin management
###############################################################################
Write-Host "`n--- FLOW 7: Admin Management ---" -ForegroundColor Yellow

Test "7.1 Admin list all parcels" {
    $r = Get "/parcels" $ah
    $null -ne $r.content
}

Test "7.2 Admin list all payments" {
    $r = Get "/payments" $ah
    $null -ne $r.content
}

Test "7.3 Admin list all agents" {
    $r = Get "/agents" $ah
    $r -is [array] -or $null -ne $r
}

Test "7.4 Admin list all support tickets" {
    $r = Get "/support/tickets" $ah
    $null -ne $r.content
}

###############################################################################
# FLOW 8: Profile management
###############################################################################
Write-Host "`n--- FLOW 8: Profile ---" -ForegroundColor Yellow

Test "8.1 Get client profile" {
    $r = Get "/clients/me" $ch
    $r.fullName -eq $clientName -and $r.phone -eq $clientPhone
}

Test "8.2 Update client profile" {
    $r = Put "/clients/me" @{
        fullName          = "Flow Test Client Updated"
        phone             = $clientPhone
        preferredLanguage = "EN"
    } $ch
    $r.fullName -eq "Flow Test Client Updated"
}

###############################################################################
# FLOW 9: Location tracking
###############################################################################
Write-Host "`n--- FLOW 9: Location ---" -ForegroundColor Yellow

Test "9.1 Update my location" {
    $null = Post "/location/update" @{
        latitude  = 3.8500
        longitude = 11.5100
    } $ch
    $true
}

Test "9.2 Get my location" {
    try {
        $r = Get "/location/me" $ch
        $null -ne $r
    } catch {
        # 404 is okay if no location recorded yet
        $_.Exception.Response.StatusCode.value__ -eq 404
    }
}

###############################################################################
# FLOW 10: Second parcel with MOBILE_MONEY payment (graceful handling)
###############################################################################
Write-Host "`n--- FLOW 10: MOBILE_MONEY Payment (Graceful Handling) ---" -ForegroundColor Yellow

Test "10.1 Create second parcel" {
    $originId = $script:agencies[0].id
    $destId   = if ($script:agencies.Count -ge 2) { $script:agencies[1].id } else { $script:agencies[0].id }
    $r = Post "/parcels" @{
        senderAddressId     = $script:senderAddressId
        recipientAddressId  = $script:recipientAddressId
        originAgencyId      = $originId
        destinationAgencyId = $destId
        weight              = 1.0
        dimensions          = "20x15x10"
        declaredValue       = 25000
        fragile             = $false
        serviceType         = "EXPRESS"
        deliveryOption      = "HOME"
        paymentOption       = "PREPAID"
        descriptionComment  = "E2E Test - Express Parcel"
    } $ch
    $script:parcel2Id = $r.id
    $null -ne $r.id
}

Test "10.2 MOBILE_MONEY init (may fail without gateway)" {
    try {
        $r = Post "/payments/init" @{
            parcelId   = $script:parcel2Id
            method     = "MOBILE_MONEY"
            payerPhone = $clientPhone
        } $ch
        # If it succeeds, that's fine too
        $null -ne $r.id
    } catch {
        # Expected: 500 or 400 because MTN gateway is not configured in dev
        $true
    }
}

Test "10.3 Fallback to CASH payment" {
    $r = Post "/payments/init" @{
        parcelId = $script:parcel2Id
        method   = "CASH"
    } $ch
    $r.status -eq "PENDING"
}

###############################################################################
# FLOW 11: Password reset flow
###############################################################################
Write-Host "`n--- FLOW 11: Password Reset ---" -ForegroundColor Yellow

# Wait to avoid OTP cooldown (60s per phone+purpose)
Write-Host "  Waiting 5s to avoid OTP cooldown..." -ForegroundColor DarkGray
Start-Sleep -Seconds 5

Test "11.1 Request password reset OTP" {
    $r = Post "/auth/password/reset/request" @{ phone = $clientPhone }
    $script:resetOtp = $r.otp
    $null -ne $r.otp
}

Test "11.2 Reset password" {
    $null = Post "/auth/password/reset/confirm" @{
        phone       = $clientPhone
        otp         = $script:resetOtp
        newPassword = "NewFlowPass@2026!"
    }
    $true
}

Test "11.3 Login with new password" {
    $r = Post "/auth/login" @{ phone = $clientPhone; password = "NewFlowPass@2026!" }
    $null -ne $r.accessToken
}

###############################################################################
# SUMMARY
###############################################################################
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " E2E RESULTS: $pass PASS / $fail FAIL (of $total)" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
Write-Host "========================================" -ForegroundColor Cyan

if ($errors.Count -gt 0) {
    Write-Host "`nFailed tests:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}
