# Graph Report - VitalSync  (2026-05-30)

## Corpus Check
- 107 files · ~68,285 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 896 nodes · 956 edges · 67 communities detected
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 73 edges (avg confidence: 0.81)
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
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]

## God Nodes (most connected - your core abstractions)
1. `SDWebImageAVIFCoder` - 15 edges
2. `SDWebImageSVGCoder` - 15 edges
3. `AuthService` - 12 edges
4. `Usage` - 12 edges
5. `VitalSync Frontend` - 11 edges
6. `Runner` - 10 edges
7. `4. Endpoints` - 10 edges
8. `buildSnapshotForWindow()` - 9 edges
9. `HealthConsumerService` - 9 edges
10. `HealthQueryService` - 9 edges

## Surprising Connections (you probably didn't know these)
- `VitalSync Project` --has_component--> `Expo Frontend Application`  [INFERRED]
  README.md → frontend/README.md
- `buildSnapshotForWindow()` --calls--> `syncLastMinute()`  [INFERRED]
  frontend/src/health/snapshot.web.ts → frontend/src/health/sync.ts
- `New()` --calls--> `NewClient()`  [INFERRED]
  scripts/loadgen/internal/runner/runner.go → scripts/loadgen/internal/api/client.go
- `onSyncNow()` --calls--> `getHealthConnectStatus()`  [INFERRED]
  frontend/app/(app)/index.tsx → frontend/src/health/permissions.ts
