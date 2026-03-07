import type { WeeklyPlanConstraints } from '../utils/validators';
import type { WeeklyPlan, DailyWorkout, RoutineExercise } from '../types';
import type { MuscleGroup } from '../types/exercise.types';
import type { SplitDay } from '../types/split.types';
import { SPLIT_TEMPLATES } from '@/data/split-templates';
import { db } from '../database/db';

const STYLE_CONFIG = {
  strength:    { reps: '3-6',   setsMin: 4, setsMax: 5, restMin: 120, restMax: 180, setDuration: 35 },
  hypertrophy: { reps: '8-12',  setsMin: 3, setsMax: 4, restMin: 60,  restMax: 90,  setDuration: 45 },
  endurance:   { reps: '15-20', setsMin: 2, setsMax: 3, restMin: 30,  restMax: 45,  setDuration: 60 },
} as const;

const DIFFICULTY_CONFIG = {
  beginner:     { maxSets: 16, exPerMuscle: 1, restMod:  15 },
  intermediate: { maxSets: 22, exPerMuscle: 2, restMod:   0 },
  expert:       { maxSets: 28, exPerMuscle: 3, restMod: 0 },
} as const;

type Style = typeof STYLE_CONFIG[keyof typeof STYLE_CONFIG];
type Diff = typeof DIFFICULTY_CONFIG[keyof typeof DIFFICULTY_CONFIG];

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function calcTotalSets(timeMinutes: number, style: Style, diff: Diff): number {
  const rest = (style.restMin + style.restMax) / 2 + diff.restMod;
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
      (b.applicability?.[trainingStyle] ?? 0) -
      (a.applicability?.[trainingStyle] ?? 0)
    )
    .slice(0, limit);
}

async function buildDay(
  template: SplitDay,
  dayNumber: number,
  style: Style,
  diff: Diff,
  constraints: WeeklyPlanConstraints,
): Promise<DailyWorkout> {
  const totalSets = calcTotalSets(constraints.timePerSession, style, diff);
  const rest = Math.max(30, Math.round((style.restMin + style.restMax) / 2 + diff.restMod));

  const exercises: RoutineExercise[] = [];
  const usedIds = new Set<string>();

  for (const muscle of template.muscles) {
    const muscleSets = Math.max(1, Math.ceil((muscle.percentage / 100) * totalSets));

    const exCount = Math.min(
      Math.ceil(muscleSets / style.setsMax),
      diff.exPerMuscle
    );

    const setsPerEx = distributeSetsAcrossExercises(muscleSets, exCount);

    const candidates = await queryExercises(
      muscle.muscle,
      constraints.availableEquipment,
      [...(constraints.excludeExercises ?? []), ...usedIds],
      constraints.trainingStyle,
      exCount
    );

    for (let i = 0; i < exCount; i++) {
      const matched = candidates[i];

      exercises.push({
        exerciseId: matched?.id ?? `fallback_${muscle.muscle}_${i}`,
        exerciseName: matched?.name ?? `${muscle.muscle} exercise ${i + 1}`,
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

    const workouts = await Promise.all(
    split.days.map((day, i) =>
      buildDay(day, i + 1, style, diff, constraints)
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