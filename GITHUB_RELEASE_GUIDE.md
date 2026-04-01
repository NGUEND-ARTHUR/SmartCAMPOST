# SmartCAMPOST Mobile App - GitHub Release Deployment Guide

**Date:** April 1, 2026  
**Version:** 1.0.0  
**Purpose:** Deploy Flutter APK to GitHub Releases

---

## Quick Start

### Prerequisites
- [ ] Git installed and configured
- [ ] Flutter SDK 3.11.1+ installed
- [ ] Android SDK installed
- [ ] GitHub repository access
- [ ] All code changes committed

### Step 1: Prepare the Build Environment

```bash
# Navigate to mobile app directory
cd smartcampost_mobile

# Clean previous builds
flutter clean

# Get latest dependencies
flutter pub get

# Verify build environment
flutter doctor

# Expected output: all items should show ✓
```

### Step 2: Verify Code Quality

```bash
# Run analyzer
flutter analyze

# Expected: 0 errors, 0 warnings

# Run tests (if available)
flutter test
```

### Step 3: Update Version Numbers

**File:** `pubspec.yaml`
```yaml
version: 1.0.0+1  # Format: version+buildNumber
```

**Verify in Android manifest too:**
```bash
grep -n "android:versionCode\|android:versionName" \
  android/app/src/main/AndroidManifest.xml
```

### Step 4: Build APK Files

```bash
# Build split APKs (recommended for Google Play)
flutter build apk --split-per-abi

# APKs location:
# - build/app/outputs/flutter-apk/app-arm64-v8-release.apk
# - build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk
# - build/app/outputs/flutter-apk/app-x86_64-release.apk

# OR build universal APK (larger file size)
flutter build apk --release

# Universal APK location:
# - build/app/outputs/flutter-apk/app-release.apk
```

### Step 5: Build App Bundle (Optional - for Google Play)

```bash
# Build Android App Bundle
flutter build appbundle --release

# Bundle location:
# - build/app/outputs/bundle/release/app-release.aab
```

### Step 6: Verify APK/Bundle

```bash
# List generated files
ls -la build/app/outputs/flutter-apk/
ls -la build/app/outputs/bundle/release/

# Check APK size
du -h build/app/outputs/flutter-apk/*.apk

# Verify APK signature
jarsigner -verify -verbose -certs \
  build/app/outputs/flutter-apk/app-release.apk

# Expected: "jar verified"
```

---

## GitHub Release Creation

### Option A: Using GitHub Web Interface

**Step 1: Navigate to Releases**
1. Go to your GitHub repository
2. Click "Releases" tab
3. Click "Draft a new release"

**Step 2: Create Release**
- **Tag version:** `v1.0.0`
- **Release title:** `SmartCAMPOST v1.0.0 - Production Release`
- **Description:** (Copy from below)
- **Pre-release:** ☐ (Uncheck for production)

**Step 3: Upload Assets**
1. Drag & drop or click to upload:
   - `app-arm64-v8-release.apk` (primary - 64-bit)
   - `app-armeabi-v7a-release.apk` (32-bit compatibility)
   - `app-x86_64-release.apk` (x86 emulator)
   - `app-release.aab` (Google Play bundle)

2. Attach release notes:
   - `RELEASE_NOTES_v1.0.0.md`
   - `INSTALLATION_GUIDE.md`

**Step 4: Publish**
- Click "Publish release"

---

### Option B: Using GitHub CLI (Recommended for Automation)

```bash
# Install GitHub CLI if not already done
# brew install gh (macOS)
# choco install gh (Windows)
# apt-get install gh (Linux)

# Authenticate
gh auth login

# Create release with assets
gh release create v1.0.0 \
  --title "SmartCAMPOST v1.0.0 - Production Release" \
  --notes-file RELEASE_NOTES_v1.0.0.md \
  build/app/outputs/flutter-apk/app-arm64-v8-release.apk \
  build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk \
  build/app/outputs/flutter-apk/app-x86_64-release.apk \
  build/app/outputs/bundle/release/app-release.aab

# Mark as latest release (usually automatic)
gh release edit v1.0.0 --latest
```

---

### Option C: Using PowerShell Script

Create `scripts/github-release.ps1`:

```powershell
# GitHub Release Deployment Script for SmartCAMPOST
# Usage: .\scripts\github-release.ps1 -Version "1.0.0"

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

$tag = "v$Version"
$title = "SmartCAMPOST v$Version - Production Release"
$notesFile = "RELEASE_NOTES_v$Version.md"
$apkDir = "smartcampost_mobile/build/app/outputs/flutter-apk"
$bundleDir = "smartcampost_mobile/build/app/outputs/bundle/release"

Write-Host "Creating GitHub release: $tag" -ForegroundColor Green

# Verify files exist
$files = @(
    "$apkDir/app-arm64-v8-release.apk",
    "$apkDir/app-armeabi-v7a-release.apk",
    "$apkDir/app-x86_64-release.apk",
    "$bundleDir/app-release.aab"
)

foreach ($file in $files) {
    if (-Not (Test-Path $file)) {
        Write-Error "File not found: $file"
        exit 1
    }
}

# Create release
gh release create $tag `
    --title $title `
    --notes-file $notesFile `
    $files

Write-Host "Release published successfully! $tag" -ForegroundColor Green
```

**Run:**
```powershell
.\scripts\github-release.ps1 -Version "1.0.0"
```

---

## Release Content Template

**Release Title:**
```
SmartCAMPOST v1.0.0 - Production Release
```

**Release Description:**
```markdown
# 🚀 SmartCAMPOST Mobile v1.0.0

