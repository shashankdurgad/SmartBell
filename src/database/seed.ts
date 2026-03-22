import { db } from './db';
import type { AppSettings } from './db';
import exercisesData from '../data/exercises.json';
import type { WeeklyPlan, DailyWorkout, RoutineExercise, WorkoutSession, WorkoutSet } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  id: 'default',
  weightUnit: 'lbs',
  defaultRestSeconds: 90,
  defaultTrainingStyle: 'hypertrophy',
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SIX_MONTHS_AGO = 6;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function parseRepTarget(reps: string): number {
  if (!reps) return 10;

  const rangeMatch = reps.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    const low = Number(rangeMatch[1]);
    const high = Number(rangeMatch[2]);
    return randomInt(low, high);
  }

  const singleMatch = reps.match(/\d+/);
  if (singleMatch) {
    return Number(singleMatch[0]);
  }

  return 10;
}

function buildExerciseSets(
  exercise: RoutineExercise,
  baseWeight: number,
  progressRatio: number
): { sets: WorkoutSet[]; volume: number; reps: number } {
  const targetSets = Math.max(1, exercise.sets || 3);
  const targetReps = Math.max(1, parseRepTarget(exercise.reps));
  const progressionMultiplier = 1 + progressRatio * 0.18;

  const sets: WorkoutSet[] = [];
  let volume = 0;
  let reps = 0;

  for (let i = 0; i < targetSets; i++) {
    const setFatigueDrop = 1 - i * 0.02;
    const plannedWeight = Math.max(5, Math.round(baseWeight * progressionMultiplier * setFatigueDrop));
    const completedReps = Math.max(1, targetReps + randomInt(-1, 1));

    sets.push({
      setNumber: i + 1,
      weight: plannedWeight,
      targetReps,
      completedReps,
      rpe: randomInt(6, 9),
      isWarmup: false,
    });

    volume += plannedWeight * completedReps;
    reps += completedReps;
  }

  return { sets, volume, reps };
}

function getPersistedActivePlanId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem('smartbell-weekly-plan');
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { state?: { activePlanId?: string | null } };
    return parsed.state?.activePlanId ?? null;
  } catch {
    return null;
  }
}

async function resolveActivePlan(): Promise<WeeklyPlan | null> {
  const persistedActivePlanId = getPersistedActivePlanId();
  if (persistedActivePlanId) {
    const persistedPlan = await db.weeklyPlans.get(persistedActivePlanId);
    if (persistedPlan) return persistedPlan;
  }

  const mostRecentPlan = await db.weeklyPlans.orderBy('createdAt').reverse().first();
  return mostRecentPlan ?? null;
}

function getSixMonthWindow(): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - SIX_MONTHS_AGO);
  startDate.setHours(0, 0, 0, 0);
  return { startDate, endDate };
}

function getSessionDate(weekStart: Date, dayOffset: number): Date {
  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + dayOffset);
  date.setHours(randomInt(6, 20), randomInt(0, 59), 0, 0);
  return date;
}

function createSessionForWorkoutDay(
  activePlan: WeeklyPlan,
  workoutDay: DailyWorkout,
  sessionDate: Date,
  elapsedRatio: number,
  exerciseBaseWeights: Map<string, number>
): WorkoutSession {
  const sessionExercises = [];
  let totalVolume = 0;
  let totalReps = 0;
  let totalSets = 0;

  for (const exercise of workoutDay.exercises) {
    const existingBaseWeight = exerciseBaseWeights.get(exercise.exerciseId);
    const baseWeight = existingBaseWeight ?? randomInt(35, 185);
    exerciseBaseWeights.set(exercise.exerciseId, baseWeight);

    const generated = buildExerciseSets(exercise, baseWeight, elapsedRatio);

    sessionExercises.push({
      exerciseId: exercise.exerciseId,
      targetSets: Math.max(1, exercise.sets || 3),
      sets: generated.sets,
    });

    totalVolume += generated.volume;
    totalReps += generated.reps;
    totalSets += generated.sets.length;
  }

  const duration = Math.max(20, totalSets * 3 + workoutDay.exercises.length * 2 + randomInt(-8, 8));
  const endTime = new Date(sessionDate);
  endTime.setMinutes(endTime.getMinutes() + duration);

  return {
    id: crypto.randomUUID(),
    weeklyPlanId: activePlan.id,
    dailyWorkoutId: workoutDay.id,
    dayNumber: workoutDay.dayNumber,
    dayName: workoutDay.name || DAY_NAMES[sessionDate.getDay()],
    date: sessionDate,
    startTime: sessionDate,
    endTime,
    exercises: sessionExercises,
    totalVolume,
    totalSets,
    totalReps,
    duration,
  };
}

