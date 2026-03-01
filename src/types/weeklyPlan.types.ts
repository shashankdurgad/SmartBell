import type { MuscleGroup } from './exercise.types';
import type { TrainingStyle, DayOfWeek } from './split.types';

export interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;           // "8-12" or "5"
  restSeconds: number;
  notes?: string;
}

export interface DailyWorkout {
  id: string;
  dayNumber: number;
  name: string;
  targetMuscles: MuscleGroup[];
  estimatedDuration: number;
  exercises: RoutineExercise[];
  suggestedDayOfWeek?: DayOfWeek;
}

export interface WeeklyPlan {
  id: string;
  name: string;
  createdAt: Date;
  daysPerWeek: number;
  trainingStyle: TrainingStyle;
  totalWeeklyVolume: number;
  estimatedWeeklyDuration: number;
  workouts: DailyWorkout[];
}
