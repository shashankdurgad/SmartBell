import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WeeklyPlan, DailyWorkout } from '../types';
import { weeklyPlanRepo } from '../database/repositories/weeklyPlanRepo';

interface WeeklyPlanState {
  plans: WeeklyPlan[];
  activePlan: WeeklyPlan | null;
  activePlanId: string | null;
  activeDayIndex: number;
  isLoading: boolean;

  loadPlans: () => Promise<void>;
  setActivePlan: (plan: WeeklyPlan | null) => void;
  setActiveDayIndex: (index: number) => void;
  savePlan: (plan: WeeklyPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  getActiveDay: () => DailyWorkout | null;
}

export const useWeeklyPlanStore = create<WeeklyPlanState>()(
  persist(
    (set, get) => ({
      plans: [],
      activePlan: null,
      activePlanId: null,
      activeDayIndex: 0,
      isLoading: false,

      loadPlans: async () => {
        set({ isLoading: true });
        const plans = await weeklyPlanRepo.getAll();
        
        // Restore active plan from stored ID
        const { activePlanId } = get();
        const activePlan = activePlanId 
          ? plans.find(p => p.id === activePlanId) ?? null
          : null;
        
        set({ plans, activePlan, isLoading: false });
      },

      setActivePlan: (plan: WeeklyPlan | null) => {
        set({ 
          activePlan: plan, 
          activePlanId: plan?.id ?? null,
          activeDayIndex: 0 
        });
      },

      setActiveDayIndex: (index: number) => {
        set({ activeDayIndex: index });
      },

      savePlan: async (plan: WeeklyPlan) => {
        await weeklyPlanRepo.save(plan);
        const plans = await weeklyPlanRepo.getAll();
        set({ 
          plans, 
          activePlan: plan,
          activePlanId: plan.id
        });
      },

      deletePlan: async (id: string) => {
        await weeklyPlanRepo.delete(id);
        const state = get();
        const plans = state.plans.filter((p) => p.id !== id);
        const shouldClearActive = state.activePlanId === id;
        set({
          plans,
          activePlan: shouldClearActive ? null : state.activePlan,
          activePlanId: shouldClearActive ? null : state.activePlanId,
        });
      },

      getActiveDay: () => {
        const { activePlan, activeDayIndex } = get();
        if (!activePlan) return null;
        return activePlan.workouts[activeDayIndex] ?? null;
      },
    }),
    {
      name: 'smartbell-weekly-plan',
      partialize: (state) => ({
        activePlanId: state.activePlanId,
        activeDayIndex: state.activeDayIndex,
      }),
    }
  )
);
