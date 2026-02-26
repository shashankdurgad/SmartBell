import Dexie, { type Table } from 'dexie';
import type { Exercise } from '../types/exercise.types';
import type { WeeklyPlan, DailyWorkout } from '../types/weeklyPlan.types';
import type { WorkoutSession, PersonalRecord } from '../types/workout.types';

export interface AppSettings {
  id: string;
  weightUnit: 'lbs' | 'kg';
  defaultRestSeconds: number;
  defaultTrainingStyle: 'strength' | 'hypertrophy' | 'endurance';
}

export class SmartBellDB extends Dexie {
  exercises!: Table<Exercise, string>;
  weeklyPlans!: Table<WeeklyPlan, string>;
  dailyWorkouts!: Table<DailyWorkout, string>;
  workoutSessions!: Table<WorkoutSession, string>;
  personalRecords!: Table<PersonalRecord, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('SmartBellDB');

    this.version(1).stores({
      exercises: 'id, name, *primaryMuscles, equipment, level, category, mechanic',
      weeklyPlans: 'id, createdAt, daysPerWeek, trainingStyle',
      dailyWorkouts: 'id, dayNumber, name',
      workoutSessions: 'id, weeklyPlanId, dailyWorkoutId, date, dayNumber',
      personalRecords: 'id, exerciseId, type, date',
      settings: 'id',
    });
  }
}

export const db = new SmartBellDB();
