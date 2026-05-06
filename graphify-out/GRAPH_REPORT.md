# Graph Report - .  (2026-05-06)

## Corpus Check
- 0 files · ~99,999 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 262 nodes · 244 edges · 33 communities detected
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth API Surface|Auth API Surface]]
- [[_COMMUNITY_Health Sync Backend|Health Sync Backend]]
- [[_COMMUNITY_LoginSignup Forms|Login/Signup Forms]]
- [[_COMMUNITY_Frontend Sync & Permissions|Frontend Sync & Permissions]]
- [[_COMMUNITY_Backend Error Handling|Backend Error Handling]]
- [[_COMMUNITY_Android Assets & Health Connect|Android Assets & Health Connect]]
- [[_COMMUNITY_Frontend API Client|Frontend API Client]]
- [[_COMMUNITY_Health Snapshot Builder|Health Snapshot Builder]]
- [[_COMMUNITY_Expo Framework Wiring|Expo Framework Wiring]]
- [[_COMMUNITY_JWT Auth Filter|JWT Auth Filter]]
- [[_COMMUNITY_Auth Controller|Auth Controller]]
- [[_COMMUNITY_JWT Service|JWT Service]]
- [[_COMMUNITY_K8s Infrastructure|K8s Infrastructure]]
- [[_COMMUNITY_Android MainActivity|Android MainActivity]]
- [[_COMMUNITY_Health Score Math|Health Score Math]]
- [[_COMMUNITY_Theme System|Theme System]]
- [[_COMMUNITY_Spring Security Config|Spring Security Config]]
- [[_COMMUNITY_Health API Endpoints|Health API Endpoints]]
- [[_COMMUNITY_Kafka Producer Config|Kafka Producer Config]]
- [[_COMMUNITY_User Repository|User Repository]]
- [[_COMMUNITY_Profile Form|Profile Form]]
- [[_COMMUNITY_Android MainApplication|Android MainApplication]]
- [[_COMMUNITY_User Entity|User Entity]]
- [[_COMMUNITY_Spring Boot Bootstrap|Spring Boot Bootstrap]]
- [[_COMMUNITY_Kafka Topic Config|Kafka Topic Config]]
- [[_COMMUNITY_Jackson JSON Config|Jackson JSON Config]]
- [[_COMMUNITY_OpenAPI Config|OpenAPI Config]]
- [[_COMMUNITY_Swagger UI|Swagger UI]]
- [[_COMMUNITY_UserProfile DTO|UserProfile DTO]]
- [[_COMMUNITY_Logout Endpoint|Logout Endpoint]]
- [[_COMMUNITY_Get Me Endpoint|Get Me Endpoint]]
- [[_COMMUNITY_Patch Me Endpoint|Patch Me Endpoint]]
- [[_COMMUNITY_Android Monochrome Icon|Android Monochrome Icon]]

## God Nodes (most connected - your core abstractions)
1. `AuthService` - 10 edges
2. `GlobalExceptionHandler` - 7 edges
3. `buildSnapshotForWindow()` - 7 edges
4. `JwtAuthFilter` - 6 edges
5. `AuthController` - 6 edges
6. `JwtService` - 5 edges
7. `MainActivity` - 5 edges
8. `SecurityConfig` - 5 edges
9. `AuthException` - 4 edges
10. `Expo Frontend Application` - 4 edges

## Surprising Connections (you probably didn't know these)
- `VitalSync Project` --has_component--> `Expo Frontend Application`  [INFERRED]
  /Users/sushrutda/Desktop/personal/VitalSync/README.md → /Users/sushrutda/Desktop/personal/VitalSync/frontend/README.md
- `onSyncNow()` --calls--> `getHealthConnectStatus()`  [INFERRED]
  frontend/app/(app)/index.tsx → frontend/src/health/permissions.ts
- `onSyncNow()` --calls--> `ensureHealthPermissions()`  [INFERRED]
  frontend/app/(app)/index.tsx → frontend/src/health/permissions.ts
- `onSyncNow()` --calls--> `syncLastMinute()`  [INFERRED]
  frontend/app/(app)/index.tsx → frontend/src/health/sync.ts
- `buildSnapshotForWindow()` --calls--> `syncLastMinute()`  [INFERRED]
  frontend/src/health/snapshot.web.ts → frontend/src/health/sync.ts

## Communities

