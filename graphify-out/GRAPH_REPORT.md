# Graph Report - VitalSync  (2026-05-15)

## Corpus Check
- 93 files · ~58,461 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 369 nodes · 422 edges · 32 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.81)
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
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]

## God Nodes (most connected - your core abstractions)
1. `AuthService` - 10 edges
2. `Runner` - 10 edges
3. `buildSnapshotForWindow()` - 9 edges
4. `Parse()` - 8 edges
5. `GlobalExceptionHandler` - 7 edges
6. `JwtAuthFilter` - 6 edges
7. `AuthController` - 6 edges
8. `MainActivity` - 5 edges
9. `syncLastMinute()` - 5 edges
10. `SecurityConfig` - 5 edges

## Surprising Connections (you probably didn't know these)
- `New()` --calls--> `NewClient()`  [INFERRED]
  scripts/loadgen/internal/runner/runner.go → scripts/loadgen/internal/api/client.go
- `VitalSync Project` --has_component--> `Expo Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `buildSnapshotForWindow()` --calls--> `syncLastMinute()`  [INFERRED]
  frontend/src/health/snapshot.web.ts → frontend/src/health/sync.ts
- `main()` --calls--> `Parse()`  [INFERRED]
  scripts/loadgen/cmd/loadgen/main.go → scripts/loadgen/internal/config/config.go
- `onSyncNow()` --calls--> `getHealthConnectStatus()`  [INFERRED]
  frontend/app/(app)/index.tsx → frontend/src/health/permissions.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (42): Android Icon (Background), Android Icon (Foreground), ApiResponse DTO, ATRT Authentication, POST /api/v1/auth/login, POST /api/v1/auth/refresh, POST /api/v1/auth/signup, bcrypt (+34 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (7): useForegroundSync(), AppLayout(), onSubmit(), parseOptionalNumber(), React, useThemePref(), ThemeToggle()

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (9): AuthException, CommandLineRunner, HealthSnapshotPublisher, KafkaPublishException, HealthSyncController, accepted(), KafkaDummyDataSeeder, RuntimeException (+1 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (10): main(), PersonaForUser(), jsonStdout, loadToken(), New(), Runner, storeToken(), Persona (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (3): AuthService, JwtService, UserRepository

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (3): AuthController, status(), GlobalExceptionHandler

### Community 6 - "Community 6"
Cohesion: 0.23
Nodes (11): bloodOxygen(), clamp(), dailyStepsTarget(), diurnalStepWeight(), heartRateForWindow(), stepsForWindow(), UserSimulator, deterministicKey() (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.2
Nodes (8): Config, envBoolOrDefault(), envDurationOrDefault(), envIntOrDefault(), envOrDefault(), Parse(), JwtAuthFilter, OncePerRequestFilter

### Community 8 - "Community 8"
Cohesion: 0.2
Nodes (8): onSyncNow(), ensureHealthPermissions(), ensureInitialized(), getHealthConnectStatus(), getMissingHealthPermissions(), hasHealthPermissions(), buildSnapshotForWindow(), syncLastMinute()

### Community 9 - "Community 9"
Cohesion: 0.19
Nodes (5): Client, HTTPError, NewClient(), onSubmit(), onSubmit()

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (9): buildSnapshotForWindow(), readActiveCalories(), readDistanceMeters(), readExerciseSessions(), readHeartRateAvg(), readHeartRateZoneMinutes(), readLatestSpO2(), readStepsSum() (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.29
Nodes (6): ApiError, buildUrl(), doFetch(), parseError(), refreshAccessToken(), request()

### Community 12 - "Community 12"
Cohesion: 0.29
Nodes (2): UserProfileService, UsersController

### Community 13 - "Community 13"
Cohesion: 0.2
Nodes (9): AuthResponse, AuthUserDto, ErrorResponse, ExerciseSession, HealthSnapshot, HealthSyncRequest, HealthSyncResponse, LoginRequest (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.29
Nodes (7): Android App Launcher Icon, Android Native Module, Expo File-Based Routing, Expo Framework, Expo Frontend Application, VitalSync Project, App Splash Screen Logo - Concentric Circles Design

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (1): MainActivity

### Community 16 - "Community 16"
Cohesion: 0.53
Nodes (4): clamp(), recoveryScore(), sleepScore(), strainScore()

### Community 17 - "Community 17"
Cohesion: 0.4
Nodes (1): SecurityConfig

### Community 18 - "Community 18"
Cohesion: 0.5
Nodes (1): MainApplication

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (1): KafkaProducerConfig

### Community 21 - "Community 21"
Cohesion: 0.5
Nodes (1): User

### Community 22 - "Community 22"
Cohesion: 0.5
Nodes (1): HealthQueryController

### Community 25 - "Community 25"
Cohesion: 0.67
Nodes (1): KafkaTopicConfig

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (1): JacksonConfig

### Community 27 - "Community 27"
Cohesion: 0.67
Nodes (1): OpenApiConfig

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (1): SeedProperties

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (1): Swagger UI

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (1): UserProfile

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (1): POST /api/v1/auth/logout

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (1): GET /api/v1/users/me

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (1): PATCH /api/v1/users/me

### Community 69 - "Community 69"
Cohesion: 1.0
Nodes (1): Android Icon (Monochrome)

## Knowledge Gaps
- **17 isolated node(s):** `SeedProperties`, `SignupRequest`, `LoginRequest`, `AuthUserDto`, `AuthResponse` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 12`** (10 nodes): `UsersController.java`, `UserProfileService.java`, `UserProfileService`, `.getById()`, `.toDto()`, `.update()`, `UsersController`, `.me()`, `.requireUserId()`, `.updateMe()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (6 nodes): `MainActivity.kt`, `MainActivity`, `.createReactActivityDelegate()`, `.getMainComponentName()`, `.invokeDefaultOnBackPressed()`, `.onCreate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (6 nodes): `SecurityConfig.java`, `SecurityConfig`, `.corsConfigurationSource()`, `.passwordEncoder()`, `.SecurityConfig()`, `.securityFilterChain()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (4 nodes): `MainApplication.kt`, `MainApplication`, `.onConfigurationChanged()`, `.onCreate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (4 nodes): `KafkaProducerConfig.java`, `KafkaProducerConfig`, `.kafkaTemplate()`, `.producerFactory()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (4 nodes): `User.java`, `User`, `.onInsert()`, `.onUpdate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (4 nodes): `HealthQueryController.java`, `HealthQueryController`, `.history()`, `.summary()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (3 nodes): `KafkaTopicConfig.java`, `KafkaTopicConfig`, `.vitalSyncDataTopic()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (3 nodes): `JacksonConfig.java`, `JacksonConfig`, `.scalarToStringCoercion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (3 nodes): `OpenApiConfig.java`, `OpenApiConfig`, `.vitalSyncOpenAPI()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `SeedProperties.java`, `SeedProperties`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `Swagger UI`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `UserProfile`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `POST /api/v1/auth/logout`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (1 nodes): `GET /api/v1/users/me`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `PATCH /api/v1/users/me`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (1 nodes): `Android Icon (Monochrome)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `onSubmit()` connect `Community 9` to `Community 4`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `onSubmit()` connect `Community 9` to `Community 4`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **What connects `SeedProperties`, `SignupRequest`, `LoginRequest` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._