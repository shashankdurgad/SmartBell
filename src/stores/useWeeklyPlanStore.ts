import { create } from 'zustand';
import type { WeeklyPlan, DailyWorkout } from '../types';
import { weeklyPlanRepo } from '../database/repositories/weeklyPlanRepo';

interface WeeklyPlanState {
  plans: WeeklyPlan[];
  activePlan: WeeklyPlan | null;
  activeDayIndex: number;
  isLoading: boolean;

  loadPlans: () => Promise<void>;
  setActivePlan: (plan: WeeklyPlan | null) => void;
  setActiveDayIndex: (index: number) => void;
  savePlan: (plan: WeeklyPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  getActiveDay: () => DailyWorkout | null;
}

export const useWeeklyPlanStore = create<WeeklyPlanState>((set, get) => ({
  plans: [],
  activePlan: null,
  activeDayIndex: 0,
  isLoading: false,

  loadPlans: async () => {
    set({ isLoading: true });
    const plans = await weeklyPlanRepo.getAll();
    set({ plans, isLoading: false });
  },

  setActivePlan: (plan: WeeklyPlan | null) => {
    set({ activePlan: plan, activeDayIndex: 0 });
  },

  setActiveDayIndex: (index: number) => {
    set({ activeDayIndex: index });
  },

  savePlan: async (plan: WeeklyPlan) => {
    await weeklyPlanRepo.save(plan);
    const plans = await weeklyPlanRepo.getAll();
    set({ plans, activePlan: plan });
  },

  deletePlan: async (id: string) => {
    await weeklyPlanRepo.delete(id);
    const state = get();
    const plans = state.plans.filter((p) => p.id !== id);
    set({
      plans,
      activePlan: state.activePlan?.id === id ? null : state.activePlan,
    });
  },

  getActiveDay: () => {
    const { activePlan, activeDayIndex } = get();
    if (!activePlan) return null;
    return activePlan.workouts[activeDayIndex] ?? null;
  },
}));
