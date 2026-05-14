package api

import "time"

type SignupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthUserDto struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

type AuthResponse struct {
	AccessToken  string      `json:"accessToken"`
	RefreshToken string      `json:"refreshToken"`
	ExpiresIn    int64       `json:"expiresIn"`
	User         AuthUserDto `json:"user"`
}

type ExerciseSession struct {
	Type            string    `json:"type"`
	StartTime       time.Time `json:"startTime"`
	EndTime         time.Time `json:"endTime"`
	DurationMinutes int       `json:"durationMinutes"`
	Calories        *float64  `json:"calories,omitempty"`
	DistanceMeters  *float64  `json:"distanceMeters,omitempty"`
	AvgHeartRateBpm *float64  `json:"avgHeartRateBpm,omitempty"`
}

type HealthSnapshot struct {
	Timestamp            time.Time         `json:"timestamp"`
	PeriodStart          time.Time         `json:"periodStart"`
	PeriodEnd            time.Time         `json:"periodEnd"`
	HeartRateBpm         *float64          `json:"heartRateBpm,omitempty"`
	StepsTotal           *int64            `json:"stepsTotal,omitempty"`
	StepsDelta           *int64            `json:"stepsDelta,omitempty"`
	BloodOxygenPct       *float64          `json:"bloodOxygenPct,omitempty"`
	ActiveCaloriesKcal   *float64          `json:"activeCaloriesKcal,omitempty"`
	DistanceMeters       *float64          `json:"distanceMeters,omitempty"`
	HeartRateZoneMinutes *int64            `json:"heartRateZoneMinutes,omitempty"`
	ExerciseSessions     []ExerciseSession `json:"exerciseSessions,omitempty"`
}

type HealthSyncRequest struct {
	UserID         string         `json:"userId"`
	IdempotencyKey string         `json:"idempotencyKey"`
	PeriodStart    time.Time      `json:"periodStart"`
	PeriodEnd      time.Time      `json:"periodEnd"`
	Snapshot       HealthSnapshot `json:"snapshot"`
}

type HealthSyncResponse struct {
	Success        bool      `json:"success"`
	Message        string    `json:"message"`
	IdempotencyKey string    `json:"idempotencyKey"`
	Timestamp      time.Time `json:"timestamp"`
	Errors         []string  `json:"errors"`
}

type ErrorResponse struct {
	Status    int    `json:"status"`
	Error     string `json:"error"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
}
