<#
PowerShell script to provision test users for SmartCAMPOST via Admin API.
Usage: Open PowerShell and run (from repo root):
  .\scripts\create_test_users.ps1
Requires backend running at $BaseUrl (default http://localhost:8082)
#>

param(
    [string]$BaseUrl = "http://localhost:8082",
    [string]$AdminEmail = "admin@smartcampost.cm",
    [string]$AdminPassword = "Admin@SmartCAMPOST2026",
    [switch]$Verbose
)

function Log { param($m) if ($Verbose) { Write-Host $m } }

# Step 1: login as admin
$loginUrl = "$BaseUrl/api/auth/login"
$loginPayload = @{ phone = $AdminEmail; password = $AdminPassword } | ConvertTo-Json
Log "Logging in as admin -> $loginUrl"
try {
    $loginResp = Invoke-RestMethod -Method Post -Uri $loginUrl -ContentType 'application/json' -Body $loginPayload -ErrorAction Stop
} catch {
    Write-Error "Admin login failed: $_"
    exit 1
}
$token = $loginResp.accessToken
if (-not $token) { Write-Error "No accessToken returned from login."; exit 1 }
$authHeader = @{ Authorization = "Bearer $token" }
Log "Received token: $($token.Substring(0,20))..."

# Helper: check existence by email/phone using admin list endpoints
function UserExistsByEmail($email) {
    $resp = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/admin/users" -Headers $authHeader -ErrorAction Stop
    return $resp | Where-Object { $_.email -and $_.email -eq $email }
}

# Create staff (can create ADMIN, FINANCE, RISK, STAFF)
$staffToCreate = @(
    @{ fullName = 'E2E Finance'; role='FINANCE'; email='e2e.finance@test.cm'; phone='+237650000001'; password='Test@2024' },
    @{ fullName = 'E2E Risk'; role='RISK'; email='e2e.risk@test.cm'; phone='+237650000002'; password='Test@2024' },
    @{ fullName = 'E2E Staff'; role='STAFF'; email='e2e.staff@test.cm'; phone='+237650000003'; password='Test@2024' }
)

foreach ($s in $staffToCreate) {
    if (UserExistsByEmail $s.email) { Log "Staff $($s.email) already exists, skipping."; continue }
    $url = "$BaseUrl/api/staff"
    $body = $s | ConvertTo-Json
    Log "Creating staff $($s.email) -> $url"
    try { $r = Invoke-RestMethod -Method Post -Uri $url -Headers $authHeader -ContentType 'application/json' -Body $body -ErrorAction Stop; Write-Host "Created staff: $($r.email)" } catch { Write-Warning "Failed to create staff $($s.email): $_" }
}

# Create agent
$agent = @{ fullName='E2E Agent'; staffNumber='AG-001'; phone='+237650000010'; password='Test@2024' }
# check via /api/agents list
$agentsList = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/agents" -Headers $authHeader -ErrorAction SilentlyContinue
if ($agentsList -and ($agentsList | Where-Object { $_.phone -eq $agent.phone })) { Log "Agent exists, skipping." } else {
    try { $r = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/agents" -Headers $authHeader -ContentType 'application/json' -Body ($agent|ConvertTo-Json) -ErrorAction Stop; Write-Host "Created agent: $($r.fullName)" } catch { Write-Warning "Failed to create agent: $_" }
}

# Create courier
$courier = @{ fullName='E2E Courier'; phone='+237650000020'; password='Test@2024'; vehicleId='VEH-001' }
$couriersList = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/couriers" -Headers $authHeader -ErrorAction SilentlyContinue
if ($couriersList -and ($couriersList | Where-Object { $_.phone -eq $courier.phone })) { Log "Courier exists, skipping." } else {
    try { $r = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/couriers" -Headers $authHeader -ContentType 'application/json' -Body ($courier|ConvertTo-Json) -ErrorAction Stop; Write-Host "Created courier: $($r.fullName)" } catch { Write-Warning "Failed to create courier: $_" }
}

Write-Host "Provisioning complete. Please verify created users via Admin UI or API."
