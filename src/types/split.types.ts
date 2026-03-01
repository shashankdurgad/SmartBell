import type { MuscleGroup } from './exercise.types';

export type TrainingStyle = 'strength' | 'hypertrophy' | 'endurance';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'expert';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface DayTemplate {
  name: string;
  muscles: MuscleGroup[];
  focus?: TrainingStyle;
  intensity?: 'light' | 'normal' | 'heavy';
}

export interface MuscleAllocation {
  muscle: MuscleGroup;
  percentage: number; // 0-100, all muscles in a day should sum to 100
}

export interface SplitDay {
  name: string;
  muscles: MuscleAllocation[];
}

export interface SplitTemplate {
  name: string;
  description: string;
  days: SplitDay[];
}

export interface VolumeConfig {
  setsPerExercise: { min: number; max: number };
  repRange: string;
  restSeconds: { min: number; max: number };
  compoundRatio: number;
}
