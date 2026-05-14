package sim

import (
	"math"
	"math/rand"
)

// diurnalStepWeight returns the fraction of a day's steps that fall into the
// hour [hour, hour+1). Weights across 0..23 sum to 1.0.
//
// Curve shape (sleep, morning, midday, lunch, afternoon, evening peak, wind-down)
// is encoded as a piecewise-constant table for readability and predictability.
func diurnalStepWeight(hour int) float64 {
	switch {
	case hour < 6: // 00-06 sleep
		return 0.02 / 6.0
	case hour < 9: // 06-09 morning
		return 0.15 / 3.0
	case hour < 12: // 09-12 work morning
		return 0.18 / 3.0
	case hour < 14: // 12-14 lunch
		return 0.10 / 2.0
	case hour < 18: // 14-18 afternoon
		return 0.22 / 4.0
	case hour < 21: // 18-21 evening peak
		return 0.25 / 3.0
	default: // 21-24 wind-down
		return 0.08 / 3.0
	}
}

// stepsForWindow returns the number of steps a user accrues in a window of
// `windowMin` minutes that ends at hour `endHour` (0-23.999), given a daily
// target. Weight is the fraction of the day this window covers, scaled by the
// diurnal curve, multiplied by per-window jitter in [0.85, 1.15].
func stepsForWindow(rng *rand.Rand, dailyTarget float64, endHourFrac float64, windowMin int) int64 {
	// Use the hour in which the window starts so weights are stable across
	// midnight-spanning windows. windowFracOfHour caps how much weight the
	// window can claim from that hour.
	startHourFrac := endHourFrac - float64(windowMin)/60.0
	if startHourFrac < 0 {
		startHourFrac = 0
	}
	hour := int(math.Floor(startHourFrac))
	if hour < 0 {
		hour = 0
	}
	if hour > 23 {
		hour = 23
	}

	weight := diurnalStepWeight(hour)
	windowFracOfHour := float64(windowMin) / 60.0
	jitter := 0.85 + rng.Float64()*0.30 // [0.85, 1.15]

	steps := dailyTarget * weight * windowFracOfHour * jitter
	if steps < 0 {
		return 0
	}
	return int64(math.Round(steps))
}

// heartRateForWindow models a smooth diurnal HR curve plus exercise boost,
// clamped to [80, 150] per the user's strict-band requirement.
func heartRateForWindow(rng *rand.Rand, restingHR float64, endHourFrac float64, inExercise bool) float64 {
	// Sinusoid peaks at hour 18 (afternoon/evening), troughs near hour 6.
	diurnal := 12.0 * math.Sin((endHourFrac-6.0)/24.0*2.0*math.Pi)
	jitter := rng.NormFloat64() * 4.0 // sigma=4
	exerciseBoost := 0.0
	if inExercise {
		exerciseBoost = 45.0
	}
	hr := restingHR + diurnal + exerciseBoost + jitter
	return clamp(hr, 80.0, 150.0)
}

// bloodOxygen returns a SpO2 reading hovering around 97%, clamped 94-100.
func bloodOxygen(rng *rand.Rand) float64 {
	v := 97.0 + rng.NormFloat64()*0.6
	return clamp(v, 94.0, 100.0)
}

// dailyStepsTarget samples a daily total, clamped to a sensible floor.
func dailyStepsTarget(rng *rand.Rand, mean, std float64) float64 {
	v := mean + rng.NormFloat64()*std
	if v < 500 {
		v = 500
	}
	return v
}

func clamp(v, lo, hi float64) float64 {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}
