# SmartCAMPOST Realtime Logistics Architecture

## Current implementation

SmartCAMPOST already had parcel lifecycle tracking through `ScanEvent`, pickup creation and courier assignment, final delivery with OTP/proof/COD handling, QR verification, role-protected dashboards, map views, offline scan synchronization, SSE streams, tariff pricing, agencies, couriers, and AI/analytics endpoints.

The realtime prompt exposed the main missing layer: one unified logistics location model that can accept mobile GPS and physical GPS tracker updates, broadcast live movement, and expose inherited parcel locations to operations dashboards.

## Added architecture

### Tracking sources

1. Mobile GPS
   - Endpoint: `POST /api/logistics/gps/mobile`
   - Roles: courier, agent, staff, admin.
   - Saves positions to the existing `locations` table.
   - Emits `gps-update` events over the existing SSE channel.

2. GPS/GSM/IoT trackers
   - Register/list/update trackers through `/api/logistics/trackers`.
   - Ingest tracker positions through `POST /api/logistics/gps/iot`.
   - Trackers store `deviceId`, `imei`, active state, assignment target, vehicle ID, last position, speed, heading, and last seen time.

### Parcel location inheritance

Parcels still do not need individual GPS devices. The live endpoint exposes active parcels with inherited location context from tracked logistics actors, plus fallback scan-event parcel coordinates when no live actor location is available.

Endpoint: `GET /api/logistics/live`

### Intelligent logistics APIs

- `GET /api/logistics/route-optimization`
  Returns recommended active stops, distance, duration, and efficiency score.

- `GET /api/logistics/pickup-assignment/recommendations?latitude=&longitude=`
  Scores nearby actors using distance and operational criteria.

- `POST /api/logistics/pricing/distance-quote`
  Applies the Cameroon pickup minimum fee rule: never below 500 FCFA.

### Web and mobile surfaces

Web and mobile now expose:

- Live logistics operations
- Mobile GPS update
- GPS tracker management
- GPS tracker registration
- IoT GPS ingestion
- Route optimization
- Pickup assignment recommendations
- Distance-based pricing

## Security model

Global live operations are limited to admin, staff, and risk roles. Couriers and agents can access their own live logistics tools and mobile GPS submission. Tracker management is restricted to admin/staff roles.

## Cameroon constraints

The implementation preserves the existing offline scan synchronization and adds low-bandwidth JSON GPS updates. Dashboards use last-known-position fallback when live GPS is unavailable.

## Database change

Migration added:

- `database/migrations/0002_realtime_logistics.sql`

This creates the `gps_tracker` table and indexes assignment/vehicle lookups.
