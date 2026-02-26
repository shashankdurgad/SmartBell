export type MuscleGroup =
  | 'abdominals'
  | 'abductors'
  | 'adductors'
  | 'biceps'
  | 'calves'
  | 'chest'
  | 'forearms'
  | 'glutes'
  | 'hamstrings'
  | 'lats'
  | 'lower back'
  | 'middle back'
  | 'neck'
  | 'quadriceps'
  | 'shoulders'
  | 'traps'
  | 'triceps';

export type Equipment =
  | null
  | 'medicine ball'
  | 'dumbbell'
  | 'body only'
  | 'bands'
  | 'kettlebells'
  | 'foam roll'
  | 'cable'
  | 'machine'
  | 'barbell'
  | 'exercise ball'
  | 'e-z curl bar'
  | 'other';

export type ExerciseForce = 'push' | 'pull' | 'static' | null;

export type ExerciseLevel = 'beginner' | 'intermediate' | 'expert';

export type ExerciseMechanic = 'compound' | 'isolation' | null;

export type ExerciseCategory =
  | 'powerlifting'
  | 'strength'
  | 'stretching'
  | 'cardio'
  | 'olympic weightlifting'
  | 'strongman'
  | 'plyometrics';

export interface Applicability {
  strength: number;     // 0-10
  hypertrophy: number;  // 0-10
  endurance: number;    // 0-10
}

export interface Exercise {
  id: string;
  name: string;
  force: ExerciseForce;
  level: ExerciseLevel;
  mechanic: ExerciseMechanic;
  equipment: Equipment;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  instructions: string[];
  category: ExerciseCategory;
  images: string[];
  applicability: Applicability;
}

export const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'abdominals', 'abductors', 'adductors', 'biceps', 'calves', 'chest',
  'forearms', 'glutes', 'hamstrings', 'lats', 'lower back', 'middle back',
  'neck', 'quadriceps', 'shoulders', 'traps', 'triceps',
];

export const ALL_EQUIPMENT: NonNullable<Equipment>[] = [
  'barbell', 'dumbbell', 'body only', 'cable', 'machine', 'kettlebells',
  'bands', 'exercise ball', 'medicine ball', 'e-z curl bar', 'foam roll', 'other',
];
