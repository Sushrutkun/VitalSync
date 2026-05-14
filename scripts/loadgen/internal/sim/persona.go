package sim

type PersonaKind int

const (
	Sedentary PersonaKind = iota
	Active
	Athlete
)

type Persona struct {
	Kind            PersonaKind
	Name            string
	DailyStepsMean  float64
	DailyStepsStd   float64
	RestingHR       float64 // bumped above true resting so 80-floor clamp is rarely hit
	HasMorningEx    bool
	ExerciseType    string // "RUNNING" | "WALKING"
	ExerciseStartHr float64
	ExerciseDurMin  int
}

var personas = []Persona{
	{
		Kind:           Sedentary,
		Name:           "sedentary",
		DailyStepsMean: 3000,
		DailyStepsStd:  800,
		RestingHR:      95,
		HasMorningEx:   false,
	},
	{
		Kind:            Active,
		Name:            "active",
		DailyStepsMean:  9000,
		DailyStepsStd:   1500,
		RestingHR:       88,
		HasMorningEx:    true,
		ExerciseType:    "WALKING",
		ExerciseStartHr: 7.0,
		ExerciseDurMin:  30,
	},
	{
		Kind:            Athlete,
		Name:            "athlete",
		DailyStepsMean:  15000,
		DailyStepsStd:   2500,
		RestingHR:       82,
		HasMorningEx:    true,
		ExerciseType:    "RUNNING",
		ExerciseStartHr: 6.5,
		ExerciseDurMin:  45,
	},
}

func PersonaForUser(userIndex int) Persona {
	return personas[userIndex%len(personas)]
}