function generatePlanSessionsForLastSixMonths(activePlan: WeeklyPlan): WorkoutSession[] {
  const { startDate, endDate } = getSixMonthWindow();
  const sessions: WorkoutSession[] = [];
  const exerciseBaseWeights = new Map<string, number>();

  const workoutsByOrder = [...activePlan.workouts].sort((a, b) => a.dayNumber - b.dayNumber);
  if (workoutsByOrder.length === 0) return sessions;

  const weekStart = new Date(startDate);
  while (weekStart <= endDate) {
    for (const workoutDay of workoutsByOrder) {
      const dayOffset = Math.max(0, workoutDay.dayNumber - 1);
      const sessionDate = getSessionDate(weekStart, dayOffset);

      if (sessionDate < startDate || sessionDate > endDate) {
        continue;
      }

      const elapsed = sessionDate.getTime() - startDate.getTime();
      const totalWindow = Math.max(1, endDate.getTime() - startDate.getTime());
      const elapsedRatio = Math.min(1, Math.max(0, elapsed / totalWindow));

      sessions.push(
        createSessionForWorkoutDay(activePlan, workoutDay, sessionDate, elapsedRatio, exerciseBaseWeights)
      );
    }

    weekStart.setDate(weekStart.getDate() + 7);
  }

  return sessions;
}

export async function seedDatabase(): Promise<void> {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add(DEFAULT_SETTINGS);
  }

  // Seed exercises from the pre-labelled JSON (includes applicability scores)
  const exerciseCount = await db.exercises.count();
  if (exerciseCount === 0) {
    const exercises = (exercisesData as Record<string, unknown>[]).map((ex) => ({
      id: ex.id as string,
      name: ex.name as string,
      force: (ex.force ?? null) as string | null,
      level: ex.level as string,
      mechanic: (ex.mechanic ?? null) as string | null,
      equipment: (ex.equipment ?? null) as string | null,
      primaryMuscles: (ex.primaryMuscles ?? []) as string[],
      secondaryMuscles: (ex.secondaryMuscles ?? []) as string[],
      instructions: (ex.instructions ?? []) as string[],
      category: ex.category as string,
      images: (ex.images ?? []) as string[],
      applicability: ex.applicability as { strength: number; hypertrophy: number; endurance: number },
      commonality: (ex.commonality ?? 5) as number,
    }));

    await db.exercises.bulkAdd(exercises as never[]);
    console.log(`Seeded ${exercises.length} exercises`);
  }

  const activePlan = await resolveActivePlan();
  if (!activePlan) {
    console.log('No weekly plan found. Skipping workout sample data seeding.');
    return;
  }

  const sessions = generatePlanSessionsForLastSixMonths(activePlan);
  if (sessions.length === 0) {
    console.log(`Active plan ${activePlan.id} has no workout days. Skipping workout sample data seeding.`);
    return;
  }

  // Rebuild sample workout history data from the active weekly plan.
  await db.workoutSessions.clear();
  await db.workoutSessions.bulkAdd(sessions as never[]);
  console.log(
    `Seeded ${sessions.length} workout sessions across the last 6 months for active plan ${activePlan.id}`
  );
}

