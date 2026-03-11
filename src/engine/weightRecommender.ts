import { workoutRepo } from '../database/repositories/workoutRepo';
import { estimatedMax, roundToIncrement, kgToLbs, lbsToKg } from '../utils/calculations';
import type { WeightRecommendation } from '../types';

const INCREASE_THRESHOLD_RPE = 7;
const COMPLETION_THRESHOLD = 0.75;
const DELOAD_MULTIPLIER = 0.9;
const INCREASE_MULTIPLIER_KG = 1.25;  // Database stores in kg

interface LastSetData {
  weight: number;  // Always in kg (from database)
  completedReps: number;
  targetReps: number;
  rpe: number;
}

function getLastSetData(
  sessions: Awaited<ReturnType<typeof workoutRepo.getByExerciseId>>,
  exerciseId: string
): LastSetData | null {
  if (sessions.length === 0) return null;

  const lastSession = sessions[0];
  const exercise = lastSession.exercises.find((e) => e.exerciseId === exerciseId);
  if (!exercise || exercise.sets.length === 0) return null;

  const workingSets = exercise.sets.filter((s) => !s.isWarmup);
  if (workingSets.length === 0) return null;

  const lastSet = workingSets[workingSets.length - 1];
  return {
    weight: lastSet.weight,  // Already in kg from database
    completedReps: lastSet.completedReps,
    targetReps: lastSet.targetReps,
    rpe: lastSet.rpe,
  };
}

function detectTrend(
  sessions: Awaited<ReturnType<typeof workoutRepo.getByExerciseId>>,
  exerciseId: string
): 'improving' | 'declining' | 'stable' {
  if (sessions.length < 3) return 'stable';

  const recentSessions = sessions.slice(0, 3);
  const weights = recentSessions.map((session) => {
    const exercise = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!exercise) return 0;
    const workingSets = exercise.sets.filter((s) => !s.isWarmup);
    if (workingSets.length === 0) return 0;
    return Math.max(...workingSets.map((s) => estimatedMax(s.weight, s.completedReps)));
  });

  const [latest, middle, oldest] = weights;
  if (latest > middle && middle > oldest) return 'improving';
  if (latest < middle && middle < oldest) return 'declining';
  return 'stable';
}

export async function getWeightRecommendation(
  exerciseId: string,
  unit: 'lbs' | 'kg' = 'kg'
): Promise<WeightRecommendation> {
  const sessions = await workoutRepo.getByExerciseId(exerciseId);

  // First time doing this exercise
  if (sessions.length === 0) {
    return {
      recommendedWeight: null,
      reasoning: 'first_time',
      confidence: 'low',
      message: 'First time doing this exercise — start light and focus on form.',
    };
  }

  const lastData = getLastSetData(sessions, exerciseId);

  // no usable set data
  if (!lastData) {
    return {
      recommendedWeight: null,
      reasoning: 'returning',
      confidence: 'low',
      message: 'No previous set data found — start at a comfortable weight.',
    };
  }

  const trend = detectTrend(sessions, exerciseId);
  const increment = INCREASE_MULTIPLIER_KG;  // Always use kg increment
  const completionRate = lastData.targetReps > 0
    ? lastData.completedReps / lastData.targetReps
    : 1;

  // Helper to convert weight for display
  const convertForDisplay = (weightKg: number): number => {
    return unit === 'lbs' ? kgToLbs(weightKg) : weightKg;
  };

  // Deload — declining trend
  if (trend === 'declining') {
    const deloadWeight = roundToIncrement(lastData.weight * DELOAD_MULTIPLIER, increment);
    const displayWeight = convertForDisplay(deloadWeight);
    return {
      recommendedWeight: displayWeight,
      reasoning: 'deload_fatigue',
      confidence: 'medium',
      alternativeWeight: convertForDisplay(lastData.weight),
      message: `Performance has been declining — try ${displayWeight}${unit} to reset and recover.`,
    };
  }

  // Decrease — couldn't complete reps
  if (completionRate < COMPLETION_THRESHOLD) {
    const decreasedWeight = roundToIncrement(lastData.weight - increment * 2, increment);
    const displayWeight = convertForDisplay(decreasedWeight);
    return {
      recommendedWeight: displayWeight,
      reasoning: 'decrease_recovery',
      confidence: 'high',
      alternativeWeight: convertForDisplay(lastData.weight),
      message: `You completed ${Math.round(completionRate * 100)}% of reps last time — drop to ${displayWeight}${unit}.`,
    };
  }

  // Increase — (low RPE) and completed all reps
  if (lastData.rpe <= INCREASE_THRESHOLD_RPE && completionRate >= 1) {
    const increasedWeight = roundToIncrement(lastData.weight + increment, increment);
    const displayWeight = convertForDisplay(increasedWeight);
    return {
      recommendedWeight: displayWeight,
      reasoning: 'increase_progression',
      confidence: 'high',
      alternativeWeight: convertForDisplay(lastData.weight),
      message: `Great work last time (RPE ${lastData.rpe}) — try ${displayWeight}${unit} today.`,
    };
  }

  // Maintain 
  const displayWeight = convertForDisplay(lastData.weight);
  return {
    recommendedWeight: displayWeight,
    reasoning: 'maintain_consolidate',
    confidence: 'high',
    message: `Stay at ${displayWeight}${unit} and aim to improve reps or RPE.`,
  };
}