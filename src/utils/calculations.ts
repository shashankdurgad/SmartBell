// Weight conversion utilities
export function lbsToKg(lbs: number): number {
  return Math.round(lbs / 2.20462 * 100) / 100;
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 100) / 100;
}

// Epley Formula
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

// Brzycki Formula
export function calculate1RMBrzycki(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps >= 37) return 0; // Invalid: would cause division by zero
  return Math.round(weight * (36 / (37 - reps)));
}

// Average of both for better accuracy
export function estimatedMax(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps >= 37) return 0; // Brzycki formula becomes invalid at 37+ reps
  const epley = calculate1RM(weight, reps);
  const brzycki = calculate1RMBrzycki(weight, reps);
  return Math.round((epley + brzycki) / 2);
}

export function calculateSetVolume(weight: number, reps: number): number {
  return weight * reps;
}

export function roundToIncrement(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const SET_DURATION_BY_STYLE: Record<string, number> = {
  strength: 40,
  hypertrophy: 60,
  endurance: 60,
};

export function calcWorkoutDuration(
  exercises: Array<{ sets: number }>,
  trainingStyle: string,
  defaultRestSeconds: number
): number {
  const setDuration = SET_DURATION_BY_STYLE[trainingStyle] ?? 60;
  const totalSeconds = exercises.reduce(
    (sum, ex) => sum + ex.sets * (setDuration + defaultRestSeconds),
    0
  );
  return Math.max(1, Math.round(totalSeconds / 60));
}
