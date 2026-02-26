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

export interface SplitTemplate {
  name: string;
  description: string;
  days: DayTemplate[];
}

export interface VolumeConfig {
  setsPerExercise: { min: number; max: number };
  repRange: string;
  restSeconds: { min: number; max: number };
  compoundRatio: number;
}
