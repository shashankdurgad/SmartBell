import type { SplitTemplate, MuscleGroup } from '../types';

const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'lats', 'middle back', 'lower back', 'shoulders', 'traps',
  'biceps', 'triceps', 'forearms',
  'quadriceps', 'hamstrings', 'glutes', 'calves',
  'abdominals', 'abductors', 'adductors', 'neck',
];

export const SPLIT_TEMPLATES: Record<number, SplitTemplate> = {
  1: {
    name: 'Full Body',
    description: 'All major muscle groups in one comprehensive session',
    days: [
      {
        name: 'Full Body',
        muscles: ALL_MUSCLE_GROUPS,
      },
    ],
  },

  2: {
    name: 'Upper/Lower',
    description: 'Alternate between upper and lower body focus',
    days: [
      {
        name: 'Upper Body',
        muscles: ['chest', 'lats', 'middle back', 'shoulders', 'traps', 'biceps', 'triceps', 'forearms'],
      },
      {
        name: 'Lower Body',
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'lower back'],
      },
    ],
  },

  3: {
    name: 'Push/Pull/Legs',
    description: 'Classic 3-way split for balanced development',
    days: [
      {
        name: 'Push',
        muscles: ['chest', 'shoulders', 'triceps'],
      },
      {
        name: 'Pull',
        muscles: ['lats', 'middle back', 'traps', 'biceps', 'forearms'],
      },
      {
        name: 'Legs & Core',
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'lower back'],
      },
    ],
  },

  4: {
    name: 'Upper/Lower x2',
    description: 'Each muscle group trained twice per week',
    days: [
      {
        name: 'Upper A (Strength)',
        muscles: ['chest', 'lats', 'middle back', 'shoulders', 'biceps', 'triceps'],
        focus: 'strength',
      },
      {
        name: 'Lower A (Strength)',
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
        focus: 'strength',
      },
      {
        name: 'Upper B (Hypertrophy)',
        muscles: ['chest', 'lats', 'middle back', 'shoulders', 'traps', 'biceps', 'triceps', 'forearms'],
        focus: 'hypertrophy',
      },
      {
        name: 'Lower B (Hypertrophy)',
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'lower back'],
        focus: 'hypertrophy',
      },
    ],
  },

  5: {
    name: 'Push/Pull/Legs/Upper/Lower',
    description: 'High frequency training with varied stimulus',
    days: [
      {
        name: 'Push',
        muscles: ['chest', 'shoulders', 'triceps'],
      },
      {
        name: 'Pull',
        muscles: ['lats', 'middle back', 'traps', 'biceps', 'forearms'],
      },
      {
        name: 'Legs',
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
      },
      {
        name: 'Upper Body',
        muscles: ['chest', 'lats', 'middle back', 'shoulders', 'biceps', 'triceps'],
      },
      {
        name: 'Lower & Core',
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'lower back'],
      },
    ],
  },

  6: {
    name: 'Push/Pull/Legs x2',
    description: 'Each workout performed twice per week for maximum frequency',
    days: [
      {
        name: 'Push A',
        muscles: ['chest', 'shoulders', 'triceps'],
        intensity: 'heavy',
      },
      {
        name: 'Pull A',
        muscles: ['lats', 'middle back', 'traps', 'biceps', 'forearms'],
        intensity: 'heavy',
      },
      {
        name: 'Legs A',
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
        intensity: 'heavy',
      },
      {
        name: 'Push B',
        muscles: ['chest', 'shoulders', 'triceps'],
        intensity: 'normal',
      },
      {
        name: 'Pull B',
        muscles: ['lats', 'middle back', 'traps', 'biceps', 'forearms'],
        intensity: 'normal',
      },
      {
        name: 'Legs B & Core',
        muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'lower back'],
        intensity: 'normal',
      },
    ],
  },

  7: {
    name: 'Body Part Split + Recovery',
    description: 'Dedicated focus days with active recovery',
    days: [
      {
        name: 'Chest',
        muscles: ['chest'],
      },
      {
        name: 'Back',
        muscles: ['lats', 'middle back', 'lower back', 'traps'],
      },
      {
        name: 'Shoulders & Arms',
        muscles: ['shoulders', 'biceps', 'triceps', 'forearms'],
      },
      {
        name: 'Quadriceps & Calves',
        muscles: ['quadriceps', 'calves'],
      },
      {
        name: 'Hamstrings & Glutes',
        muscles: ['hamstrings', 'glutes'],
      },
      {
        name: 'Core & Accessories',
        muscles: ['abdominals', 'lower back', 'forearms', 'calves'],
      },
      {
        name: 'Active Recovery',
        muscles: ALL_MUSCLE_GROUPS,
        intensity: 'light',
      },
    ],
  },
};
