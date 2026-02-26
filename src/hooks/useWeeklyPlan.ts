import { useEffect } from 'react';
import { useWeeklyPlanStore } from '../stores/useWeeklyPlanStore';

export function useWeeklyPlans() {
  const { plans, isLoading, loadPlans } = useWeeklyPlanStore();

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  return { plans, isLoading };
}

export function useActivePlan() {
  const {
    activePlan,
    activeDayIndex,
    setActivePlan,
    setActiveDayIndex,
    getActiveDay,
  } = useWeeklyPlanStore();

  return {
    activePlan,
    activeDayIndex,
    activeDay: getActiveDay(),
    setActivePlan,
    setActiveDayIndex,
  };
}
