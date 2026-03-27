export type PRType = 'weight' | 'reps' | 'volume' | 'estimated_1rm';

export interface WorkoutSet {
  setNumber: number;
  weight: number;
  targetReps: number;
  completedReps: number;
  rpe: number;            // 1-10
  isWarmup: boolean;
  notes?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: WorkoutSet[];
  targetSets: number;
  targetReps: number;
  personalRecord?: PRType;
}

export interface WorkoutSession {
  id: string;
  weeklyPlanId: string;
  dailyWorkoutId: string;
  dayNumber: number;
  dayName: string;
  date: Date;
  startTime: Date;
  endTime?: Date;
  exercises: WorkoutExercise[];
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  duration: number;       // Minutes
  notes?: string;
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  type: PRType;
  value: number;
  date: Date;
  previousValue?: number;
  improvement?: number;
  weeklyPlanId?: string;
  dayNumber?: number;
}

export type WeightUnit = 'lbs' | 'kg';

export interface WeightRecommendation {
  recommendedWeight: number | null;
  reasoning: RecommendationReason;
  confidence: 'high' | 'medium' | 'low';
  alternativeWeight?: number;
  message: string;
}

export type RecommendationReason =
  | 'increase_progression'
  | 'decrease_recovery'
  | 'maintain_consolidate'
  | 'deload_fatigue'
  | 'first_time'
  | 'returning';
