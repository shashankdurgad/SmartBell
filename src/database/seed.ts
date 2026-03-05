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

  // Add dummy workout sessions if none exist or fewer than 200
  const workoutCount = await db.workoutSessions.count();
  if (workoutCount < 200) {
    // Find bench press exercise ID
    const benchPress = await db.exercises.where('name').equals('Bench Press - Powerlifting').first();
    const benchPressId = benchPress?.id || 'Bench Press - Powerlifting';

    const sessions: any[] = [];
    const now = new Date();
    for (let i = 0; i < 50; i++) {
      const offset = Math.floor(Math.random() * 90); // within last 90 days
      const date = new Date(now);
      date.setDate(now.getDate() - offset);
      const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const dayNumber = date.getDay() + 1;
      const dayName = dayNames[date.getDay()];

      // Generate realistic bench press workout
      const numSets = Math.floor(Math.random() * 3) + 3; // 3-5 sets
      const baseWeight = Math.floor(Math.random() * 100) + 135; // 135-235 lbs
      const sets = [];
      let totalReps = 0;
      let totalVolume = 0;

      for (let s = 0; s < numSets; s++) {
        const targetReps = s === 0 ? 5 : Math.floor(Math.random() * 4) + 6; // warmup or 6-9 reps
        const completedReps = targetReps - Math.floor(Math.random() * 2); // 90-100% completion
        const weight = s === 0 ? baseWeight * 0.6 : baseWeight + (Math.random() * 10 - 5); // warmup lighter
        const rpe = s === 0 ? 4 : Math.floor(Math.random() * 3) + 7;
        const isWarmup = s === 0;

        sets.push({
          setNumber: s + 1,
          weight: Math.round(weight),
          targetReps,
          completedReps,
          rpe,
          isWarmup,
        });

        totalReps += completedReps;
        totalVolume += weight * completedReps;
      }

      const totalSets = numSets;
      const duration = Math.floor(Math.random() * 30) + 20;

      sessions.push({
        id: crypto.randomUUID(),
        weeklyPlanId: '',
        dailyWorkoutId: '',
        dayNumber,
        dayName,
        date,
        startTime: date,
        endTime: undefined,
        exercises: [
          {
            exerciseId: benchPressId,
            sets,
          },
        ],
        totalVolume: Math.round(totalVolume),
        totalSets,
        totalReps,
        duration,
      });
    }
    await db.workoutSessions.bulkAdd(sessions as never[]);
    console.log(`Seeded ${sessions.length} dummy workout sessions with bench press`);
  }
}

