#!/usr/bin/env powershell
# SmartCAMPOST GitHub Release Deployment Script
# This script builds the APK and creates a GitHub release

param(
    [string]$Version = "1.0.0",
    [string]$BuildType = "release"
)

$projectRoot = "c:\Users\Nguend Arthur Johann\Desktop\SmartCAMPOST"
$mobileDir = "$projectRoot\smartcampost_mobile"
$buildDir = "$mobileDir\build\app\outputs\flutter-apk"
$apkFile = "$buildDir\app-$BuildType.apk"

Write-Host "SmartCAMPOST Release Deployment Script" -ForegroundColor Green
Write-Host "Version: $Version" -ForegroundColor Cyan
Write-Host "Build Type: $BuildType" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if APK exists
Write-Host "[1/3] Checking APK file..." -ForegroundColor Yellow
if (Test-Path $apkFile) {
    $sizeMB = [math]::Round((Get-Item $apkFile).Length / 1MB, 2)
    Write-Host "✓ APK found: $apkFile" -ForegroundColor Green
    Write-Host "  Size: $sizeMB MB" -ForegroundColor Green
} else {
    Write-Host "✗ APK not found at: $apkFile" -ForegroundColor Red
    Write-Host "  Building APK..." -ForegroundColor Yellow
    cd $mobileDir
    flutter build apk --split-per-abi
    cd $projectRoot
    
    if (-not (Test-Path $apkFile)) {
        Write-Host "✗ APK build failed!" -ForegroundColor Red
        exit 1
    }
    $sizeMB = [math]::Round((Get-Item $apkFile).Length / 1MB, 2)
    Write-Host "✓ APK built successfully: $sizeMB MB" -ForegroundColor Green
}

# Step 2: Check GitHub CLI
Write-Host "[2/3] Checking GitHub CLI..." -ForegroundColor Yellow
$ghStatus = gh auth status 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ GitHub CLI authenticated" -ForegroundColor Green
} else {
    Write-Host "✗ GitHub CLI not authenticated" -ForegroundColor Red
    Write-Host "  Run: gh auth login" -ForegroundColor Yellow
    exit 1
}

# Step 3: Create release
Write-Host "[3/3] Creating GitHub release v$Version..." -ForegroundColor Yellow

$tag = "v$Version"
$title = "SmartCAMPOST v$Version - Production Release"
$notesFile = "$projectRoot\RELEASE_NOTES_v$Version.md"

if (-not (Test-Path $notesFile)) {
    Write-Host "✗ Release notes file not found: $notesFile" -ForegroundColor Red
    Write-Host "  Using default release notes..." -ForegroundColor Yellow
    $notesFile = $null
}

try {
    if ($notesFile -and (Test-Path $notesFile)) {
        gh release create $tag `
            --title $title `
            --notes-file $notesFile `
            $apkFile 2>&1
    } else {
        gh release create $tag `
            --title $title `
            --notes "SmartCAMPOST v$Version Production Release with real Google OAuth authentication, parcel tracking, payments, and SMS notifications. No mock implementations." `
            $apkFile 2>&1
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Release created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Release Details:" -ForegroundColor Cyan
        Write-Host "  Tag: $tag" -ForegroundColor Green
        Write-Host "  Title: $title" -ForegroundColor Green
        Write-Host "  APK: app-$BuildType.apk ($sizeMB MB)" -ForegroundColor Green
        Write-Host ""
        Write-Host "GitHub Release URL:" -ForegroundColor Cyan
        Write-Host "  https://github.com/NGUEND-ARTHUR/SmartCAMPOST/releases/tag/$tag" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Success! ✓" -ForegroundColor Green
    } else {
        Write-Host "✗ Release creation failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error during release creation: $_" -ForegroundColor Red
    exit 1
}