### Community 0 - "Auth API Surface"
Cohesion: 0.13
Nodes (24): ApiResponse DTO, ATRT Authentication, POST /api/v1/auth/login, POST /api/v1/auth/refresh, POST /api/v1/auth/signup, bcrypt, DataIngestionController, Docker (+16 more)

### Community 1 - "Health Sync Backend"
Cohesion: 0.12
Nodes (6): HealthSyncController, accepted(), AuthException, RuntimeException, HealthSnapshotPublisher, KafkaPublishException

### Community 2 - "Login/Signup Forms"
Cohesion: 0.21
Nodes (3): onSubmit(), onSubmit(), AuthService

### Community 3 - "Frontend Sync & Permissions"
Cohesion: 0.23
Nodes (7): onSyncNow(), ensureHealthPermissions(), ensureInitialized(), getHealthConnectStatus(), hasHealthPermissions(), buildSnapshotForWindow(), syncLastMinute()

### Community 4 - "Backend Error Handling"
Cohesion: 0.29
Nodes (2): status(), GlobalExceptionHandler

### Community 5 - "Android Assets & Health Connect"
Cohesion: 0.2
Nodes (8): Android Icon (Background), Android Icon (Foreground), Favicon, Android Health Connect, React, React Logo, VitalSync, VitalSync Frontend

### Community 6 - "Frontend API Client"
Cohesion: 0.29
Nodes (6): ApiError, buildUrl(), doFetch(), parseError(), refreshAccessToken(), request()

### Community 7 - "Health Snapshot Builder"
Cohesion: 0.39
Nodes (7): buildSnapshotForWindow(), readActiveCalories(), readExerciseSessions(), readHeartRateAvg(), readLatestSpO2(), readStepsSum(), startOfUtcDay()

### Community 8 - "Expo Framework Wiring"
Cohesion: 0.29
Nodes (7): Android App Launcher Icon, Android Native Module, Expo File-Based Routing, Expo Framework, Expo Frontend Application, VitalSync Project, App Splash Screen Logo - Concentric Circles Design

### Community 9 - "JWT Auth Filter"
Cohesion: 0.38
Nodes (2): JwtAuthFilter, OncePerRequestFilter

### Community 10 - "Auth Controller"
Cohesion: 0.29
Nodes (1): AuthController

### Community 11 - "JWT Service"
Cohesion: 0.33
Nodes (1): JwtService

### Community 12 - "K8s Infrastructure"
Cohesion: 0.33
Nodes (6): vitalsync-backend Deployment, kafka Deployment, kafka-ui Service, vitalsync namespace, postgres Deployment, Kubernetes

### Community 13 - "Android MainActivity"
Cohesion: 0.33
Nodes (1): MainActivity

### Community 14 - "Health Score Math"
Cohesion: 0.53
Nodes (4): clamp(), recoveryScore(), sleepScore(), strainScore()

### Community 15 - "Theme System"
Cohesion: 0.33
Nodes (2): useThemePref(), ThemeToggle()

### Community 16 - "Spring Security Config"
Cohesion: 0.4
Nodes (1): SecurityConfig

### Community 17 - "Health API Endpoints"
Cohesion: 0.4
Nodes (5): ExerciseSession, GET /api/v1/health/history, HealthSnapshot, GET /api/v1/health/summary, POST /api/v1/health/sync

### Community 18 - "Kafka Producer Config"
Cohesion: 0.67
Nodes (1): KafkaProducerConfig

### Community 19 - "User Repository"
Cohesion: 0.5
Nodes (1): UserRepository

### Community 20 - "Profile Form"
Cohesion: 0.67
Nodes (2): onSubmit(), parseOptionalNumber()

### Community 21 - "Android MainApplication"
Cohesion: 0.5
Nodes (1): MainApplication

### Community 23 - "User Entity"
Cohesion: 0.5
Nodes (1): User

### Community 25 - "Spring Boot Bootstrap"
Cohesion: 0.67
Nodes (1): VitalSyncApplication

### Community 26 - "Kafka Topic Config"
Cohesion: 0.67
Nodes (1): KafkaTopicConfig

### Community 27 - "Jackson JSON Config"
Cohesion: 0.67
Nodes (1): JacksonConfig

### Community 28 - "OpenAPI Config"
Cohesion: 0.67
Nodes (1): OpenApiConfig

