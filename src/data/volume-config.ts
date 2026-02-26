import type { TrainingStyle, VolumeConfig, MuscleGroup } from '../types';

export const VOLUME_CONFIG: Record<TrainingStyle, VolumeConfig> = {
  strength: {
    setsPerExercise: { min: 4, max: 5 },
    repRange: '3-5',
    restSeconds: { min: 180, max: 300 },
    compoundRatio: 0.8,
  },
  hypertrophy: {
    setsPerExercise: { min: 3, max: 4 },
    repRange: '8-12',
    restSeconds: { min: 60, max: 90 },
    compoundRatio: 0.6,
  },
  endurance: {
    setsPerExercise: { min: 2, max: 3 },
    repRange: '15-20',
    restSeconds: { min: 30, max: 45 },
    compoundRatio: 0.4,
  },
};

export const WEEKLY_VOLUME_TARGETS: Record<MuscleGroup, { min: number; max: number }> = {
  chest:          { min: 10, max: 20 },
  lats:           { min: 10, max: 20 },
  'middle back':  { min: 6,  max: 14 },
  'lower back':   { min: 4,  max: 10 },
  shoulders:      { min: 8,  max: 16 },
  traps:          { min: 4,  max: 10 },
  biceps:         { min: 6,  max: 14 },
  triceps:        { min: 6,  max: 14 },
  forearms:       { min: 4,  max: 10 },
  quadriceps:     { min: 10, max: 20 },
  hamstrings:     { min: 8,  max: 16 },
  glutes:         { min: 8,  max: 16 },
  calves:         { min: 6,  max: 12 },
  abdominals:     { min: 6,  max: 14 },
  abductors:      { min: 2,  max: 8 },
  adductors:      { min: 2,  max: 8 },
  neck:           { min: 0,  max: 6 },
};

export const MUSCLE_SIZE_PRIORITY: Record<MuscleGroup, number> = {
  quadriceps:     5,
  lats:           5,
  chest:          4,
  hamstrings:     4,
  glutes:         4,
  'middle back':  4,
  shoulders:      3,
  traps:          3,
  triceps:        2,
  biceps:         2,
  'lower back':   2,
  calves:         1,
  forearms:       1,
  abdominals:     1,
  abductors:      1,
  adductors:      1,
  neck:           1,
};
