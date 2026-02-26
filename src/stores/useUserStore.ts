import { create } from 'zustand';
import type { WeightUnit, TrainingStyle, Equipment } from '../types';
import { db } from '../database/db';
import type { AppSettings } from '../database/db';

interface UserState {
  weightUnit: WeightUnit;
  defaultRestSeconds: number;
  defaultTrainingStyle: TrainingStyle;
  availableEquipment: Equipment[];
  isLoaded: boolean;

  loadSettings: () => Promise<void>;
  setWeightUnit: (unit: WeightUnit) => Promise<void>;
  setDefaultRestSeconds: (seconds: number) => Promise<void>;
  setDefaultTrainingStyle: (style: TrainingStyle) => Promise<void>;
  setAvailableEquipment: (equipment: Equipment[]) => void;
}

export const useUserStore = create<UserState>((set) => ({
  weightUnit: 'lbs',
  defaultRestSeconds: 90,
  defaultTrainingStyle: 'hypertrophy',
  availableEquipment: [],
  isLoaded: false,

  loadSettings: async () => {
    const settings = await db.settings.get('default');
    if (settings) {
      set({
        weightUnit: settings.weightUnit,
        defaultRestSeconds: settings.defaultRestSeconds,
        defaultTrainingStyle: settings.defaultTrainingStyle,
        isLoaded: true,
      });
    } else {
      set({ isLoaded: true });
    }
  },

  setWeightUnit: async (unit: WeightUnit) => {
    set({ weightUnit: unit });
    await db.settings.update('default', { weightUnit: unit } as Partial<AppSettings>);
  },

  setDefaultRestSeconds: async (seconds: number) => {
    set({ defaultRestSeconds: seconds });
    await db.settings.update('default', { defaultRestSeconds: seconds } as Partial<AppSettings>);
  },

  setDefaultTrainingStyle: async (style: TrainingStyle) => {
    set({ defaultTrainingStyle: style });
    await db.settings.update('default', { defaultTrainingStyle: style } as Partial<AppSettings>);
  },

  setAvailableEquipment: (equipment: Equipment[]) => {
    set({ availableEquipment: equipment });
  },
}));
