import { useEffect, useState } from 'react';
import { db } from '../database/db';
import { 
  calculatePercentile, 
  calculateAllMuscleGroupPercentiles,
  type Gender 
} from '../engine/percentileCalculator';
import type { MuscleGroup } from '../types/exercise.types';
import type { PersonalRecord } from '../types/workout.types';

export function useMuscleGroupPercentiles(userId?: string) {
  const [muscleGroupPercentiles, setMuscleGroupPercentiles] = useState<
    Record<MuscleGroup, number | null> | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPercentiles = async () => {
      try {
        setIsLoading(true);

        // Get user preferences to get gender
        const userPrefs = await db.userPreferences.get('default');
        if (!userPrefs) {
          setError('User preferences not found');
          setIsLoading(false);
          return;
        }

        // For now, assume default male/female - you may want to add gender to userPreferences
        const gender: Gender = 'male'; // TODO: Get from userPreferences

        // Get all personal records
        const records = await db.personalRecords.toArray();

        // Filter for estimated_1rm records and get unique exercises
        const exerciseMap = new Map<string, number>();
        const exerciseIdToName = new Map<string, string>();

        for (const record of records) {
          if (record.type === 'estimated_1rm') {
            // Get the highest estimated 1RM for each exercise
            const current = exerciseMap.get(record.exerciseId);
            if (!current || record.value > current) {
              exerciseMap.set(record.exerciseId, record.value);
            }
          }
        }

        // Get exercise names from database
        const exerciseIds = Array.from(exerciseMap.keys());
        if (exerciseIds.length > 0) {
          const exercises = await db.exercises
            .where('id')
            .anyOf(exerciseIds)
            .toArray();

          for (const exercise of exercises) {
            exerciseIdToName.set(exercise.id, exercise.name);
          }
        }

        // Build stats object for percentile calculation
        const userStats: {
          gender: Gender;
          [exerciseName: string]: number | Gender;
        } = { gender };

        for (const [exerciseId, oneRM] of exerciseMap.entries()) {
          const exerciseName = exerciseIdToName.get(exerciseId);
          if (exerciseName) {
            userStats[exerciseName] = oneRM;
          }
        }

        // Calculate muscle group percentiles
        // Map database exercise names to strength standard names if they match
        const exercisePercentiles: Record<string, number | null> = {};

        // Standard exercise names from CSV that we have strength data for
        const standardExercises = [
          'Bench Press - Powerlifting',
          'Barbell Full Squat',
          'Barbell Deadlift',
          'Barbell Shoulder Press',
          'Dumbell Bench Press',
          'Seated Dumbell Curl',
          'Barbell Curl',
          'Full Range-Of-Motion Lat Pulldown',
          'Front Squat (Clean Grip)',
          'Triceps Pushdown',
          'Decline EZ Bar Tricep Extension',
          'Seated Cable Rows',
          'Bent Over Barbell Row',
        ];

        for (const standardExercise of standardExercises) {
          if (standardExercise in userStats && typeof userStats[standardExercise] === 'number') {
            const oneRM = userStats[standardExercise] as number;
            const percentile = calculatePercentile(oneRM, gender, standardExercise as any);
            exercisePercentiles[standardExercise] = percentile;
          }
        }

        // Calculate muscle group percentiles
        const muscleGroupResult = calculateAllMuscleGroupPercentiles(exercisePercentiles);
        setMuscleGroupPercentiles(muscleGroupResult);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to calculate percentiles');
        setMuscleGroupPercentiles(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadPercentiles();
  }, [userId]);

  return { muscleGroupPercentiles, isLoading, error };
}

/**
 * Utility hook to get exercise percentiles for a specific set of exercises
 * Useful if you already have the exercise data and 1RMs
 */
export function useExercisePercentiles(
  exerciseStats: Record<string, number>,
  gender: Gender = 'male'
) {
  const exercisePercentiles: Record<string, number | null> = {};

  const standardExercises = [
    'Bench Press - Powerlifting',
    'Barbell Full Squat',
    'Barbell Deadlift',
    'Barbell Shoulder Press',
    'Dumbell Bench Press',
    'Seated Dumbell Curl',
    'Barbell Curl',
    'Full Range-Of-Motion Lat Pulldown',
    'Front Squat (Clean Grip)',
    'Triceps Pushdown',
    'Decline EZ Bar Tricep Extension',
    'Seated Cable Rows',
    'Bent Over Barbell Row',
  ];

  for (const exercise of standardExercises) {
    if (exercise in exerciseStats) {
      const oneRM = exerciseStats[exercise];
      const percentile = calculatePercentile(oneRM, gender, exercise as any);
      exercisePercentiles[exercise] = percentile;
    }
  }

  const muscleGroupPercentiles = calculateAllMuscleGroupPercentiles(exercisePercentiles);

  return {
    exercisePercentiles,
    muscleGroupPercentiles,
  };
}
