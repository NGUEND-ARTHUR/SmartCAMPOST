# SmartCAMPOST - Integration Guide: Twilio, Maps & Tracking

## 🎯 Overview

This guide provides setup instructions for:
1. **Twilio Integration** - SMS/OTP delivery
2. **Map-Based Location Selection** - Click on map to set coordinates
3. **Parcel Creation & Tracking** - End-to-end functionality verification
4. **Environment Configuration** - Required variables for production

---

## 1️⃣ Twilio Setup

### Step 1: Get Twilio Credentials

1. **Sign up/Login** at https://www.twilio.com
2. **Navigate to Console** → Account info
3. **Copy these values:**
   - **Account SID** (e.g., `AC1234567890abcdef`)
   - **Auth Token** (e.g., `your_auth_token_here`)

4. **Get a Phone Number:**
   - Go to **Phone Numbers** → **Manage** → **Active Numbers**
   - If none exist, purchase a number (Twilio trial accounts get $15 credit)
   - Copy the phone number (e.g., `+1234567890`)

### Step 2: Set Environment Variables

**On Render (Backend Deployment):**

1. Go to your Render service dashboard
2. **Settings** → **Environment**
3. Add these variables:
   ```
   NOTIFICATION_GATEWAY=twilio
   TWILIO_ACCOUNT_SID=AC1234567890abcdef
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_FROM_NUMBER=+1234567890
  SMARTCAMPOST_WEBOTP_DOMAIN=smartcampost.vercel.app
   ```
4. Click Deploy → redeploy service

**On Local Development:**

Create `.env` file in `backend/` directory:
```properties
NOTIFICATION_GATEWAY=twilio
TWILIO_ACCOUNT_SID=AC1234567890abcdef
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+1234567890
SMARTCAMPOST_WEBOTP_DOMAIN=localhost:5173
```

Then restart your Spring Boot application.

### Step 3: Verify Twilio Integration

**Test Flow:**

1. Go to **Register** page in frontend
2. Enter phone number (same format as Twilio: `+237123456789`)
3. Click "Send OTP"
4. **Check:** SMS should arrive within 10 seconds
5. **Autofill (supported browsers):** SMS should include `@your-domain #123456` and OTP field auto-fills
5. Enter OTP and complete registration

**What's Happening:**
- `OtpServiceImpl` generates 6-digit code
- `TwilioNotificationGatewayServiceImpl` sends SMS via Twilio API
- OTP expires after 5 minutes
- SMS contains: `SmartCAMPOST registration code: 123456. Valid for 5 minutes.`

---

## 2️⃣ Map-Based Location Selection

### Feature: Click on Map to Select Address Coordinates

The **Addresses** page now has a map-based location picker!

**How to Use:**

1. Go to **Addresses** page
2. Click **Add New Address** or **Edit** existing
3. Two tabs appear:
   - **Address Details** - Fill in street, city, region
   - **Location on Map** - Select coordinates

**Three Ways to Select Location:**

#### Option A: Click on Map
- Switch to "Location on Map" tab
- Click anywhere on the map
- Marker appears at your location
- Coordinates auto-fill

#### Option B: Use GPS
- Click **"Use My Current Location"** button
- Browser asks for permission
- Your GPS location is selected

#### Option C: Manual Entry
- Scroll to "Or enter coordinates manually"
- Enter Latitude and Longitude (e.g., `4.0511` and `9.7679`)
- Click **Apply Coordinates**

**Save Address:**
- Fill address details (label, street, city, region)
- Select location on map
- Click **Done**
- Both address and coordinates are saved

---

## 3️⃣ Verify Parcel Creation & Tracking

### Parcel Creation Flow

**Frontend:** `smartcampost-frontend/src/pages/parcels/CreateParcel.tsx`
**Backend:** `backend/src/main/java/.../controller/ParcelController.java`

**Steps:**

1. Navigate to **Create Parcel** (Client Dashboard)
2. **Step 1:** Select sender & recipient addresses (now with map coordinates!)
3. **Step 2:** Enter parcel details (weight, dimensions, etc.)
4. **Step 3:** Choose service (Standard/Express)
5. **Step 4:** Select payment (Prepaid/COD)
6. Click **Create** → API call to `POST /api/parcels`

**API Integration:**
```
Frontend: parcelService.create(data)
  ↓
Backend: ParcelController.createParcel()
  ↓
Backend: ParcelServiceImpl.createParcel()
  ↓
Response: { id, trackingRef, status, ... }
```

### Parcel Tracking Flow

**View Parcel Details:**

1. Navigate to **My Parcels** (Client Dashboard)
2. Click on any parcel → **Parcel Detail** page
3. See:
   - Tracking reference
   - Current status
   - Timeline of events
   - **Interactive Tracking Map** showing journey

**Tracking Map Features:**

- **Origin Marker** - Where parcel started
- **Destination Marker** - Where it's going
- **Current Location** - Live GPS position
- **Route Animation** - Shows parcel movement path
- **Event Markers** - All scan events with timestamps

**Map Updates:**

The map listens to scan events in real-time via SSE (Server-Sent Events).
When a scan is registered, the map automatically updates the parcel location.

