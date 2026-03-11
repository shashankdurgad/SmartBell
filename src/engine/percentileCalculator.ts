/**
 * Percentile Calculator
 * Calculates user's strength percentile for exercises based on 1RM estimates
 * Data source: Strength standards from CSV (all values in kilograms)
 */

import type { MuscleGroup } from '../types/exercise.types';

export type Gender = 'male' | 'female';

// Strength standards by exercise, gender, and percentile
// All weights in kilograms
const STRENGTH_STANDARDS = {
  'Bench Press - Powerlifting': {
    male: { 5: 47, 20: 70, 50: 98, 80: 132, 95: 169 },
    female: { 5: 17, 20: 31, 50: 51, 80: 74, 95: 101 },
  },
  'Barbell Full Squat': {
    male: { 5: 64, 20: 93, 50: 130, 80: 173, 95: 219 },
    female: { 5: 30, 20: 48, 50: 73, 80: 103, 95: 136 },
  },
  'Barbell Deadlift': {
    male: { 5: 78, 20: 112, 50: 152, 80: 200, 95: 250 },
    female: { 5: 38, 20: 60, 50: 87, 80: 120, 95: 157 },
  },
  'Barbell Shoulder Press': {
    male: { 5: 30, 20: 45, 50: 64, 80: 87, 95: 112 },
    female: { 5: 13, 20: 22, 50: 34, 80: 48, 95: 65 },
  },
  'Dumbell Bench Press': {
    male: { 5: 16, 20: 27, 50: 41, 80: 58, 95: 78 },
    female: { 5: 6, 20: 12, 50: 21, 80: 32, 95: 46 },
  },
  'Seated Dumbell Curl': {
    male: { 5: 6, 20: 13, 50: 23, 80: 36, 95: 51 },
    female: { 5: 3, 20: 8, 50: 14, 80: 21, 95: 31 },
  },
  'Barbell Curl': {
    male: { 5: 17, 20: 30, 50: 47, 80: 68, 95: 91 },
    female: { 5: 6, 20: 14, 50: 25, 80: 39, 95: 55 },
  },
  'Full Range-Of-Motion Lat Pulldown': {
    male: { 5: 38, 20: 58, 50: 82, 80: 110, 95: 141 },
    female: { 5: 19, 20: 31, 50: 46, 80: 64, 95: 83 },
  },
  'Front Squat (Clean Grip)': {
    male: { 5: 55, 20: 77, 50: 105, 80: 137, 95: 172 },
    female: { 5: 30, 20: 45, 50: 62, 80: 83, 95: 105 },
  },
  'Triceps Pushdown': {
    male: { 5: 17, 20: 34, 50: 57, 80: 86, 95: 119 },
    female: { 5: 8, 20: 18, 50: 31, 80: 49, 95: 69 },
  },
  'Decline EZ Bar Tricep Extension': {
    male: { 5: 15, 20: 27, 50: 43, 80: 63, 95: 86 },
    female: { 5: 6, 20: 13, 50: 22, 80: 34, 95: 48 },
  },
  'Seated Cable Rows': {
    male: { 5: 41, 20: 61, 50: 86, 80: 115, 95: 147 },
    female: { 5: 20, 20: 32, 50: 47, 80: 66, 95: 86 },
  },
  'Bent Over Barbell Row': {
    male: { 5: 41, 20: 60, 50: 85, 80: 115, 95: 147 },
    female: { 5: 15, 20: 26, 50: 41, 80: 59, 95: 79 },
  },
};

export type ExerciseName = keyof typeof STRENGTH_STANDARDS;

/**
 * Determines which percentile bracket a 1RM falls into
 * Interpolates linearly between percentile tiers
 * @param oneRM - User's estimated 1 rep max in kg
 * @param gender - User's gender ('male' or 'female')
 * @param exercise - Exercise name
 * @returns Percentile (0-100) or null if exercise not found
 */
export function calculatePercentile(
  oneRM: number,
  gender: Gender,
  exercise: ExerciseName
): number | null {
  const standards = STRENGTH_STANDARDS[exercise];
  if (!standards) return null;

  const genderStandards = standards[gender];
  if (!genderStandards) return null;

  const percentiles = [5, 20, 50, 80, 95] as const;

  // If below 5th percentile
  if (oneRM <= genderStandards[5]) {
    return Math.max(0, (oneRM / genderStandards[5]) * 5);
  }

  // If above 95th percentile
  if (oneRM >= genderStandards[95]) {
    return Math.min(100, 95 + ((oneRM - genderStandards[95]) / genderStandards[95]) * 5);
  }

  // Interpolate between percentile tiers
  for (let i = 0; i < percentiles.length - 1; i++) {
    const lowerPercentile = percentiles[i];
    const upperPercentile = percentiles[i + 1];
    const lowerWeight = genderStandards[lowerPercentile];
    const upperWeight = genderStandards[upperPercentile];

    if (oneRM >= lowerWeight && oneRM <= upperWeight) {
      const range = upperWeight - lowerWeight;
      const progress = oneRM - lowerWeight;
      const percentileRange = upperPercentile - lowerPercentile;

      return lowerPercentile + (progress / range) * percentileRange;
    }
  }

  return null;
}

