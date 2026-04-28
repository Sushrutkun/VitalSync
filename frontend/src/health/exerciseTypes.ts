// Map a subset of Health Connect ExerciseType codes to canonical names.
// Codes that aren't in the map are returned as "OTHER".
const EXERCISE_TYPE_NAMES: Record<number, string> = {
  0: "OTHER",
  2: "BADMINTON",
  4: "BASEBALL",
  5: "BASKETBALL",
  8: "BIKING",
  9: "BIKING_STATIONARY",
  13: "BOXING",
  16: "CALISTHENICS",
  25: "ELLIPTICAL",
  44: "HIKING",
  56: "PILATES",
  60: "ROWING",
  61: "ROWING_MACHINE",
  63: "RUNNING",
  64: "RUNNING_TREADMILL",
  68: "SKIING",
  74: "STAIR_CLIMBING",
  76: "STRENGTH_TRAINING",
  77: "STRETCHING",
  79: "SWIMMING_OPEN_WATER",
  80: "SWIMMING_POOL",
  82: "TENNIS",
  84: "WALKING",
  86: "WEIGHTLIFTING",
  88: "YOGA",
};

export function exerciseTypeName(code: number): string {
  return EXERCISE_TYPE_NAMES[code] ?? "OTHER";
}
