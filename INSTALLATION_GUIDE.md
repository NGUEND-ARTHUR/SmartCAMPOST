# SmartCAMPOST Mobile App - Installation Guide

**Version:** 1.0.0  
**Platform:** Android 6.0 (API 23) or higher  
**Last Updated:** April 1, 2026

---

## 📋 Quick Links

- **GitHub Release:** https://github.com/NGUEND-ARTHUR/SmartCAMPOST/releases/tag/v1.0.0
- **APK Download:** See GitHub Release Assets
- **Troubleshooting:** Skip to [Troubleshooting](#troubleshooting) section

---

## 🚀 Installation Methods

### Method 1: Direct APK Installation (Easiest)

#### Step 1: Allow Unknown Sources
1. Open **Settings** on your Android device
2. Navigate to **Security** or **Apps & notifications**
3. Find **Unknown sources** or **App installation**
4. Enable **"Allow installation from unknown sources"**

#### Step 2: Download APK
1. Go to [SmartCAMPOST GitHub Releases](https://github.com/NGUEND-ARTHUR/SmartCAMPOST/releases/tag/v1.0.0)
2. Download the APK appropriate for your device:
   - **64-bit (Most devices):** `app-arm64-v8-release.apk`
   - **32-bit:** `app-armeabi-v7a-release.apk`
   - **Emulator (x86):** `app-x86_64-release.apk`

**How to check your device architecture:**
```
Settings → About phone → Processor/Architecture
Or: Download CPU-Z app from Play Store
```

#### Step 3: Install APK
1. Open **Files** or **File Manager**
2. Navigate to your **Downloads** folder
3. Tap the APK file you downloaded
4. Tap **Install**
5. Wait for installation to complete

#### Step 4: Launch App
- After installation completes, tap **Open**
- Or find **SmartCAMPOST** in your app launcher
- On first launch, grant necessary permissions

#### Step 5: Grant Permissions
When prompted, allow these permissions:
- ✅ **Camera** - For QR code scanning
- ✅ **Location** - For GPS tracking
- ✅ **Phone** - For OTP handling
- ✅ **Storage** - For file management (optional)

---

### Method 2: Google Play Store (Coming Soon)

**Status:** App is being prepared for Google Play Store submission

**Timeline:**
- Expected availability: Q2 2026
- Will provide automatic updates
- Same features as direct APK

**When available:**
1. Open **Google Play Store**
2. Search for **"SmartCAMPOST"**
3. Tap **Install**
4. Grant permissions when prompted

---

### Method 3: Android App Bundle (Enterprise)

If you received an `.aab` (Android App Bundle) file:

1. Upload to **Google Play Console** for testing
2. Or use **bundletool** to generate APK:

```bash
# Download bundletool
wget https://github.com/google/bundletool/releases/download/1.15.6/bundletool-all-1.15.6.jar

# Generate APKs from bundle
java -jar bundletool-all.jar build-apks \
  --bundle=app-release.aab \
  --output=app.apks \
  --mode=universal

# Extract universal APK
unzip -d apk app.apks
adb install -r apk/universal.apk
```

---

## ✅ System Requirements

### Minimum Requirements
- **Android Version:** 6.0 (API 23)
- **RAM:** 2 GB minimum
- **Storage:** 150 MB free space
- **Internet:** Required for full functionality

### Recommended
- **Android Version:** 10.0+ (API 29+)
- **RAM:** 4 GB or more
- **Storage:** 500 MB free space
- **Internet:** LTE or WiFi

### Device Compatibility
✅ Works on:
- Samsung Galaxy A10 and newer
- OnePlus 5 and newer
- Google Pixel 1 and newer
- Xiaomi Redmi 4 and newer
- Any device with Android 6.0+

---

## 🔐 First Launch Setup

### Step 1: Sign In
Choose your preferred authentication method:

**Option A: Google Sign-In**
1. Tap **"Sign in with Google"**
2. Select your Google account
3. Tap **"Allow"** to connect
4. You'll be logged in automatically

**Option B: Phone Number + Password**
1. Enter your phone number (with country code: +237...)
2. Create a strong password (8+ characters)
3. Tap **Register**
4. Verify your phone with OTP
5. Done!

**Option C: Phone Number + OTP (Login Only)**
1. Enter your registered phone number
2. Tap **Request OTP**
3. Enter the 6-digit code from SMS
4. Tap **Confirm**
5. You're logged in!

### Step 2: Complete Your Profile
- Upload a profile picture
- Fill in delivery address
- Set language preference (EN/FR)
- Enable notifications

### Step 3: First Parcel
- Tap **Create Parcel**
- Enter recipient details
- Add pickup location (auto or manual)
- Select delivery option
- Payment method
- Done! Your parcel is tracked in real-time

---

## 🎯 Key Features to Try

### 1. Track Parcels
1. Open app
2. Tap **My Parcels**
3. Tap any parcel
4. View real-time location on map
5. See full delivery timeline

### 2. Scan QR Code
1. Tap **Scan QR Code** button
2. Point camera at QR code
3. Auto-opens parcel details
4. Verify information

### 3. Request Pickup
1. Tap **Pickups**
2. Tap **Schedule Pickup**
3. Select address or enter manually
4. Choose pickup time
5. Confirm

### 4. Make Payment
1. Open parcel
2. Tap **Pay**
3. Choose payment method:
   - MTN MoMo
   - Orange Money
   - CAMPOST Money
4. Confirm payment
5. Receipt sent to SMS

### 5. View Notifications
1. Tap **Notifications** (bell icon)
2. See all parcel updates
3. Tap to see details
4. Mark as read

---

## 🔧 Troubleshooting

### Issue: "Installation blocked by Play Protect"

**Solution:**
1. Tap **"Show more"** or **"Install anyway"**
2. Or go to Google Play Protect settings
3. Turn off "Enhanced protection" temporarily
4. Try installation again

### Issue: "Cannot open app - crashes immediately"

**Solution:**
1. Go to Settings → Apps → SmartCAMPOST
2. Tap **Storage → Clear Cache**
3. Tap **Permissions** → Grant all permissions
4. Force stop the app
5. Reopen app

**If still not working:**
1. Uninstall the app completely
2. Restart your phone
3. Download and install APK again

### Issue: "App says 'Network error' or 'Cannot connect'"

**Solution:**
1. Check internet connection:
   ```
   Settings → WiFi or Mobile Data → Toggle off/on
   ```
2. Clear app cache:
   ```
   Settings → Apps → SmartCAMPOST → Storage → Clear Cache
   ```
3. Check if backend is running:
   - Try accessing https://api.smartcampost.cm/health
4. Try using mobile data instead of WiFi (or vice versa)

### Issue: "Google Sign-In not working"

**Solution:**
1. Verify Google account is set up on device:
   ```
   Settings → Accounts → Google → Check email exists
   ```
2. Clear Play Services data:
   ```
   Settings → Apps → Play Services → Storage → Clear Cache → Clear Data
   ```
3. Restart phone
4. Try signing in again

### Issue: "Location not updating"

**Solution:**
1. Enable high accuracy location:
   ```
   Settings → Location → Mode → High Accuracy or GPS
   ```
2. Grant location permission to SmartCAMPOST:
   ```
   Settings → Apps → SmartCAMPOST → Permissions → Location → Always Allow
   ```
3. Ensure cellular and WiFi scanning enabled
4. Close and reopen app

### Issue: "Notifications not received"

**Solution:**
1. Enable notifications for app:
   ```
   Settings → Apps → SmartCAMPOST → Notifications → Turn On
   ```
2. Check battery optimization:
   ```
   Settings → Battery → Battery Optimization → SmartCAMPOST → Don't Optimize
   ```
3. Ensure background app refresh enabled:
   ```
   Settings → Apps → SmartCAMPOST → Permissions → Background Usage
   ```

### Issue: "Permission denial errors"

**Solution:**
1. Go to Settings → Apps → SmartCAMPOST → Permissions
2. Enable all required permissions:
   - ✅ Camera (for QR scanning)
   - ✅ Location (for GPS tracking)
   - ✅ Phone (for OTP)
3. If option to grant permission is missing:
   - Uninstall and reinstall app
   - Check that "Unknown sources" is enabled

### Issue: "Storage space warning"

**Solution:**
1. Check available storage:
   ```
   Settings → Storage
   ```
2. Clear app cache:
   ```
   Settings → Apps → SmartCAMPOST → Storage → Clear Cache
   ```
3. Remove app data if needed:
   ```
   Settings → Apps → SmartCAMPOST → Storage → Clear Data
   (Warning: This logs you out)
   ```
4. Delete old photos/videos from device

### Issue: "Battery drains quickly"

**Solution:**
1. Disable GPS tracking when not needed:
   - In app settings, turn off background tracking
2. Reduce location update frequency:
   - Settings → Delivery options → Update interval
3. Disable push notifications if not needed
4. Close other background apps

---

## 🆘 Contact Support

If you encounter issues not covered above:

**Email:** support@smartcampost.cm  
**Phone:** +237 XXX XXX XXX  
**Hours:** Monday - Friday, 9 AM - 6 PM (GMT+1)  
**GitHub Issues:** [Report Bug](https://github.com/NGUEND-ARTHUR/SmartCAMPOST/issues)

---

## 🔐 Security Tips

✅ **Do:**
- Keep app updated to latest version
- Use strong password (8+ characters, mixed case, numbers)
- Enable biometric authentication if available
- Check notifications regularly
- Review account settings periodically

❌ **Don't:**
- Share your login credentials
- Use public WiFi for sensitive operations
- Install APK from untrusted sources
- Grant unnecessary permissions
- Use same password for multiple accounts

---

## 📱 Device-Specific Notes

### Samsung Devices
- Location: Settings → Apps → SmartCAMPOST → Permissions

### Xiaomi Devices
- Check "Superuser" permissions in Settings
- May need to disable "App lock" for SmartCAMPOST
- Use "App notifications" not just "Notifications"

### OnePlus Devices
- Go to Settings → Apps → Special access
- Grant SmartCAMPOST unrestricted data access

### Google Pixel Devices
- Most permissive by default
- Just approve permission requests

---

## 📊 Usage Statistics

After installation, you can check:
- **Storage used:** Settings → Storage → SmartCAMPOST
- **Data usage:** Settings → Network → Data Usage → SmartCAMPOST
- **Battery usage:** Settings → Battery → Battery Usage → SmartCAMPOST

**Typical usage:**
- Storage: 50-150 MB
- Data (monthly): 50-200 MB depending on usage
- Battery drain: Minimal with background tracking disabled

---

## ⚙️ Advanced Installation (Developers)

### Installing from Source
```bash
# Clone repository
git clone https://github.com/NGUEND-ARTHUR/SmartCAMPOST.git

# Navigate to mobile app
cd SmartCAMPOST/smartcampost_mobile

# Get dependencies
flutter pub get

# Build APK
flutter build apk --split-per-abi

# APK files in: build/app/outputs/flutter-apk/
```

### Installing via ADB (Android Debug Bridge)
```bash
# Connect device via USB
# Enable USB Debugging: Settings → Developer Options → USB Debugging

# Install APK
adb install app-release.apk

# Verify installation
adb shell pm list packages | grep smartcampost
```

---

## 🎉 You're All Set!

You're now ready to use SmartCAMPOST!

**Next steps:**
1. ✅ Create your first parcel
2. ✅ Track it in real-time
3. ✅ Make a payment
4. ✅ Request a pickup
5. ✅ Verify delivery with OTP

**Happy tracking! 📦**

---

## 📄 Additional Resources

- [User Manual](./USER_MANUAL.md)
- [FAQ](./FAQ.md)
- [Release Notes](./RELEASE_NOTES_v1.0.0.md)
- [Privacy Policy](./PRIVACY_POLICY.md)
- [Terms of Service](./TERMS_OF_SERVICE.md)
- [GitHub Repository](https://github.com/NGUEND-ARTHUR/SmartCAMPOST)

---

**Last updated:** April 1, 2026  
**For the latest updates and support, visit our GitHub repository.** 🚀
