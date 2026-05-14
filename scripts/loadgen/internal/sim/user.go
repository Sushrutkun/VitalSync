package sim

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/rand"
	"strconv"
	"time"

	"github.com/vitalsync/loadgen/internal/api"
)

// stridePerStepM is an average adult stride length in meters; used to derive
// distance from step counts so the two metrics stay coherent.
const stridePerStepM = 0.762

// kcalPerStep is a coarse energy-per-step constant that keeps active calories
// proportional to step delta without needing height/weight data.
const kcalPerStep = 0.04

// UserSimulator holds per-user state so step counters reset cleanly at midnight
// and exercise sessions stay tied to that user's persona.
type UserSimulator struct {
	UserID   string
	Email    string
	Password string
	Name     string
	Persona  Persona

	rng *rand.Rand

	currentDay   time.Time // truncated to UTC midnight
	dailyTarget  float64
	stepsToday   int64
}

// NewUserSimulator builds a simulator with a deterministic seed derived from
// the user index so repeated runs produce comparable distributions.
func NewUserSimulator(userIndex int) *UserSimulator {
	persona := PersonaForUser(userIndex)
	seed := int64(userIndex+1) * 1_000_003
	return &UserSimulator{
		UserID:   "", // filled after auth
		Email:    fmt.Sprintf("loadtest-user-%d@vitalsync.dev", userIndex+1),
		Password: "LoadTest!Pass123",
		Name:     fmt.Sprintf("Loadtest User %d", userIndex+1),
		Persona:  persona,
		rng:      rand.New(rand.NewSource(seed)),
	}
}

// NextSnapshot advances the simulator to a window ending at periodEnd and
// returns the corresponding HealthSyncRequest. Caller must invoke this in
// strict time order (window N+1 has periodEnd > window N's periodEnd).
func (u *UserSimulator) NextSnapshot(periodStart, periodEnd time.Time) api.HealthSyncRequest {
	u.maybeRollDay(periodEnd)

	endUTC := periodEnd.UTC()
	endHourFrac := float64(endUTC.Hour()) + float64(endUTC.Minute())/60.0
	windowMin := int(periodEnd.Sub(periodStart).Minutes())
	if windowMin <= 0 {
		windowMin = 1
	}

	stepsDelta := stepsForWindow(u.rng, u.dailyTarget, endHourFrac, windowMin)
	u.stepsToday += stepsDelta
	stepsTotal := u.stepsToday

	inExercise := u.windowOverlapsExercise(periodStart, periodEnd)
	hr := heartRateForWindow(u.rng, u.Persona.RestingHR, endHourFrac, inExercise)
	spo2 := bloodOxygen(u.rng)

	distance := float64(stepsDelta) * stridePerStepM
	calories := float64(stepsDelta) * kcalPerStep
	if inExercise {
		calories += 4.0 * float64(windowMin) // ~4 kcal/min on top during exercise
	}

	hrZoneMin := int64(0)
	if inExercise {
		hrZoneMin = int64(windowMin)
	}

	var sessions []api.ExerciseSession
	if inExercise {
		sessions = []api.ExerciseSession{u.exerciseSessionFor(periodStart, periodEnd, hr)}
	}

	snapshot := api.HealthSnapshot{
		Timestamp:            periodEnd,
		PeriodStart:          periodStart,
		PeriodEnd:            periodEnd,
		HeartRateBpm:         ptrF(round1(hr)),
		StepsTotal:           ptrI(stepsTotal),
		StepsDelta:           ptrI(stepsDelta),
		BloodOxygenPct:       ptrF(round1(spo2)),
		ActiveCaloriesKcal:   ptrF(round1(calories)),
		DistanceMeters:       ptrF(round1(distance)),
		HeartRateZoneMinutes: ptrI(hrZoneMin),
		ExerciseSessions:     sessions,
	}

	uid := u.UserID
	if uid == "" {
		uid = u.Email
	}

	return api.HealthSyncRequest{
		UserID:         uid,
		IdempotencyKey: deterministicKey(uid, periodEnd),
		PeriodStart:    periodStart,
		PeriodEnd:      periodEnd,
		Snapshot:       snapshot,
	}
}

func (u *UserSimulator) maybeRollDay(periodEnd time.Time) {
	day := time.Date(periodEnd.UTC().Year(), periodEnd.UTC().Month(), periodEnd.UTC().Day(), 0, 0, 0, 0, time.UTC)
	if !day.Equal(u.currentDay) {
		u.currentDay = day
		u.dailyTarget = dailyStepsTarget(u.rng, u.Persona.DailyStepsMean, u.Persona.DailyStepsStd)
		u.stepsToday = 0
	}
}

func (u *UserSimulator) windowOverlapsExercise(periodStart, periodEnd time.Time) bool {
	if !u.Persona.HasMorningEx {
		return false
	}
	day := time.Date(periodEnd.UTC().Year(), periodEnd.UTC().Month(), periodEnd.UTC().Day(), 0, 0, 0, 0, time.UTC)
	startHr := int(u.Persona.ExerciseStartHr)
	startMin := int((u.Persona.ExerciseStartHr - float64(startHr)) * 60.0)
	exStart := day.Add(time.Duration(startHr)*time.Hour + time.Duration(startMin)*time.Minute)
	exEnd := exStart.Add(time.Duration(u.Persona.ExerciseDurMin) * time.Minute)
	return periodStart.Before(exEnd) && periodEnd.After(exStart)
}

func (u *UserSimulator) exerciseSessionFor(periodStart, periodEnd time.Time, hr float64) api.ExerciseSession {
	durMin := int(periodEnd.Sub(periodStart).Minutes())
	if durMin < 1 {
		durMin = 1
	}
	cal := 9.0 * float64(durMin)
	dist := float64(durMin) * 150.0 // ~150 m/min ~ 9 km/h pace; persona-agnostic upper-bound estimate
	if u.Persona.ExerciseType == "WALKING" {
		dist = float64(durMin) * 80.0
		cal = 5.0 * float64(durMin)
	}
	return api.ExerciseSession{
		Type:            u.Persona.ExerciseType,
		StartTime:       periodStart,
		EndTime:         periodEnd,
		DurationMinutes: durMin,
		Calories:        ptrF(round1(cal)),
		DistanceMeters:  ptrF(round1(dist)),
		AvgHeartRateBpm: ptrF(round1(hr)),
	}
}

func deterministicKey(userID string, periodEnd time.Time) string {
	h := sha256.Sum256([]byte(userID + "|" + strconv.FormatInt(periodEnd.UnixNano(), 10)))
	return hex.EncodeToString(h[:8]) // 16 hex chars
}

func ptrF(v float64) *float64 { return &v }
func ptrI(v int64) *int64     { return &v }

func round1(v float64) float64 {
	return float64(int64(v*10+0.5)) / 10.0
}
