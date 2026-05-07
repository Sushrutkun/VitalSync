# Graph Report - VitalSync  (2026-05-08)

## Corpus Check
- 81 files · ~54,183 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 287 nodes · 290 edges · 30 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]

## God Nodes (most connected - your core abstractions)
1. `AuthService` - 10 edges
2. `buildSnapshotForWindow()` - 9 edges
3. `GlobalExceptionHandler` - 7 edges
4. `JwtAuthFilter` - 6 edges
5. `AuthController` - 6 edges
6. `MainActivity` - 5 edges
7. `syncLastMinute()` - 5 edges
8. `SecurityConfig` - 5 edges
9. `JwtService` - 5 edges
10. `status()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `VitalSync Project` --has_component--> `Expo Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `syncLastMinute()` --calls--> `buildSnapshotForWindow()`  [INFERRED]
  frontend/src/health/sync.ts → frontend/src/health/snapshot.web.ts
- `onSyncNow()` --calls--> `getHealthConnectStatus()`  [INFERRED]
  frontend/app/(app)/index.tsx → frontend/src/health/permissions.ts
- `onSyncNow()` --calls--> `ensureHealthPermissions()`  [INFERRED]
  frontend/app/(app)/index.tsx → frontend/src/health/permissions.ts
- `onSyncNow()` --calls--> `syncLastMinute()`  [INFERRED]
  frontend/app/(app)/index.tsx → frontend/src/health/sync.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (31): Android Icon (Background), Android Icon (Foreground), ApiResponse DTO, ATRT Authentication, POST /api/v1/auth/login, POST /api/v1/auth/refresh, POST /api/v1/auth/signup, bcrypt (+23 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (5): AuthService, JwtService, onSubmit(), onSubmit(), UserRepository

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (5): useForegroundSync(), AppLayout(), onSubmit(), parseOptionalNumber(), React

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (10): HealthSnapshotPublisher, HealthSyncController, accepted(), onSyncNow(), ensureHealthPermissions(), ensureInitialized(), getHealthConnectStatus(), hasHealthPermissions() (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (3): AuthController, status(), GlobalExceptionHandler

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (5): AuthException, KafkaPublishException, JwtAuthFilter, OncePerRequestFilter, RuntimeException

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (9): buildSnapshotForWindow(), readActiveCalories(), readDistanceMeters(), readExerciseSessions(), readHeartRateAvg(), readHeartRateZoneMinutes(), readLatestSpO2(), readStepsSum() (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (6): ApiError, buildUrl(), doFetch(), parseError(), refreshAccessToken(), request()

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (2): UserProfileService, UsersController

### Community 9 - "Community 9"
Cohesion: 0.29
Nodes (7): Android App Launcher Icon, Android Native Module, Expo File-Based Routing, Expo Framework, Expo Frontend Application, VitalSync Project, App Splash Screen Logo - Concentric Circles Design

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (1): MainActivity

### Community 11 - "Community 11"
Cohesion: 0.53
Nodes (4): clamp(), recoveryScore(), sleepScore(), strainScore()

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (2): useThemePref(), ThemeToggle()

### Community 13 - "Community 13"
Cohesion: 0.4
Nodes (1): SecurityConfig

### Community 14 - "Community 14"
Cohesion: 0.33
Nodes (6): vitalsync-backend Deployment, kafka Deployment, kafka-ui Service, vitalsync namespace, postgres Deployment, Kubernetes

### Community 15 - "Community 15"
Cohesion: 0.4
Nodes (5): ExerciseSession, GET /api/v1/health/history, HealthSnapshot, GET /api/v1/health/summary, POST /api/v1/health/sync

### Community 16 - "Community 16"
Cohesion: 0.5
Nodes (1): MainApplication

### Community 18 - "Community 18"
Cohesion: 0.67
Nodes (1): KafkaProducerConfig

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (1): User

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (1): HealthQueryController

### Community 23 - "Community 23"
Cohesion: 0.67
Nodes (1): VitalSyncApplication

### Community 24 - "Community 24"
Cohesion: 0.67
Nodes (1): KafkaTopicConfig

### Community 25 - "Community 25"
Cohesion: 0.67
Nodes (1): JacksonConfig

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (1): OpenApiConfig

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (1): Swagger UI

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (1): UserProfile

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (1): POST /api/v1/auth/logout

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (1): GET /api/v1/users/me

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (1): PATCH /api/v1/users/me

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (1): Android Icon (Monochrome)

## Knowledge Gaps
- **5 isolated node(s):** `VitalSync Project`, `Expo Framework`, `Android App Launcher Icon`, `App Splash Screen Logo - Concentric Circles Design`, `Expo File-Based Routing`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 8`** (10 nodes): `UsersController.java`, `UserProfileService.java`, `UserProfileService`, `.getById()`, `.toDto()`, `.update()`, `UsersController`, `.me()`, `.requireUserId()`, `.updateMe()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (6 nodes): `MainActivity.kt`, `MainActivity`, `.createReactActivityDelegate()`, `.getMainComponentName()`, `.invokeDefaultOnBackPressed()`, `.onCreate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (6 nodes): `ThemeToggle.tsx`, `ThemeProvider.tsx`, `isPreference()`, `ThemeProvider()`, `useThemePref()`, `ThemeToggle()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (6 nodes): `SecurityConfig.java`, `SecurityConfig`, `.corsConfigurationSource()`, `.passwordEncoder()`, `.SecurityConfig()`, `.securityFilterChain()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (4 nodes): `MainApplication.kt`, `MainApplication`, `.onConfigurationChanged()`, `.onCreate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (4 nodes): `KafkaProducerConfig.java`, `KafkaProducerConfig`, `.kafkaTemplate()`, `.producerFactory()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (4 nodes): `User.java`, `User`, `.onInsert()`, `.onUpdate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (4 nodes): `HealthQueryController.java`, `HealthQueryController`, `.history()`, `.summary()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (3 nodes): `VitalSyncApplication.java`, `VitalSyncApplication`, `.main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (3 nodes): `KafkaTopicConfig.java`, `KafkaTopicConfig`, `.vitalSyncDataTopic()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (3 nodes): `JacksonConfig.java`, `JacksonConfig`, `.scalarToStringCoercion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (3 nodes): `OpenApiConfig.java`, `OpenApiConfig`, `.vitalSyncOpenAPI()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `Swagger UI`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `UserProfile`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `POST /api/v1/auth/logout`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `GET /api/v1/users/me`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `PATCH /api/v1/users/me`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `Android Icon (Monochrome)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `VitalSync Project`, `Expo Framework`, `Android App Launcher Icon` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._