import { useState, useEffect, useCallback } from 'react';
import type { WorkoutSession } from '../types';
import { workoutRepo } from '../database/repositories/workoutRepo';

interface AnalyticsSummary {
  totalWorkouts: number;
  totalVolume: number;
  totalDuration: number;
  averageDuration: number;
  averageVolume: number;
}

export function useAnalytics(dateRange?: { start: Date; end: Date }) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalWorkouts: 0,
    totalVolume: 0,
    totalDuration: 0,
    averageDuration: 0,
    averageVolume: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      let results: WorkoutSession[];
      if (dateRange) {
        results = await workoutRepo.getByDateRange(dateRange.start, dateRange.end);
      } else {
        results = await workoutRepo.getAll();
      }

      setSessions(results);

      const totalWorkouts = results.length;
      const totalVolume = results.reduce((sum, s) => sum + s.totalVolume, 0);
      const totalDuration = results.reduce((sum, s) => sum + s.duration, 0);

      setSummary({
        totalWorkouts,
        totalVolume,
        totalDuration,
        averageDuration: totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0,
        averageVolume: totalWorkouts > 0 ? Math.round(totalVolume / totalWorkouts) : 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange?.start?.getTime(), dateRange?.end?.getTime()]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { sessions, summary, isLoading, refetch: fetch };
}