/**
 * Calculates percentiles for multiple exercises at once
 * @param userStats - Object with gender and 1RMs for each exercise
 * @returns Object mapping exercise names to percentiles
 */
export function calculateMultiplePercentiles(
  userStats: {
    gender: Gender;
    [exerciseName: string]: number | Gender;
  }
): Record<string, number | null> {
  const { gender, ...lifts } = userStats;

  const results: Record<string, number | null> = {};

  for (const [exercise, oneRM] of Object.entries(lifts)) {
    if (typeof oneRM === 'number') {
      results[exercise] = calculatePercentile(oneRM, gender as Gender, exercise as ExerciseName);
    }
  }

  return results;
}

/**
 * Gets the list of all available exercises
 */
export function getAvailableExercises(): ExerciseName[] {
  return Object.keys(STRENGTH_STANDARDS) as ExerciseName[];
}

/**
 * Gets the strength standard for a specific exercise and percentile
 * @param exercise - Exercise name
 * @param gender - User's gender
 * @param percentile - Target percentile (5, 20, 50, 80, or 95)
 * @returns Weight in kg or null if not found
 */
export function getStrengthStandard(
  exercise: ExerciseName,
  gender: Gender,
  percentile: 5 | 20 | 50 | 80 | 95
): number | null {
  const standard = STRENGTH_STANDARDS[exercise]?.[gender]?.[percentile];
  return standard ?? null;
}

// Map strength standard exercises to primary muscle groups
const EXERCISE_TO_MUSCLE_GROUPS: Record<ExerciseName, MuscleGroup[]> = {
  'Bench Press - Powerlifting': ['chest', 'triceps', 'shoulders'],
  'Barbell Full Squat': ['quadriceps', 'glutes', 'hamstrings', 'lower back'],
  'Barbell Deadlift': ['glutes', 'hamstrings', 'lower back', 'traps', 'forearms'],
  'Barbell Shoulder Press': ['shoulders', 'triceps', 'chest'],
  'Dumbell Bench Press': ['chest', 'triceps', 'shoulders'],
  'Seated Dumbell Curl': ['biceps', 'forearms'],
  'Barbell Curl': ['biceps', 'forearms'],
  'Full Range-Of-Motion Lat Pulldown': ['lats', 'biceps', 'middle back'],
  'Front Squat (Clean Grip)': ['quadriceps', 'glutes', 'abdominals', 'lower back'],
  'Triceps Pushdown': ['triceps', 'forearms'],
  'Decline EZ Bar Tricep Extension': ['triceps'],
  'Seated Cable Rows': ['middle back', 'lats', 'biceps', 'forearms'],
  'Bent Over Barbell Row': ['middle back', 'lats', 'biceps', 'lower back'],
};

/**
 * Calculates average percentile for a muscle group based on exercises that target it
 * @param exercisePercentiles - Map of exercise names to percentiles
 * @param muscleGroup - Target muscle group
 * @returns Average percentile for the muscle group, or null if no data available
 */
export function calculateMuscleGroupPercentile(
  exercisePercentiles: Record<string, number | null>,
  muscleGroup: MuscleGroup
): number | null {
  const relevantPercentiles: number[] = [];

  for (const [exercise, percentile] of Object.entries(exercisePercentiles)) {
    if (percentile !== null) {
      const muscleGroups = EXERCISE_TO_MUSCLE_GROUPS[exercise as ExerciseName];
      if (muscleGroups && muscleGroups.includes(muscleGroup)) {
        relevantPercentiles.push(percentile);
      }
    }
  }

  if (relevantPercentiles.length === 0) return null;

  const sum = relevantPercentiles.reduce((a, b) => a + b, 0);
  return sum / relevantPercentiles.length;
}

/**
 * Calculates muscle group percentiles from individual exercise percentiles
 * @param exercisePercentiles - Map of exercise names to percentiles
 * @returns Record mapping muscle groups to average percentiles
 */
export function calculateAllMuscleGroupPercentiles(
  exercisePercentiles: Record<string, number | null>
): Record<MuscleGroup, number | null> {
  const muscleGroups: MuscleGroup[] = [
    'abdominals', 'abductors', 'adductors', 'biceps', 'calves', 'chest',
    'forearms', 'glutes', 'hamstrings', 'lats', 'lower back', 'middle back',
    'neck', 'quadriceps', 'shoulders', 'traps', 'triceps',
  ];

  const result: Record<MuscleGroup, number | null> = {} as Record<MuscleGroup, number | null>;

  for (const muscleGroup of muscleGroups) {
    result[muscleGroup] = calculateMuscleGroupPercentile(exercisePercentiles, muscleGroup);
  }

  return result;
}

/**
 * Complete workflow: Takes user's exercise 1RMs and returns muscle group percentiles
 * @param userStats - Object with gender and 1RMs for strength standard exercises
 * @returns Record mapping muscle groups to average percentiles
 */
export function calculateUserMuscleGroupStrength(
  userStats: {
    gender: Gender;
    [exerciseName: string]: number | Gender;
  }
): Record<MuscleGroup, number | null> {
  // Calculate exercise percentiles
  const exercisePercentiles = calculateMultiplePercentiles(userStats);

  // Convert to muscle group percentiles
  return calculateAllMuscleGroupPercentiles(exercisePercentiles);
}