### Community 50 - "Swagger UI"
Cohesion: 1.0
Nodes (1): Swagger UI

### Community 51 - "UserProfile DTO"
Cohesion: 1.0
Nodes (1): UserProfile

### Community 52 - "Logout Endpoint"
Cohesion: 1.0
Nodes (1): POST /api/v1/auth/logout

### Community 53 - "Get Me Endpoint"
Cohesion: 1.0
Nodes (1): GET /api/v1/users/me

### Community 54 - "Patch Me Endpoint"
Cohesion: 1.0
Nodes (1): PATCH /api/v1/users/me

### Community 55 - "Android Monochrome Icon"
Cohesion: 1.0
Nodes (1): Android Icon (Monochrome)

## Knowledge Gaps
- **5 isolated node(s):** `VitalSync Project`, `Expo Framework`, `Android App Launcher Icon`, `App Splash Screen Logo - Concentric Circles Design`, `Expo File-Based Routing`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Backend Error Handling`** (11 nodes): `AuthErrorCode.java`, `GlobalExceptionHandler.java`, `AuthErrorCode()`, `status()`, `GlobalExceptionHandler`, `.error()`, `.handleAuth()`, `.handleGeneric()`, `.handleKafka()`, `.handleUnreadable()`, `.handleValidation()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `JWT Auth Filter`** (7 nodes): `JwtAuthFilter.java`, `JwtAuthFilter`, `.doFilterInternal()`, `.JwtAuthFilter()`, `.shouldNotFilter()`, `.writeError()`, `OncePerRequestFilter`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Controller`** (7 nodes): `AuthController.java`, `AuthController`, `.AuthController()`, `.login()`, `.logout()`, `.refresh()`, `.signup()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `JWT Service`** (6 nodes): `JwtService.java`, `JwtService`, `.accessTtlSeconds()`, `.issue()`, `.JwtService()`, `.parse()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Android MainActivity`** (6 nodes): `MainActivity`, `.createReactActivityDelegate()`, `.getMainComponentName()`, `.invokeDefaultOnBackPressed()`, `.onCreate()`, `MainActivity.kt`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Theme System`** (6 nodes): `ThemeToggle.tsx`, `ThemeProvider.tsx`, `isPreference()`, `ThemeProvider()`, `useThemePref()`, `ThemeToggle()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Spring Security Config`** (6 nodes): `SecurityConfig.java`, `SecurityConfig`, `.corsConfigurationSource()`, `.passwordEncoder()`, `.SecurityConfig()`, `.securityFilterChain()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Kafka Producer Config`** (4 nodes): `KafkaProducerConfig.java`, `KafkaProducerConfig`, `.kafkaTemplate()`, `.producerFactory()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `User Repository`** (4 nodes): `UserRepository.java`, `UserRepository`, `.existsByEmail()`, `.findByEmail()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Profile Form`** (4 nodes): `numberInRange()`, `onSubmit()`, `parseOptionalNumber()`, `profile.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Android MainApplication`** (4 nodes): `MainApplication`, `.onConfigurationChanged()`, `.onCreate()`, `MainApplication.kt`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `User Entity`** (4 nodes): `User.java`, `User`, `.onInsert()`, `.onUpdate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Spring Boot Bootstrap`** (3 nodes): `VitalSyncApplication.java`, `VitalSyncApplication`, `.main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Kafka Topic Config`** (3 nodes): `KafkaTopicConfig.java`, `KafkaTopicConfig`, `.vitalSyncDataTopic()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Jackson JSON Config`** (3 nodes): `JacksonConfig.java`, `JacksonConfig`, `.scalarToStringCoercion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `OpenAPI Config`** (3 nodes): `OpenApiConfig.java`, `OpenApiConfig`, `.vitalSyncOpenAPI()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Swagger UI`** (1 nodes): `Swagger UI`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `UserProfile DTO`** (1 nodes): `UserProfile`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Logout Endpoint`** (1 nodes): `POST /api/v1/auth/logout`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Get Me Endpoint`** (1 nodes): `GET /api/v1/users/me`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Patch Me Endpoint`** (1 nodes): `PATCH /api/v1/users/me`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Android Monochrome Icon`** (1 nodes): `Android Icon (Monochrome)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `VitalSync Project`, `Expo Framework`, `Android App Launcher Icon` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth API Surface` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Health Sync Backend` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._