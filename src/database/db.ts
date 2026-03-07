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

export interface UserPreferences {
  id: string;
  trainingStyle: 'strength' | 'hypertrophy' | 'endurance';
  difficulty: 'beginner' | 'intermediate' | 'expert';
  availableEquipment: string[];
  daysPerWeek: number;
  timePerSession: number;
  defaultRestTimer: number;
  excludedExercises?: string[];
}

export class SmartBellDB extends Dexie {
  exercises!: Table<Exercise, string>;
  weeklyPlans!: Table<WeeklyPlan, string>;
  dailyWorkouts!: Table<DailyWorkout, string>;
  workoutSessions!: Table<WorkoutSession, string>;
  personalRecords!: Table<PersonalRecord, string>;
  settings!: Table<AppSettings, string>;
  userPreferences!: Table<UserPreferences, string>;

  constructor() {
    super('SmartBellDB');

    this.version(3).stores({
      // ...existing code...
      exercises: 'id, name, *primaryMuscles, equipment, level, category, mechanic',
      weeklyPlans: 'id, createdAt, daysPerWeek, trainingStyle',
      dailyWorkouts: 'id, dayNumber, name',
      workoutSessions: 'id, weeklyPlanId, dailyWorkoutId, date, dayNumber',
      personalRecords: 'id, exerciseId, type, date',
      settings: 'id',
      userPreferences: 'id',
    });
  }
}

export const db = new SmartBellDB();
