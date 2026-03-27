import { workoutRepo } from '../database/repositories/workoutRepo';
import { estimatedMax, roundToIncrement, kgToLbs } from '../utils/calculations';
import type { WeightRecommendation } from '../types';

const COMPLETION_THRESHOLD = 0.75;
const DELOAD_MULTIPLIER = 0.8;
const INCREASE_MULTIPLIER_KG = 1.25;
const DECAY = 0.85;

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

  // sessions may not be sorted — take the most recent by date
  const lastSession = sessions.reduce((latest, s) =>
    new Date(s.date) > new Date(latest.date) ? s : latest
  );
  const exercise = lastSession.exercises.find((e) => e.exerciseId === exerciseId);
  if (!exercise || exercise.sets.length === 0) return null;

  const workingSets = exercise.sets.filter((s) => !s.isWarmup);
  if (workingSets.length === 0) return null;

  const lastSet = workingSets[workingSets.length - 1];
  return {
    weight: lastSet.weight,
    completedReps: lastSet.completedReps,
    targetReps: lastSet.targetReps,
    rpe: lastSet.rpe,
  };
}

// Inverse of estimatedMax (avg of Epley + Brzycki) for a given rep count
function workingWeightFromE1RM(e1rm: number, reps: number): number {
  if (reps <= 0) return e1rm;
  const epleyInverse = e1rm / (1 + reps / 30);
  const brzyckiInverse = e1rm * (37 - reps) / 36;
  return (epleyInverse + brzyckiInverse) / 2;
}

function getSessionE1RMs(
  sessions: Awaited<ReturnType<typeof workoutRepo.getByExerciseId>>,
  exerciseId: string
): number[] {
  return sessions
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // oldest → newest
    .map((session) => {
      const exercise = session.exercises.find((e) => e.exerciseId === exerciseId);
      if (!exercise) return 0;
      const workingSets = exercise.sets.filter((s) => !s.isWarmup);
      if (workingSets.length === 0) return 0;
      return Math.max(...workingSets.map((s) => estimatedMax(s.weight, s.completedReps)));
    })
    .filter((v) => v > 0);
}

function weightedLinearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  const w = values.map((_, i) => Math.pow(DECAY, n - 1 - i));

  const sumW   = w.reduce((a, b) => a + b, 0);
  const sumWX  = w.reduce((a, wi, i) => a + wi * i, 0);
  const sumWY  = w.reduce((a, wi, i) => a + wi * values[i], 0);
  const sumWX2 = w.reduce((a, wi, i) => a + wi * i * i, 0);
  const sumWXY = w.reduce((a, wi, i) => a + wi * i * values[i], 0);

  const denom = sumW * sumWX2 - sumWX ** 2;
  if (denom === 0) return { slope: 0, intercept: sumWY / sumW };

  const slope = (sumW * sumWXY - sumWX * sumWY) / denom;
  const intercept = (sumWY - slope * sumWX) / sumW;
  return { slope, intercept };
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

  if (!lastData) {
    return {
      recommendedWeight: null,
      reasoning: 'returning',
      confidence: 'low',
      message: 'No previous set data found — start at a comfortable weight.',
    };
  }

  const increment = INCREASE_MULTIPLIER_KG;
  const completionRate = lastData.targetReps > 0
    ? lastData.completedReps / lastData.targetReps
    : 1;

  const convertForDisplay = (weightKg: number): number =>
    unit === 'lbs' ? kgToLbs(weightKg) : weightKg;

  // Decrease — couldn't complete reps (applies regardless of session count)
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

  const e1rms = getSessionE1RMs(sessions, exerciseId);

  // Enough data for regression
  if (e1rms.length >= 5) {
    // Need 6+ sessions so recentSlope (last 3) differs meaningfully from overall slope
    const recentSlope = e1rms.length >= 6
      ? weightedLinearRegression(e1rms.slice(-3)).slope
      : null;

    // Deload — flat or declining recent progress (only when we have enough data to compare)
    if (recentSlope !== null && recentSlope <= 0) {
      const deloadWeight = roundToIncrement(lastData.weight * DELOAD_MULTIPLIER, increment);
      const displayWeight = convertForDisplay(deloadWeight);
      return {
        recommendedWeight: displayWeight,
        reasoning: 'deload_fatigue',
        confidence: 'medium',
        alternativeWeight: convertForDisplay(lastData.weight),
        message: `Progress has stalled — try ${displayWeight}${unit} to reset and recover.`,
      };
    }

    // Predict next weight from full regression
    const { slope, intercept } = weightedLinearRegression(e1rms);
    const predictedE1RM = intercept + slope * e1rms.length;
    const targetReps = lastData.targetReps || 8;
    const predictedWeight = roundToIncrement(
      workingWeightFromE1RM(predictedE1RM, targetReps),
      increment
    );
    const displayWeight = convertForDisplay(predictedWeight);
    return {
      recommendedWeight: displayWeight,
      reasoning: 'increase_progression',
      confidence: 'high',
      alternativeWeight: convertForDisplay(lastData.weight),
      message: `On track — try ${displayWeight}${unit} today.`,
    };
  }

  // Fewer than 5 sessions — rule-based fallback
  if (lastData.rpe <= 7 && completionRate >= 1) {
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

  const displayWeight = convertForDisplay(lastData.weight);
  return {
    recommendedWeight: displayWeight,
    reasoning: 'maintain_consolidate',
    confidence: 'high',
    message: `Stay at ${displayWeight}${unit} and aim to improve reps or RPE.`,
  };
}
