import type { SplitTemplate } from '../types/split.types';

export const SPLIT_TEMPLATES: Record<number, SplitTemplate> = {
  // ─── 1-Day Full Body ───
  1: {
    name: 'Full Body',
    description: 'All major muscle groups in one comprehensive session',
    days: [
      {
        name: 'Full Body',
        muscles: [
          { muscle: 'quadriceps',   percentage: 15 },
          { muscle: 'chest',        percentage: 13 },
          { muscle: 'lats',         percentage: 13 },
          { muscle: 'hamstrings',   percentage: 10 },
          { muscle: 'glutes',       percentage: 10 },
          { muscle: 'shoulders',    percentage: 10 },
          { muscle: 'biceps',       percentage: 7  },
          { muscle: 'triceps',      percentage: 7  },
          { muscle: 'calves',       percentage: 5  },
          { muscle: 'abdominals',   percentage: 5  },
          { muscle: 'lower back',   percentage: 5  },
        ],
      },
    ],
  },

  // ─── 2-Day Upper/Lower ───
  2: {
    name: 'Upper/Lower',
    description: 'Alternate between upper and lower body focus',
    days: [
      {
        name: 'Upper',
        muscles: [
          { muscle: 'chest',        percentage: 20 },
          { muscle: 'lats',         percentage: 20 },
          { muscle: 'shoulders',    percentage: 20 },
          { muscle: 'biceps',       percentage: 15 },
          { muscle: 'triceps',      percentage: 15 },
          { muscle: 'traps',        percentage: 10 },
        ],
      },
      {
        name: 'Lower',
        muscles: [
          { muscle: 'quadriceps',   percentage: 25 },
          { muscle: 'hamstrings',   percentage: 25 },
          { muscle: 'glutes',       percentage: 20 },
          { muscle: 'calves',       percentage: 10 },
          { muscle: 'abdominals',   percentage: 10 },
          { muscle: 'lower back',   percentage: 10 },
        ],
      },
    ],
  },
  // ─── 3-Day Push/Pull/Legs ───
  3: {
    name: 'Push/Pull/Legs',
    description: 'Classic 3-way split for balanced development',
    days: [
      {
        name: 'Push',
        muscles: [
          { muscle: 'chest',      percentage: 40 },
          { muscle: 'shoulders',  percentage: 30 },
          { muscle: 'triceps',    percentage: 30 },
        ],
      },
      {
        name: 'Pull',
        muscles: [
          { muscle: 'lats',         percentage: 30 },
          { muscle: 'middle back',  percentage: 20 },
          { muscle: 'biceps',       percentage: 20 },
          { muscle: 'traps',        percentage: 20 },
          { muscle: 'forearms',     percentage: 10 },
        ],
      },
      {
        name: 'Legs',
        muscles: [
          { muscle: 'quadriceps',  percentage: 25 },
          { muscle: 'hamstrings',  percentage: 25 },
          { muscle: 'glutes',      percentage: 20 },
          { muscle: 'calves',      percentage: 10 },
          { muscle: 'abdominals',  percentage: 10 },
          { muscle: 'lower back',   percentage: 10  },
        ],
      },
    ],
  },

  // ─── 4-Day Upper/Lower ───
  4: {
    name: 'Upper/Lower x2',
    description: 'Each muscle group trained twice per week',
    days: [
      {
        name: 'Upper A (Strength)',
        muscles: [
          { muscle: 'chest',       percentage: 25 },
          { muscle: 'lats',        percentage: 25 },
          { muscle: 'shoulders',   percentage: 20 },
          { muscle: 'triceps',     percentage: 15 },
          { muscle: 'biceps',      percentage: 15 },
        ],
      },
      {
        name: 'Lower A (Strength)',
        muscles: [
          { muscle: 'quadriceps',  percentage: 25 },
          { muscle: 'hamstrings',  percentage: 25 },
          { muscle: 'glutes',      percentage: 20 },
          { muscle: 'calves',      percentage: 10 },
          { muscle: 'abdominals',  percentage: 10 },
          { muscle: 'lower back',   percentage: 10  },
        ],
      },
      {
        name: 'Upper B (Volume)',
        muscles: [
          { muscle: 'chest',        percentage: 20 },
          { muscle: 'middle back',  percentage: 20 },
          { muscle: 'shoulders',    percentage: 20 },
          { muscle: 'biceps',       percentage: 15 },
          { muscle: 'triceps',      percentage: 15 },
          { muscle: 'traps',        percentage: 10 },
        ],
      },
      {
        name: 'Lower B (Volume)',
        muscles: [
          { muscle: 'quadriceps',  percentage: 25 },
          { muscle: 'hamstrings',  percentage: 25 },
          { muscle: 'glutes',      percentage: 20 },
          { muscle: 'calves',      percentage: 15 },
          { muscle: 'abductors',   percentage: 8  },
          { muscle: 'adductors',   percentage: 7  },
        ],
      },
    ],
  },

  // ─── 5-Day ULPPL ───
  5: {
    name: 'Upper/Lower/Push/Pull/Legs',
    description: 'High frequency training with varied stimulus',
    days: [
      {
        name: 'Upper',
        muscles: [
          { muscle: 'chest',       percentage: 20 },
          { muscle: 'lats',        percentage: 20 },
          { muscle: 'shoulders',   percentage: 20 },
          { muscle: 'biceps',      percentage: 15 },
          { muscle: 'triceps',     percentage: 15 },
          { muscle: 'traps',       percentage: 10 },
        ],
      },
      {
        name: 'Lower',
        muscles: [
          { muscle: 'quadriceps',  percentage: 30 },
          { muscle: 'hamstrings',  percentage: 25 },
          { muscle: 'glutes',      percentage: 25 },
          { muscle: 'calves',      percentage: 10 },
          { muscle: 'abdominals',  percentage: 10 },
        ],
      },
      {
        name: 'Push',
        muscles: [
          { muscle: 'chest',      percentage: 40 },
          { muscle: 'shoulders',  percentage: 30 },
          { muscle: 'triceps',    percentage: 30 },
        ],
      },
      {
        name: 'Pull',
        muscles: [
          { muscle: 'lats',         percentage: 30 },
          { muscle: 'middle back',  percentage: 20 },
          { muscle: 'biceps',       percentage: 20 },
          { muscle: 'traps',        percentage: 20 },
          { muscle: 'forearms',     percentage: 10 },
        ],
      },
      {
        name: 'Legs',
        muscles: [
          { muscle: 'quadriceps',  percentage: 25 },
          { muscle: 'hamstrings',  percentage: 25 },
          { muscle: 'glutes',      percentage: 20 },
          { muscle: 'calves',      percentage: 10 },
          { muscle: 'abdominals',  percentage: 10 },
          { muscle: 'lower back',   percentage: 10  },
        ],
      },
    ],
  },

  // ─── 6-Day PPL x2 ───
  6: {
    name: 'Push/Pull/Legs x2',
    description: 'Each workout performed twice per week for maximum frequency',
    days: [
      {
        name: 'Push A (Heavy)',
        muscles: [
          { muscle: 'chest',      percentage: 40 },
          { muscle: 'shoulders',  percentage: 30 },
          { muscle: 'triceps',    percentage: 30 },
        ],
      },
      {
        name: 'Pull A (Heavy)',
        muscles: [
          { muscle: 'lats',         percentage: 35 },
          { muscle: 'middle back',  percentage: 20 },
          { muscle: 'biceps',       percentage: 20 },
          { muscle: 'traps',        percentage: 15 },
          { muscle: 'forearms',     percentage: 10 },
        ],
      },
      {
        name: 'Legs A (Heavy)',
        muscles: [
          { muscle: 'quadriceps',  percentage: 35 },
          { muscle: 'hamstrings',  percentage: 25 },
          { muscle: 'glutes',      percentage: 25 },
          { muscle: 'calves',      percentage: 15 },
        ],
      },
      {
        name: 'Push B (Volume)',
        muscles: [
          { muscle: 'chest',       percentage: 30 },
          { muscle: 'shoulders',   percentage: 30 },
          { muscle: 'triceps',     percentage: 25 },
          { muscle: 'abdominals',  percentage: 15 },
        ],
      },
      {
        name: 'Pull B (Volume)',
        muscles: [
          { muscle: 'lats',         percentage: 25 },
          { muscle: 'middle back',  percentage: 25 },
          { muscle: 'biceps',       percentage: 25 },
          { muscle: 'traps',        percentage: 15 },
          { muscle: 'forearms',     percentage: 10 },
        ],
      },
      {
        name: 'Legs B (Volume)',
        muscles: [
          { muscle: 'quadriceps',  percentage: 25 },
          { muscle: 'hamstrings',  percentage: 25 },
          { muscle: 'glutes',      percentage: 20 },
          { muscle: 'calves',      percentage: 10 },
          { muscle: 'abdominals',  percentage: 10 },
          { muscle: 'lower back',   percentage: 10  },
        ],
      },
    ],
  },
};