**Production Release** - Ready for Google Play Store submission

## ✨ Key Features
- Google OAuth Integration ✅
- Real-time Parcel Tracking ✅
- QR Code Scanning ✅
- Payment Integration ✅
- OTP-based Delivery Verification ✅
- Offline Mode ✅
- English & French Support ✅

## 📦 What's Included
- **app-arm64-v8-release.apk** - 64-bit Android (primary)
- **app-armeabi-v7a-release.apk** - 32-bit Android (compatibility)
- **app-x86_64-release.apk** - x86 emulator
- **app-release.aab** - Google Play Bundle

## 🔐 Security
- End-to-end HTTPS encryption
- JWT token-based authentication
- Google OAuth 2.0 verification
- Secure credential storage

## 📋 Installation
See [INSTALLATION_GUIDE.md](releases/download/v1.0.0/INSTALLATION_GUIDE.md)

## 📝 Release Notes
See [RELEASE_NOTES_v1.0.0.md](releases/download/v1.0.0/RELEASE_NOTES_v1.0.0.md)

## 🧪 Testing Status
- ✅ All 40+ API endpoints verified
- ✅ Authentication workflows tested
- ✅ UI/UX validated
- ✅ Performance optimized
- ✅ Security audited

## 🙏 Contributors
SmartCAMPOST Team

## 📜 License
[LICENSE](../../LICENSE)
```

---

## Post-Release Steps

### 1. Update Repository

```bash
# Tag the release commit permanently
git tag -a v1.0.0 -m "SmartCAMPOST v1.0.0 Production Release"
git push origin v1.0.0

# Update main branch version info
git switch main
# Edit pubspec.yaml version to next dev version: 1.1.0-dev
git add smartcampost_mobile/pubspec.yaml
git commit -m "chore: bump version to 1.1.0-dev"
git push origin main
```

### 2. Update Documentation

```bash
# Update README.md with download link
echo "Latest Release: [v1.0.0](../../releases/tag/v1.0.0)" >> README.md

# Update installation guide
echo "Download SmartCAMPOST v1.0.0 from [GitHub Releases](../../releases/tag/v1.0.0)" >> INSTALLATION_GUIDE.md

git add README.md INSTALLATION_GUIDE.md
git commit -m "docs: update download links for v1.0.0"
git push origin main
```

### 3. Notify Users

```bash
# Create discussion thread
echo "SmartCAMPOST v1.0.0 is now available for download!" | \
  gh release create-discussion

# Post to social media (optional):
# "SmartCAMPOST v1.0.0 is live! Download now: [link]"
```

### 4. Google Play Store Submission

If submitting to Google Play:
1. Go to Google Play Console
2. Create new release in internal testing track
3. Upload `app-release.aab`
4. Add release notes from `RELEASE_NOTES_v1.0.0.md`
5. Submit for review (2-4 hours)

### 5. Monitor Release

```bash
# Watch GitHub releases
gh release list --first 5

# Get download stats
gh release view v1.0.0 --json downloads

# Check release assets
gh release view v1.0.0 --json assets
```

---

## Troubleshooting

### APK Build Fails

**Problem:** Build fails with "Gradle error"
```
Solution:
1. flutter clean
2. cd android && ./gradlew clean && cd ..
3. flutter pub get
4. flutter build apk --split-per-abi
```

### APK Signing Issues

**Problem:** "Keystore not found" error
```
Solution:
1. Check signing configuration in android/app/build.gradle
2. Verify keystore file exists
3. Update keystore password in gradle properties
4. Run: flutter build apk --release
```

### Upload to GitHub Fails

**Problem:** GitHub CLI authentication error
```
Solution:
1. gh auth logout
2. gh auth login
3. Authenticate with your GitHub account
4. Try upload again
```

### File Size Too Large

**Problem:** GitHub won't accept files > 2GB
```
Solution:
Split APKs are always < 100MB each:
- Use: flutter build apk --split-per-abi
- Do NOT use universal APK for large releases
```

---

## Verification Checklist

Before hitting "Publish":

- [ ] All APK files tested on real device
- [ ] Google OAuth integration verified
- [ ] API connectivity working
- [ ] Parcel tracking functional
- [ ] Payments working
- [ ] Notifications sending
- [ ] Dark mode tested
- [ ] Offline mode working
- [ ] Performance acceptable
- [ ] Security audit complete
- [ ] Version numbers updated
- [ ] Release notes complete
- [ ] Installation guide provided
- [ ] All assets uploaded correctly

---

## Quick Commands Reference

```bash
# Full build and release cycle (after code changes)
cd smartcampost_mobile && \
flutter clean && \
flutter pub get && \
flutter build apk --split-per-abi && \
flutter build appbundle --release && \
cd .. && \
gh release create v1.0.0 \
  --title "SmartCAMPOST v1.0.0" \
  --notes-file RELEASE_NOTES_v1.0.0.md \
  smartcampost_mobile/build/app/outputs/flutter-apk/*.apk \
  smartcampost_mobile/build/app/outputs/bundle/release/app-release.aab

# Verify release
gh release view v1.0.0 --json assets,description,tagName

# Download release
gh release download v1.0.0 -p "*.apk"
```

---

## Support

For issues with:
- **Flutter builds:** See [Flutter docs](https://flutter.dev/docs)
- **GitHub releases:** See [GitHub CLI docs](https://cli.github.com/manual)
- **Android signing:** See [Android docs](https://developer.android.com/studio/publish/app-signing)

---

**Release deployment guide ready! Proceed with deployment when ready. 🚀**
