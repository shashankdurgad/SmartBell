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