---

## 4️⃣ OTP & Notifications System

### OTP Delivery (SMS via Twilio)

**When OTP is Sent:**
- ✅ User Registration
- ✅ Login with OTP
- ✅ Password Reset
- ✅ Delivery Verification (courier)

**OTP Flow:**

```
User Action
  ↓
AuthService.requestOtp()
  ↓
OtpServiceImpl.generateOtp()
  ↓
TwilioNotificationGatewayServiceImpl.sendSms()
  ↓
Twilio API → User's Phone
```

### Delivery Notifications

**Automatic SMS Notifications:**

- 📦 **Parcel Created** - Client is notified
- 🚚 **Parcel In Transit** - Client gets status update
- ✅ **Delivered** - Client confirmation
- 🔔 **Pickup Requested** - Agency is notified

**All SMS include:**
- Parcel tracking reference
- Current status
- Key information (time window, location, etc.)

---

## 5️⃣ Deployment Checklist

### ✅ Before Deploying to Render/Vercel

#### Backend (Render)
- [ ] Twilio credentials in environment variables
- [ ] Database migrations applied
- [ ] Compile with: `mvn clean package -DskipTests`
- [ ] Test SMS sending locally with mock data

#### Frontend (Vercel)
- [ ] Map component renders (Leaflet loads)
- [ ] API endpoints updated to production backend
- [ ] LocationPicker component bundled correctly
- [ ] Tabs component imported from UI library

#### Database
- [ ] Address table has `latitude` and `longitude` columns
- [ ] OtpCode table exists
- [ ] Notification table exists

### 🚀 Deploy

**Backend Changes:**
```bash
cd backend
git add -A
git commit -m "feat: twilio setup and map integration"
git push origin main  # Render auto-deploys
```

**Frontend Changes:**
```bash
cd smartcampost-frontend
git add -A  
git commit -m "feat: add LocationPicker for map-based address entry"
git push origin main  # Vercel auto-deploys
```

**Verify Deployment:**

1. **Backend:** Check Render logs for Twilio init
   ```
   "Twilio gateway initialized (from=+1234567890)"
   ```

2. **Frontend:** Test on Vercel domain
   - Navigate to Addresses page
   - Dialog should have two tabs (Details + Map)
   - Click map should work

3. **Integration Test:**
   - Create account (SMS OTP should arrive)
   - Create address with map location
   - Create parcel with new address
   - Verify tracking map loads

---

## 6️⃣ Troubleshooting

### SMS Not Sending

**Check:**
1. Twilio credentials are correct (no typos)
2. Phone number format includes country code (+237... for Cameroon)
3. Render environment variables are set (restart deployment)
4. Check Render logs: `notification.gateway` should show `twilio`

**Debug:**
```bash
# Local testing
export NOTIFICATION_GATEWAY=twilio
export TWILIO_ACCOUNT_SID=your_sid
export TWILIO_AUTH_TOKEN=your_token
export TWILIO_FROM_NUMBER=your_number

mvn spring-boot:run
# Or in IDE, add to Run Configuration
```

### Map Not Appearing

**Check:**
1. Leaflet CSS is imported in LocationPicker
2. React-Leaflet is installed: `npm list react-leaflet`
3. Browser console for errors
4. Network tab - check if tile layer loads

**Fix:**
```bash
cd smartcampost-frontend
npm install react-leaflet leaflet
npm run dev
```

### Coordinates Not Saving

**Check:**
1. Address latitude/longitude are being sent in request
2. Backend Address model has these columns
3. Backend API accepts these fields
4. No validation errors on form

**Test API Directly:**
```bash
curl -X POST http://localhost:8080/api/addresses \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Home",
    "street": "123 Main St",
    "city": "Douala",
    "region": "Littoral",
    "country": "Cameroon",
    "latitude": 4.0511,
    "longitude": 9.7679
  }'
```

---

## 7️⃣ API Endpoints Reference

### Address Endpoints
- `GET /api/addresses/me` - Get user's addresses
- `POST /api/addresses` - Create address with lat/lng
- `PUT /api/addresses/{id}` - Update address coordinates
- `DELETE /api/addresses/{id}` - Delete address

### OTP Endpoints
- `POST /api/auth/send-otp` - Request OTP (SMS sent)
- `POST /api/auth/verify-otp` - Verify OTP code

### Parcel Endpoints
- `POST /api/parcels` - Create parcel
- `GET /api/parcels/me` - Get user's parcels
- `GET /api/parcels/{id}` - Get parcel detail
- `GET /api/parcels/tracking/{trackingRef}` - Track by ref

### Notification Endpoints
- `POST /api/notifications` - Trigger notification
- `GET /api/notifications` - List notifications

---

## 📚 Additional Resources

- [Twilio SDK Documentation](https://www.twilio.com/docs)
- [Leaflet Map Documentation](https://leafletjs.com)
- [React-Leaflet Guide](https://react-leaflet.js.org)
- [SmartCAMPOST API Docs](./API_DOCUMENTATION.md)

---

**Last Updated:** February 18, 2026
**Version:** 1.0