- `onSyncNow()` --calls--> `ensureHealthPermissions()`  [INFERRED]
  frontend/app/(app)/index.tsx → frontend/src/health/permissions.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (46): Add Coder, Advanced WebP codec options (0.8+), Animated WebP Encoding (0.10+), Author, Carthage, CocoaPods, code:ruby (pod 'SDWebImageWebPCoder'), code:objective-c (// WebP progressive loading for animated image) (+38 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (44): aom, Author, AV1 Codec, AVIF Image Viewer, Carthage, Choose codec at runtime, CocoaPods, code:ruby (pod 'libavif/liaom') (+36 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (46): 4.0 `POST /api/v1/auth/signup`, 4.1 `POST /api/v1/auth/login`, 4.2 `POST /api/v1/auth/refresh`, 4.3 `POST /api/v1/auth/logout`, 4.4 `POST /api/v1/health/sync`, 4.5 `GET /api/v1/health/summary`, 4.6 `GET /api/v1/health/history`, 4.7 `GET /api/v1/users/me` (+38 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (42): 1. General Conventions, 2. Authentication, 3. Error Format, 5. Data Models, 6. Database Schema, 7.1 Password Storage, 7.2 Refresh Token Rotation, 7.3 Idempotency (Health Sync) (+34 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (19): Client, HTTPError, NewClient(), Config, envBoolOrDefault(), envDurationOrDefault(), envIntOrDefault(), envOrDefault() (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (42): Android Icon (Background), Android Icon (Foreground), ApiResponse DTO, ATRT Authentication, POST /api/v1/auth/login, POST /api/v1/auth/refresh, POST /api/v1/auth/signup, bcrypt (+34 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (6): AuroraBackground(), onSubmit(), React, onSubmit(), useThemePref(), ThemeToggle()

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (37): Backend Configuration, Cleanup, code:bash (# Deploy to K8s (builds backend image, creates namespace, ap), code:yaml (resources:), code:bash (kubectl scale deployment vitalsync-backend -n vitalsync --re), code:bash (kubectl describe pod -n vitalsync <pod-name>), code:bash (kubectl logs -n vitalsync <pod-name>), code:bash (# Test connectivity from backend pod) (+29 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (6): DailySummary, DailySummaryRepository, HealthConsumerService, HealthQueryController, HealthQueryService, HealthSnapshotRecordRepository

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (10): AuthController, status(), AuthException, ApiErrorResponse, ErrorBody, GlobalExceptionHandler, KafkaPublishException, JwtAuthFilter (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (35): Additional modules and Ecosystem, Animated Images (GIF) support, Architecture, Author, Backwards compatibility, code:objective-c (#import <SDWebImage/SDWebImage.h>), code:swift (import SDWebImage), code:objective-c (SDAnimatedImageView *imageView = [SDAnimatedImageView new];) (+27 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (33): Author, Background, Backward Deployment, Carthage, CocoaPods, code:ruby (pod 'SDWebImageSVGCoder'), code:html (<path d="M399.8,68.2c77.3,3.1,160.6,32.1" opacity="0.15" fil), code:html (<path d="M399.8,68.2c77.3,3.1,160.6,32.1" fill="rgba(29,36,6) (+25 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (25): After, Build documentation, Can I help?, CLA, CoC, code:block1 (meson setup build --cross-file=package/crossfiles/x86_64-w64), code:block2 (meson setup build --cross-file=package/crossfiles/i686-w64-m), code:block3 (meson setup build --cross-file=package/crossfiles/i686-linux) (+17 more)

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (4): AuthService, ParsedToken, JwtService, UserRepository

### Community 14 - "Community 14"
Cohesion: 0.08
Nodes (23): Build Project, code:block11 (sudo xcode-select -s /path/to/Xcode.app), code:block12 (export DEVELOPER_DIR=/path/to/Xcode.app/Contents/Developer), code:block13 (./Scripts/build-frameworks.sh), code:block14 (./Scripts/create-xcframework.sh), code:block15 (// https://developer.apple.com/support/third-party-SDK-requi), code:objective-c (#import <SDWebImage/SDWebImage.h>), code:objecitivec (@import SDWebImage;) (+15 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (21): ADB Setup, Clean Rebuild, code:bash (npm install), code:bash (npm run ios       # iOS simulator), code:bash (adb devices -l), code:bash (npx expo run:android), code:bash (npm start), code:bash (cd android) (+13 more)

### Community 16 - "Community 16"
Cohesion: 0.12
Nodes (6): CommandLineRunner, HealthSnapshotPublisher, HealthSyncController, HealthSyncResponse, KafkaDummyDataSeeder, VitalSyncApplication

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (9): onRefresh(), onSyncNow(), ensureHealthPermissions(), ensureInitialized(), getHealthConnectStatus(), getMissingHealthPermissions(), hasHealthPermissions(), buildSnapshotForWindow() (+1 more)

### Community 18 - "Community 18"
Cohesion: 0.23
Nodes (11): bloodOxygen(), clamp(), dailyStepsTarget(), diurnalStepWeight(), heartRateForWindow(), stepsForWindow(), UserSimulator, deterministicKey() (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (16): API Endpoints, Architecture, Authentication, code:block1 (Client → POST /api/v1/data/ingest → DataIngestionController ), code:json ({), code:json ({), code:bash (# Start Kafka first (e.g., via Docker)), code:block5 (src/main/java/com/vitalsync/) (+8 more)

### Community 20 - "Community 20"
Cohesion: 0.18
Nodes (5): handleThemeChange(), onSubmit(), parseOptionalNumber(), UserProfileService, UsersController

### Community 21 - "Community 21"
Cohesion: 0.15
Nodes (12): Build Notes, code:sh (clang-format -style=file -i \), code:sh (cmake-format -i \), code:markdown (Copyright 2019 Joe Drago. All rights reserved.), Development Notes, Formatting, libavif [![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/github/louquillio/libavif?branch=master&svg=true)](https://ci.appveyor.com/project/louquillio/libavif) [![Travis Build Status](https://travis-ci.com/AOMediaCodec/libavif.svg?branch=master)](https://travis-ci.com/AOMediaCodec/libavif), License (+4 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (11): Carthage, CocoaPods, code:block1 (github "SDWebImage/libdav1d-Xcode"), code:block2 (pod 'libdav1d'), Installation, libdav1d + Xcode, License, Note for architecture assembly optimization (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (9): buildSnapshotForWindow(), readActiveCalories(), readDistanceMeters(), readExerciseSessions(), readHeartRateAvg(), readHeartRateZoneMinutes(), readLatestSpO2(), readStepsSum() (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.29
Nodes (6): ApiError, buildUrl(), doFetch(), parseError(), refreshAccessToken(), request()

### Community 25 - "Community 25"
Cohesion: 0.2
Nodes (9): AuthResponse, AuthUserDto, ErrorResponse, ExerciseSession, HealthSnapshot, HealthSyncRequest, HealthSyncResponse, LoginRequest (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.2
Nodes (9): Build, code:bash (cd scripts/loadgen), code:bash (# Backend up + Postgres + Kafka), code:bash (docker exec -it vitalsync-kafka kafka-console-consumer \), Flags, loadgen — VitalSync HTTP synthetic load generator, Quick run, Realism model (+1 more)

### Community 27 - "Community 27"
Cohesion: 0.22
Nodes (8): Authorship, CoC, Codebase language, Commit logs, dav1d contribution guide, Patent license, Submit requests (WIP), ToDo

### Community 28 - "Community 28"
Cohesion: 0.25
Nodes (7): APIs, Bugs, Building, code:block1 (__   __  ____  ____  ____), Discuss, Encoding and Decoding Tools, WebP Codec

### Community 29 - "Community 29"
Cohesion: 0.33
Nodes (1): MainActivity

### Community 30 - "Community 30"
Cohesion: 0.53
Nodes (4): clamp(), recoveryScore(), sleepScore(), strainScore()

### Community 31 - "Community 31"
Cohesion: 0.4
Nodes (1): SecurityConfig

### Community 32 - "Community 32"
Cohesion: 0.33
Nodes (5): AOM, Companies, Individual, Projects, The dav1d project and VideoLAN association would like to thank

### Community 33 - "Community 33"
Cohesion: 0.33
Nodes (6): Android App Launcher Icon, Android Native Module, Expo File-Based Routing, Expo Frontend Application, VitalSync Project, App Splash Screen Logo - Concentric Circles Design

### Community 34 - "Community 34"
Cohesion: 0.5
Nodes (1): MainApplication

### Community 36 - "Community 36"
Cohesion: 0.5
Nodes (3): AnalyticsResponseDto, DataPoint, StatsSummary

### Community 37 - "Community 37"
Cohesion: 0.5
Nodes (1): KafkaConsumerConfig

### Community 38 - "Community 38"
Cohesion: 0.67
Nodes (1): KafkaProducerConfig

### Community 39 - "Community 39"
Cohesion: 0.5
Nodes (1): User

### Community 40 - "Community 40"
Cohesion: 0.5
Nodes (3): code:block1 (./scripts/setup.sh), graphify, Setup (fresh clone)

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (1): KafkaTopicConfig

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (1): JacksonConfig

### Community 45 - "Community 45"
Cohesion: 0.67
Nodes (1): OpenApiConfig

### Community 46 - "Community 46"
Cohesion: 0.67
Nodes (1): Analytics

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (1): LogoutRequest

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (1): GoogleLoginRequest

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (1): RefreshRequest

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (1): SignupRequest

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (1): AuthResponse

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (1): LoginRequest

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (1): AuthUserDto

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (1): HealthSnapshot

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (1): HealthSyncRequest

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (1): DailySummaryDto

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (1): HistoryResponseDto

### Community 63 - "Community 63"
Cohesion: 1.0
Nodes (1): ExerciseSession

### Community 64 - "Community 64"
Cohesion: 1.0
Nodes (1): UserProfileDto

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (1): UpdateProfileRequest

### Community 66 - "Community 66"
Cohesion: 1.0
Nodes (1): HealthSnapshotRecord

### Community 67 - "Community 67"
Cohesion: 1.0
Nodes (1): SeedProperties

### Community 68 - "Community 68"
Cohesion: 1.0
Nodes (1): VitalSync

### Community 84 - "Community 84"
Cohesion: 1.0
Nodes (1): Swagger UI

### Community 85 - "Community 85"
Cohesion: 1.0
Nodes (1): UserProfile

### Community 86 - "Community 86"
Cohesion: 1.0
Nodes (1): POST /api/v1/auth/logout

### Community 87 - "Community 87"
Cohesion: 1.0
Nodes (1): GET /api/v1/users/me

### Community 88 - "Community 88"
Cohesion: 1.0
Nodes (1): PATCH /api/v1/users/me

### Community 89 - "Community 89"
Cohesion: 1.0
Nodes (1): Android Icon (Monochrome)

## Knowledge Gaps
- **309 isolated node(s):** `LogoutRequest`, `GoogleLoginRequest`, `RefreshRequest`, `SignupRequest`, `AuthResponse` (+304 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 29`** (6 nodes): `MainActivity.kt`, `MainActivity`, `.createReactActivityDelegate()`, `.getMainComponentName()`, `.invokeDefaultOnBackPressed()`, `.onCreate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (6 nodes): `SecurityConfig.java`, `SecurityConfig`, `.corsConfigurationSource()`, `.passwordEncoder()`, `.SecurityConfig()`, `.securityFilterChain()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (4 nodes): `MainApplication.kt`, `MainApplication`, `.onConfigurationChanged()`, `.onCreate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (4 nodes): `KafkaConsumerConfig.java`, `KafkaConsumerConfig`, `.healthSyncConsumerFactory()`, `.kafkaListenerContainerFactory()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (4 nodes): `KafkaProducerConfig.java`, `KafkaProducerConfig`, `.kafkaTemplate()`, `.producerFactory()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (4 nodes): `User.java`, `User`, `.onInsert()`, `.onUpdate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (3 nodes): `KafkaTopicConfig.java`, `KafkaTopicConfig`, `.vitalSyncDataTopic()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (3 nodes): `JacksonConfig.java`, `JacksonConfig`, `.scalarToStringCoercion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (3 nodes): `OpenApiConfig.java`, `OpenApiConfig`, `.vitalSyncOpenAPI()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (3 nodes): `Analytics`, `.main()`, `Analytics.scala`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (2 nodes): `LogoutRequest.java`, `LogoutRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (2 nodes): `GoogleLoginRequest.java`, `GoogleLoginRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (2 nodes): `RefreshRequest.java`, `RefreshRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (2 nodes): `SignupRequest.java`, `SignupRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (2 nodes): `AuthResponse`, `AuthResponse.java`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (2 nodes): `LoginRequest.java`, `LoginRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (2 nodes): `AuthUserDto`, `AuthUserDto.java`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (2 nodes): `HealthSnapshot.java`, `HealthSnapshot`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (2 nodes): `HealthSyncRequest.java`, `HealthSyncRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (2 nodes): `DailySummaryDto.java`, `DailySummaryDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (2 nodes): `HistoryResponseDto.java`, `HistoryResponseDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (2 nodes): `ExerciseSession.java`, `ExerciseSession`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (2 nodes): `UserProfileDto.java`, `UserProfileDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (2 nodes): `UpdateProfileRequest.java`, `UpdateProfileRequest`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (2 nodes): `HealthSnapshotRecord.java`, `HealthSnapshotRecord`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (2 nodes): `SeedProperties.java`, `SeedProperties`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (2 nodes): `README.md`, `VitalSync`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (1 nodes): `Swagger UI`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (1 nodes): `UserProfile`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (1 nodes): `POST /api/v1/auth/logout`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 87`** (1 nodes): `GET /api/v1/users/me`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 88`** (1 nodes): `PATCH /api/v1/users/me`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 89`** (1 nodes): `Android Icon (Monochrome)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `onSubmit()` connect `Community 6` to `Community 4`, `Community 13`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `onSubmit()` connect `Community 6` to `Community 4`, `Community 13`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `LogoutRequest`, `GoogleLoginRequest`, `RefreshRequest` to the rest of the system?**
  _309 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._