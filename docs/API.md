# VitalSync — Backend API Specification

> **Version:** 1.0  
> **Base path:** `/api/v1`  
> **Format:** All request and response bodies are `application/json`  
> **Auth:** Bearer token (JWT) — see [Authentication](#authentication)

---

## Table of Contents

1. [General Conventions](#1-general-conventions)
2. [Authentication](#2-authentication)
3. [Error Format](#3-error-format)
4. [Endpoints](#4-endpoints)
   - [Auth — Signup](#40-post-apiv1authsignup)
   - [Auth — Login](#41-post-apiv1authlogin)
   - [Auth — Refresh](#42-post-apiv1authrefresh)
   - [Auth — Logout](#43-post-apiv1authlogout)
   - [Health — Sync](#44-post-apiv1healthsync)
   - [Health — Daily Summary](#45-get-apiv1healthsummary)
   - [Health — History](#46-get-apiv1healthhistory)
   - [User — Get Profile](#47-get-apiv1usersme)
   - [User — Update Profile](#48-patch-apiv1usersme)
5. [Data Models](#5-data-models)
6. [Database Schema](#6-database-schema)
7. [Backend Implementation Rules](#7-backend-implementation-rules)

---

## 1. General Conventions

### Versioning
All routes are prefixed with `/api/v1`. When a breaking change is needed, a new version prefix (`/api/v2`) is introduced. Old versions are deprecated with a minimum 3-month notice.

### Dates & Times
- All timestamps are **ISO 8601 UTC** strings: `"2026-04-23T10:30:00.000Z"`
- All date-only fields use `YYYY-MM-DD` format: `"2026-04-23"`

### Units
All units are **SI** unless stated otherwise:
| Metric | Unit |
|---|---|
| Distance | Meters (`m`) |
| Mass / Weight | Kilograms (`kg`) |
| Energy | Kilocalories (`kcal`) |
| Speed | Meters per second (`m/s`) |
| Heart rate | Beats per minute (`bpm`) |
| Blood oxygen | Percentage (`%`) |

### Pagination
List endpoints that can return large datasets support cursor-based pagination:
```
GET /api/v1/health/history?from=...&to=...&limit=100&cursor=<opaque_cursor>
```
Response includes a `nextCursor` field. If `null`, there are no more pages.

### Idempotency
`POST /api/v1/health/sync` requires an `idempotencyKey`. The backend must deduplicate on this key — receiving the same key twice must return `200` without creating a duplicate record.

---

## 2. Authentication

VitalSync uses **Access Token + Refresh Token (ATRT)** auth.

| Token | Type | Lifetime | Storage (backend) |
|---|---|---|---|
| `accessToken` | JWT (signed HS256 or RS256) | 24 hours | Stateless — not stored |
| `refreshToken` | Opaque random string (32+ bytes), wire format `{id}.{secret}` | 180 days (~6 months) | Hashed (bcrypt) in DB — only the secret half is hashed |

### JWT Payload
```json
{
  "sub": "user_abc123",
  "email": "user@example.com",
  "iat": 1745400000,
  "exp": 1745400900
}
```

### How the mobile app uses tokens
1. App sends `accessToken` as `Authorization: Bearer <token>` on every request.
2. On `401`, the app calls `POST /api/v1/auth/refresh` with the stored `refreshToken`.
3. On successful refresh, **both** a new `accessToken` and a new `refreshToken` are issued (rotation — see §7.2).
4. On refresh failure (`401`), the app clears all local tokens and redirects to login.

### Protected Routes
All routes except `POST /auth/login` and `POST /auth/refresh` require a valid `Authorization: Bearer <accessToken>` header.

---

## 3. Error Format

All errors follow a consistent envelope:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect.",
    "details": {}
  }
}
```

| Field | Description |
|---|---|
| `code` | Machine-readable constant (SCREAMING_SNAKE_CASE). Never changes between releases. |
| `message` | Human-readable string. May change — do not parse it. |
| `details` | Optional object with field-level validation errors or extra context. |

### Standard Error Codes

| HTTP | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request body fails validation. `details` contains field errors. |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password. |
| 401 | `TOKEN_EXPIRED` | Access token has expired. |
| 401 | `TOKEN_INVALID` | Access token is malformed or signature is wrong. |
| 401 | `REFRESH_TOKEN_EXPIRED` | Refresh token has expired. App must re-login. |
| 401 | `REFRESH_TOKEN_INVALID` | Refresh token not found or already used. |
| 403 | `FORBIDDEN` | Authenticated but not authorised for this resource. |
| 404 | `NOT_FOUND` | Resource does not exist. |
| 409 | `CONFLICT` | Duplicate resource (e.g. email already registered). |
| 422 | `UNPROCESSABLE` | Semantically invalid request (e.g. `periodEnd` before `periodStart`). |
| 429 | `RATE_LIMITED` | Too many requests. Include `Retry-After` header. |
| 500 | `INTERNAL_ERROR` | Unexpected server error. Log and alert. |

---

## 4. Endpoints

---

### 4.0 `POST /api/v1/auth/signup`

Creates a new user account and immediately issues an access + refresh token pair (auto-login).

**Auth required:** No

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "s3cur3P@ssword",
  "name": "Keshav"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `email` | string | Yes | Valid email format, max 254 chars |
| `password` | string | Yes | Min 8 chars, max 128 |
| `name` | string | Yes | Non-blank, max 128 chars |

#### Response `201 Created`
Same shape as `POST /auth/login`:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "rt_abc.d4f8a2c1b9e3...",
  "expiresIn": 86400,
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "Keshav"
  }
}
```

#### Error Responses
| HTTP | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing or malformed fields |
| 409 | `CONFLICT` | Email already registered |

---

### 4.1 `POST /api/v1/auth/login`

Authenticates a user and issues an access + refresh token pair.

**Auth required:** No

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "s3cur3P@ssword"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `email` | string | Yes | Valid email format, max 254 chars |
| `password` | string | Yes | Min 8 chars |

#### Response `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "d4f8a2c1b9e3...",
  "expiresIn": 86400,
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "Keshav"
  }
}
```

| Field | Type | Description |
|---|---|---|
| `accessToken` | string | JWT — attach to all subsequent requests |
| `refreshToken` | string | Opaque — store securely, use only to refresh |
| `expiresIn` | number | Seconds until `accessToken` expires (always `86400`) |
| `user` | object | Basic profile of the authenticated user |

#### Error Responses
| HTTP | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing or malformed fields |
| 401 | `INVALID_CREDENTIALS` | Email not found or password wrong |

---

### 4.2 `POST /api/v1/auth/refresh`

Issues a new access token + refresh token pair. The submitted refresh token is **immediately invalidated** (rotation).

**Auth required:** No

#### Request Body
```json
{
  "refreshToken": "d4f8a2c1b9e3..."
}
```

#### Response `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "e7g1h3i2j4k5...",
  "expiresIn": 86400
}
```

#### Error Responses
| HTTP | Code | Condition |
|---|---|---|
| 401 | `REFRESH_TOKEN_INVALID` | Token not in DB or already rotated |
| 401 | `REFRESH_TOKEN_EXPIRED` | Token is past its 30-day expiry |

---

### 4.3 `POST /api/v1/auth/logout`

Invalidates the submitted refresh token. The access token expires naturally (JWT is stateless).

**Auth required:** Yes

#### Request Body
```json
{
  "refreshToken": "d4f8a2c1b9e3..."
}
```

#### Response `204 No Content`
Empty body.

---

### 4.4 `POST /api/v1/health/sync`

Receives a health snapshot collected by the mobile app from Android Health Connect. Idempotent — duplicate `idempotencyKey` values are silently ignored.

**Auth required:** Yes

#### Request Body
```json
{
  "userId": "user_abc123",
  "idempotencyKey": "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  "periodStart": "2026-04-23T10:00:00.000Z",
  "periodEnd": "2026-04-23T10:01:00.000Z",
  "snapshot": {
    "timestamp": "2026-04-23T10:01:00.000Z",
    "periodStart": "2026-04-23T10:00:00.000Z",
    "periodEnd": "2026-04-23T10:01:00.000Z",
    "heartRateBpm": 74,
    "stepsTotal": 4821,
    "stepsDelta": 112,
    "bloodOxygenPct": 97.4,
    "activeCaloriesKcal": 6.2,
    "exerciseSessions": [
      {
        "type": "RUNNING",
        "startTime": "2026-04-23T09:00:00.000Z",
        "endTime": "2026-04-23T09:45:00.000Z",
        "durationMinutes": 45,
        "calories": 420,
        "distanceMeters": 6200,
        "avgHeartRateBpm": 152
      }
    ]
  }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `userId` | string | Yes | Must match the authenticated user's ID |
| `idempotencyKey` | string | Yes | UUID v4 — backend deduplicates on this |
| `periodStart` | string (ISO 8601) | Yes | Start of the sampled window |
| `periodEnd` | string (ISO 8601) | Yes | End of the sampled window. Must be after `periodStart`. |
| `snapshot` | object | Yes | See `HealthSnapshot` model in §5 |

#### Response `200 OK`
```json
{
  "received": true,
  "duplicate": false
}
```

| Field | Description |
|---|---|
| `received` | Always `true` on success |
| `duplicate` | `true` if `idempotencyKey` was already processed — no data was written |

#### Error Responses
| HTTP | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing fields or malformed data |
| 401 | `TOKEN_EXPIRED` / `TOKEN_INVALID` | Bad access token |
| 403 | `FORBIDDEN` | `userId` in body does not match token subject |
| 422 | `UNPROCESSABLE` | `periodEnd` ≤ `periodStart` |

---

### 4.5 `GET /api/v1/health/summary`

Returns aggregated health data for a specific day.

**Auth required:** Yes

#### Query Parameters
| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `date` | string (`YYYY-MM-DD`) | No | Today (UTC) | The day to return a summary for |

#### Response `200 OK`
```json
{
  "date": "2026-04-23",
  "steps": 8432,
  "activeCaloriesKcal": 312,
  "avgHeartRateBpm": 72,
  "restingHeartRateBpm": 58,
  "bloodOxygenPct": 97.2,
  "sleepDurationMinutes": 475,
  "exerciseSessions": [
    {
      "type": "RUNNING",
      "startTime": "2026-04-23T09:00:00.000Z",
      "endTime": "2026-04-23T09:45:00.000Z",
      "durationMinutes": 45,
      "calories": 420,
      "distanceMeters": 6200,
      "avgHeartRateBpm": 152
    }
  ]
}
```

#### Error Responses
| HTTP | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | `date` is not a valid `YYYY-MM-DD` string |
| 404 | `NOT_FOUND` | No data exists for this user on this date |

---

### 4.6 `GET /api/v1/health/history`

Returns a list of health snapshots within a time range. Supports pagination.

**Auth required:** Yes

#### Query Parameters
| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `from` | string (ISO 8601) | Yes | — | Start of range (inclusive) |
| `to` | string (ISO 8601) | Yes | — | End of range (inclusive) |
| `types` | string (comma-separated) | No | All | Filter by fields: `heartRate,steps,bloodOxygen,calories` |
| `limit` | number | No | `100` | Max records per page (max `500`) |
| `cursor` | string | No | — | Pagination cursor from previous response |

#### Response `200 OK`
```json
{
  "snapshots": [
    {
      "timestamp": "2026-04-23T10:01:00.000Z",
      "periodStart": "2026-04-23T10:00:00.000Z",
      "periodEnd": "2026-04-23T10:01:00.000Z",
      "heartRateBpm": 74,
      "stepsTotal": 4821,
      "stepsDelta": 112,
      "bloodOxygenPct": 97.4,
      "activeCaloriesKcal": 6.2,
      "exerciseSessions": []
    }
  ],
  "nextCursor": "eyJsYXN0SWQiOiJ4eXoifQ==",
  "total": 1440
}
```

| Field | Description |
|---|---|
| `snapshots` | Array of `HealthSnapshot` objects (§5) |
| `nextCursor` | Opaque string — pass as `cursor` to get next page. `null` = no more pages. |
| `total` | Total number of snapshots in the range (not just this page) |

#### Error Responses
| HTTP | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing `from`/`to`, or `to` before `from` |
| 422 | `UNPROCESSABLE` | Range exceeds 90 days |

---

### 4.7 `GET /api/v1/users/me`

Returns the authenticated user's profile.

**Auth required:** Yes

#### Response `200 OK`
```json
{
  "id": "user_abc123",
  "email": "user@example.com",
  "name": "Keshav",
  "dateOfBirth": "1995-06-15",
  "heightCm": 175,
  "weightKg": 74.2,
  "createdAt": "2026-01-10T08:00:00.000Z"
}
```

---

### 4.8 `PATCH /api/v1/users/me`

Updates the authenticated user's profile. Only send fields you want to change.

**Auth required:** Yes

#### Request Body
```json
{
  "name": "Keshav S",
  "heightCm": 176,
  "weightKg": 73.5
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | No | Max 100 chars |
| `dateOfBirth` | string (`YYYY-MM-DD`) | No | Must be in the past |
| `heightCm` | number | No | 50–300 |
| `weightKg` | number | No | 10–500 |

#### Response `200 OK`
Returns the full updated `UserProfile` object (same shape as §4.7).

---

## 5. Data Models

### HealthSnapshot
```typescript
{
  timestamp:           string   // ISO 8601 — when this snapshot was taken
  periodStart:         string   // ISO 8601 — start of the measurement window
  periodEnd:           string   // ISO 8601 — end of the measurement window
  heartRateBpm:        number | null   // Average BPM over the window
  stepsTotal:          number | null   // Cumulative steps for the day at periodEnd
  stepsDelta:          number | null   // Steps added during this window only
  bloodOxygenPct:      number | null   // Latest SpO2 reading in window (0–100)
  activeCaloriesKcal:  number | null   // Active calories burned in this window
  exerciseSessions:    ExerciseSession[]
}
```

### ExerciseSession
```typescript
{
  type:             string   // Health Connect exercise type e.g. "RUNNING", "WALKING", "CYCLING"
  startTime:        string   // ISO 8601
  endTime:          string   // ISO 8601
  durationMinutes:  number
  calories?:        number   // kcal — optional
  distanceMeters?:  number   // optional
  avgHeartRateBpm?: number   // optional
}
```

### UserProfile
```typescript
{
  id:           string
  email:        string
  name:         string
  dateOfBirth?: string   // YYYY-MM-DD
  heightCm?:    number
  weightKg?:    number
  createdAt:    string   // ISO 8601
}
```

---

## 6. Database Schema

The backend should implement at minimum the following tables.

### `users`
```sql
id            VARCHAR PRIMARY KEY         -- e.g. UUID or CUID
email         VARCHAR UNIQUE NOT NULL
password_hash VARCHAR NOT NULL            -- bcrypt, cost factor >= 12
name          VARCHAR NOT NULL
date_of_birth DATE
height_cm     NUMERIC(5,1)
weight_kg     NUMERIC(5,2)
created_at    TIMESTAMPTZ DEFAULT now()
updated_at    TIMESTAMPTZ DEFAULT now()
```

### `refresh_tokens`
```sql
id            VARCHAR PRIMARY KEY
user_id       VARCHAR REFERENCES users(id) ON DELETE CASCADE
token_hash    VARCHAR NOT NULL            -- bcrypt hash — NEVER store raw token
device_id     VARCHAR                    -- optional, for per-device revocation
created_at    TIMESTAMPTZ DEFAULT now()
last_used_at  TIMESTAMPTZ
expires_at    TIMESTAMPTZ NOT NULL       -- created_at + 180 days (~6 months)
```

### `health_snapshots`
```sql
id                   VARCHAR PRIMARY KEY
user_id              VARCHAR REFERENCES users(id) ON DELETE CASCADE
idempotency_key      VARCHAR UNIQUE NOT NULL     -- deduplication
period_start         TIMESTAMPTZ NOT NULL
period_end           TIMESTAMPTZ NOT NULL
timestamp            TIMESTAMPTZ NOT NULL
heart_rate_bpm       NUMERIC(5,1)
steps_total          BIGINT
steps_delta          BIGINT
blood_oxygen_pct     NUMERIC(4,1)
active_calories_kcal NUMERIC(8,2)
created_at           TIMESTAMPTZ DEFAULT now()

INDEX ON (user_id, period_start)
INDEX ON idempotency_key
```

### `exercise_sessions`
```sql
id                VARCHAR PRIMARY KEY
snapshot_id       VARCHAR REFERENCES health_snapshots(id) ON DELETE CASCADE
user_id           VARCHAR REFERENCES users(id) ON DELETE CASCADE
type              VARCHAR NOT NULL
start_time        TIMESTAMPTZ NOT NULL
end_time          TIMESTAMPTZ NOT NULL
duration_minutes  INTEGER NOT NULL
calories_kcal     NUMERIC(8,2)
distance_meters   NUMERIC(10,2)
avg_heart_rate    NUMERIC(5,1)

INDEX ON (user_id, start_time)
```

---

## 7. Backend Implementation Rules

### 7.1 Password Storage
- Hash passwords with **bcrypt**, minimum cost factor **12**.
- Never store plaintext or MD5/SHA-1 hashes.

### 7.2 Refresh Token Rotation
Every time `POST /auth/refresh` is called:
1. Look up the submitted token hash in `refresh_tokens`.
2. If not found or expired → return `401 REFRESH_TOKEN_INVALID`.
3. **Delete** the old row immediately.
4. Generate a new 32-byte cryptographically random refresh token.
5. Store its **bcrypt hash** as a new row in `refresh_tokens`.
6. Return both new `accessToken` (JWT) and new raw `refreshToken` to the client.

This means each refresh token can only be used **once**. If a stolen token is used by an attacker before the real user, the next legitimate refresh will return `401` — detecting the breach. At that point, delete **all** refresh tokens for that user and force a full re-login.

### 7.3 Idempotency (Health Sync)
On `POST /health/sync`:
1. Check if `idempotency_key` already exists in `health_snapshots`.
2. If yes → return `200 { received: true, duplicate: true }` immediately.
3. If no → insert the record, return `200 { received: true, duplicate: false }`.

Use a **unique constraint** on `idempotency_key` as the source of truth. Handle the DB unique violation as a duplicate and return the same success response.

### 7.4 userId Validation
The `userId` field in `POST /health/sync` must match `sub` in the authenticated JWT. Reject with `403 FORBIDDEN` if they differ. Never trust a userId from the request body alone.

### 7.5 Rate Limiting
Apply rate limits at the route level:

| Route | Limit |
|---|---|
| `POST /auth/login` | 10 requests / minute / IP |
| `POST /auth/refresh` | 30 requests / minute / user |
| `POST /health/sync` | 120 requests / minute / user |
| All other routes | 300 requests / minute / user |

Return `429` with a `Retry-After: <seconds>` header when exceeded.

### 7.6 HTTPS
All endpoints must be served over **HTTPS only** in production. Reject plain HTTP with `301` redirect.

### 7.7 CORS
Lock CORS to the specific origins that need access. The mobile app does not use a browser, so CORS is only relevant if a web dashboard is added later.

### 7.8 Health Connect Data Window
The mobile app sends one snapshot per minute. Expect `period_end - period_start` to be approximately 60 seconds. Reject with `422` if the window exceeds **24 hours** (indicates a bug on the client).
