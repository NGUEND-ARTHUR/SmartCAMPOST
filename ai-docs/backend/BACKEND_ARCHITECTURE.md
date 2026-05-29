# SmartCAMPOST — Backend Architecture

## Overview

| Property | Value |
|---|---|
| Framework | Spring Boot 3.5.7 |
| Language | Java 17 |
| Build Tool | Maven |
| Database | MySQL 8.0 (TiDB Cloud compatible) |
| Architecture | Layered REST API with domain-driven packaging |
| Authentication | JWT (HS256) + Google OAuth2 + OTP |

---

## Directory Structure

```
backend/
├── src/main/
│   ├── java/com/smartcampost/backend/
│   │   ├── SmartCampostBackendApplication.java   # Spring Boot entry point
│   │   ├── config/                               # Application + infrastructure config
│   │   │   ├── SecurityConfig.java               # Spring Security (JWT, CORS, RBAC)
│   │   │   ├── CacheConfig.java                  # Caffeine in-memory cache
│   │   │   ├── WebConfig.java / WebMvcConfig.java # CORS + MVC config
│   │   │   └── MethodSecurityConfig.java         # Enables @PreAuthorize
│   │   ├── controller/                           # REST endpoints (~35 controllers)
│   │   ├── service/                              # Business logic
│   │   │   └── impl/                             # Service implementations
│   │   ├── model/                                # JPA entities (~102 models)
│   │   ├── dto/                                  # Request/response objects (~100+ DTOs)
│   │   │   ├── auth/ parcel/ payment/ delivery/  # Domain-grouped DTOs
│   │   │   └── error/                            # ErrorResponse + ErrorCode
│   │   ├── repository/                           # Spring Data JPA repos (~37)
│   │   ├── security/                             # JWT, OAuth, rate limit, lockout
│   │   │   ├── JwtService.java
│   │   │   ├── JwtAuthFilter.java
│   │   │   ├── GoogleTokenVerifierService.java
│   │   │   ├── RateLimitFilter.java
│   │   │   └── AccountLockoutService.java
│   │   ├── exception/                            # GlobalExceptionHandler + ErrorCode
│   │   ├── bootstrap/                            # DefaultAdminBootstrap (startup init)
│   │   ├── ai/                                   # Spring AI / OpenAI integration
│   │   └── sse/                                  # Server-Sent Events (real-time)
│   ├── resources/
│   │   ├── application.properties
│   │   └── sql/                                  # DB migration scripts
│   └── test/
├── pom.xml
├── .env.template
└── Dockerfile
```

---

## Layered Architecture

```
HTTP Request
     │
     ▼
┌──────────────────────────────────────────────────────────┐
│                     Filter Chain                          │
│  RateLimitFilter → JwtAuthFilter → SecurityConfig        │
└──────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                   Controller Layer                        │
│  @RestController — validates input, maps DTOs            │
└─────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                          │
│  Interface + Impl — contains ALL business logic          │
└─────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                  Repository Layer                         │
│  JpaRepository<Entity, UUID> — DB queries                │
└─────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│              Database (MySQL / TiDB Cloud)                │
└─────────────────────────────────────────────────────────┘
```

---

## Core Architectural Patterns

### 1. Interface-Based Services
Every service is defined as an interface with a concrete `impl/` implementation. This decouples contracts from execution and makes unit testing easy.

```
service/
├── AuthService.java              # interface
├── impl/
│   └── AuthServiceImpl.java      # implementation
```

### 2. DTO Separation
Entities are never exposed directly. All API inputs/outputs use dedicated DTO classes grouped by domain in `dto/<domain>/`.

### 3. Domain-Driven Packaging
Controllers, services, and DTOs are all co-organized by business domain (auth, parcel, payment, delivery, risk, compliance, AI, etc.).

### 4. Event Sourcing for Parcel State
`ScanEvent` records are the authoritative source of parcel history. The current `ParcelStatus` field is a denormalized cache updated on each scan.

### 5. Audit Trail Everywhere
Every entity mutation is recorded in `AuditLog` (actor, IP, user-agent, old/new JSON values, timestamp).

### 6. Offline-First Mobile Support
`ScanEvent` supports an `synced` flag + `offlineCreatedAt` timestamp to handle mobile apps creating events while offline and syncing later.

---

## Key Third-Party Integrations

| Integration | Purpose | Library/API |
|---|---|---|
| Google OAuth2 | User authentication | `google-api-client` |
| Google Maps | Geolocation / routing | Google Maps Platform |
| MTN Mobile Money | Payment gateway | MTN MoMo API |
| Twilio | SMS notifications | Twilio SDK |
| OpenAI | AI recommendations, anomaly detection | Spring AI 1.0.3 |
| PDFBox | Invoice PDF generation | Apache PDFBox 2.0.27 |
| ZXing | QR code generation | ZXing 3.5.2 |
| Caffeine | In-memory caching | Caffeine 3.1.8 |
| JJWT | JWT signing/parsing | JJWT 0.11.5 |

---

## Environment Variables (`.env.template`)

| Variable | Required | Description |
|---|---|---|
| `SMARTCAMPOST_JWT_SECRET` | Yes | HS256 signing key (min 32 chars) |
| `JWT_EXPIRATION_HOURS` | No (default 8) | Token lifetime |
| `DATABASE_URL` | Yes | JDBC connection URL |
| `DATABASE_USERNAME` | Yes | DB user |
| `DATABASE_PASSWORD` | Yes | DB password |
| `QR_SECRET_KEY` | Yes | QR HMAC key (min 32 chars) |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated allowed origins |
| `GOOGLE_CLIENT_ID` | Yes | OAuth2 audience verification |
| `TWILIO_*` | Yes | SMS gateway credentials |
| `MTN_*` | Yes | Mobile Money credentials |
| `OPENAI_API_KEY` | Yes | AI features |
| `RATE_LIMIT_ENABLED` | No | Toggle rate limiting |
| `RATE_LIMIT_RPM` | No (default 60) | General requests/min per IP |
| `AUTH_RATE_LIMIT_RPM` | No (default 10) | Auth requests/min per IP |
| `ADMIN_PHONE` | No | Bootstrap admin phone |
| `ADMIN_PASSWORD` | No | Bootstrap admin password |
| `ADMIN_EMAIL` | No | Bootstrap admin email |
| `NOTIFICATION_GATEWAY` | No (default mock) | `mock` or `twilio` |
| `PAYMENT_GATEWAY` | No (default mtn) | `mtn` or other |

---

## Caching Strategy

```
CacheConfig.java — Caffeine (in-memory)
├── Expiration: 10 minutes (write-based TTL)
├── Max entries: 5,000
└── Cached: FAQ, pricing, agency data, tariff lookups
```

> **Warning:** Caffeine cache is node-local. Multi-instance deployments need Redis for shared cache.

---

## Real-Time Capabilities

- **SSE (Server-Sent Events):** `sse/` package provides push-based event streams for live parcel tracking
- **JWT fallback via query param:** `?token=<jwt>` allows SSE/WebSocket connections that cannot set `Authorization` headers

---

## Startup Bootstrap

`DefaultAdminBootstrap.java` implements `ApplicationRunner` and runs once on application start:
1. Reads `ADMIN_PHONE`, `ADMIN_PASSWORD`, `ADMIN_FULLNAME`, `ADMIN_EMAIL` from environment
2. Skips silently if any are blank
3. Skips if a UserAccount with that phone already exists
4. Creates a `Staff` entity + linked `UserAccount` with `ADMIN` role
