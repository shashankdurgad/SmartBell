import type { WeeklyPlanConstraints } from '../utils/validators';
import type { WeeklyPlan, DailyWorkout, RoutineExercise } from '../types';
import type { MuscleGroup } from '../types/exercise.types';
import type { SplitDay, MuscleAllocation } from '../types/split.types';
import { SPLIT_TEMPLATES } from '@/data/split-templates';
import { db } from '../database/db';

const STYLE_CONFIG = {
  strength:    { reps: '3-6',   setsMax: 5, defaultRest: 180, setDuration: 40 },
  hypertrophy: { reps: '8-12',  setsMax: 4, defaultRest: 120, setDuration: 60 },
  endurance:   { reps: '15-20', setsMax: 3, defaultRest: 60,  setDuration: 60 },
} as const;

const DIFFICULTY_CONFIG = {
  beginner:     { maxSets: 16, exPerMuscle: 1, restMod:  15 },
  intermediate: { maxSets: 18, exPerMuscle: 2, restMod:   0 },
  expert:       { maxSets: 21, exPerMuscle: 3, restMod: 0 },
} as const;

type Style = typeof STYLE_CONFIG[keyof typeof STYLE_CONFIG];
type Diff = typeof DIFFICULTY_CONFIG[keyof typeof DIFFICULTY_CONFIG];

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function calcTotalSets(timeMinutes: number, rest: number, style: Style, diff: Diff): number {
  const raw = Math.ceil((timeMinutes * 60) / (style.setDuration + rest));
  return Math.min(raw, diff.maxSets);
}

function distributeSetsAcrossExercises(totalSets: number, count: number): number[] {
  const base = Math.floor(totalSets / count);
  const remainder = totalSets % count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

async function queryExercises(
  muscle: MuscleGroup,
  equipment: string[],
  excluded: string[],
  trainingStyle: 'strength' | 'hypertrophy' | 'endurance',
  limit: number
) {
    const all = await db.exercises
    .where('primaryMuscles')
    .equals(muscle)
    .toArray();

  return all
    .filter((ex) => ex.equipment && equipment.includes(ex.equipment))
    .filter((ex) => !excluded.includes(ex.id))
    .sort((a, b) =>
      ((b.applicability?.[trainingStyle] ?? 0) * (b.commonality ?? 1)) -
      ((a.applicability?.[trainingStyle] ?? 0) * (a.commonality ?? 1))
    )
    .slice(0, limit);
}

function allocateSetsToMuscles(
  muscles: MuscleAllocation[],
  totalSets: number
): { muscle: MuscleGroup; sets: number }[] {
  const raw = muscles.map((m) => ({
    muscle: m.muscle,
    exact: (m.percentage / 100) * totalSets,
  }));

  const floored = raw.map((r) => ({
    muscle: r.muscle,
    sets: Math.floor(r.exact),
    remainder: r.exact - Math.floor(r.exact),
  }));

  // Distribute leftover sets by largest remainder
  let leftover = totalSets - floored.reduce((s, f) => s + f.sets, 0);
  const sorted = [...floored].sort((a, b) => b.remainder - a.remainder);
  for (const f of sorted) {
    if (leftover <= 0) break;
    f.sets++;
    leftover--;
  }

  // Every muscle gets at least 1 set
  const result = floored.map((f) => ({ muscle: f.muscle, sets: f.sets }));
  for (const r of result) {
    if (r.sets === 0) {
      r.sets = 1;
      // Steal from the muscle with most sets
      const largest = result.reduce((a, b) => (a.sets > b.sets ? a : b));
      largest.sets--;
    }
  }

  return result;
}

async function buildDay(
  template: SplitDay,
  dayNumber: number,
  style: Style,
  diff: Diff,
  constraints: WeeklyPlanConstraints,
  rest: number,
): Promise<DailyWorkout> {
  const totalSets = calcTotalSets(constraints.timePerSession, rest, style, diff);
  const muscleAllocation = allocateSetsToMuscles(template.muscles, totalSets);

  const exercises: RoutineExercise[] = [];
  const usedIds = new Set<string>();

  for (const { muscle, sets: muscleSets } of muscleAllocation) {
    const exCount = Math.min(
      Math.ceil(muscleSets / style.setsMax),
      diff.exPerMuscle
    );

    const setsPerEx = distributeSetsAcrossExercises(muscleSets, exCount);

    const candidates = await queryExercises(
      muscle,
      constraints.availableEquipment,
      [...(constraints.excludeExercises ?? []), ...usedIds],
      constraints.trainingStyle,
      exCount
    );

    for (let i = 0; i < exCount; i++) {
      const matched = candidates[i];

      exercises.push({
        exerciseId: matched?.id ?? `fallback_${muscle}_${i}`,
        exerciseName: matched?.name ?? `${muscle} exercise ${i + 1}`,
        sets: setsPerEx[i],
        reps: style.reps,
        restSeconds: rest,
      });

      if (matched) usedIds.add(matched.id);
    }
  }

  const totalExSets = exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const estimatedDuration = Math.round((totalExSets * (style.setDuration + rest)) / 60);

  return {
    id: crypto.randomUUID(),
    dayNumber,
    name: template.name,
    targetMuscles: template.muscles.map((m) => m.muscle),
    estimatedDuration,
    exercises,
  };
}

export async function generateWeeklyPlan(
  constraints: WeeklyPlanConstraints
): Promise<WeeklyPlan> {
  const split = SPLIT_TEMPLATES[constraints.daysPerWeek];
  if (!split) throw new Error(`No split for ${constraints.daysPerWeek} days`);

  const style = STYLE_CONFIG[constraints.trainingStyle];
  const diff = DIFFICULTY_CONFIG[constraints.difficulty ?? 'intermediate'];
  const difficultyLabel = capitalize(constraints.difficulty ?? 'intermediate');
  const trainingStyleLabel = capitalize(constraints.trainingStyle);

  const prefs = await db.userPreferences.get('default');
  const rest = Math.max(30, (prefs?.defaultRestTimer ?? style.defaultRest) + diff.restMod);
  
    const workouts = await Promise.all(
    split.days.map((day, i) =>
      buildDay(day, i + 1, style, diff, constraints, rest)
    )
  );


  const totalWeeklyVolume = workouts.reduce(
    (s, w) => s + w.exercises.reduce((es, e) => es + e.sets, 0), 0
  );
  const estimatedWeeklyDuration = workouts.reduce(
    (s, w) => s + w.estimatedDuration, 0
  );

  return {
    id: crypto.randomUUID(),
    name: `${split.name} (${difficultyLabel}) (${trainingStyleLabel})`,
    createdAt: new Date(),
    daysPerWeek: constraints.daysPerWeek,
    trainingStyle: constraints.trainingStyle,
    totalWeeklyVolume,
    estimatedWeeklyDuration,
    workouts,
  };
}