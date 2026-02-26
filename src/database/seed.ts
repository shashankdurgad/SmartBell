import { db } from './db';
import type { AppSettings } from './db';
import exercisesData from '../data/exercises.json';

const DEFAULT_SETTINGS: AppSettings = {
  id: 'default',
  weightUnit: 'lbs',
  defaultRestSeconds: 90,
  defaultTrainingStyle: 'hypertrophy',
};

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
    }));

    await db.exercises.bulkAdd(exercises as never[]);
    console.log(`Seeded ${exercises.length} exercises`);
  }
}
