import { useState, useEffect, useCallback } from 'react';
import type { Exercise, MuscleGroup, Equipment } from '../types';
import { exerciseRepo } from '../database/repositories/exerciseRepo';

interface UseExercisesOptions {
  muscles?: MuscleGroup[];
  equipment?: Equipment[];
  level?: string;
  category?: string;
  searchQuery?: string;
}

interface UseExercisesReturn {
  exercises: Exercise[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => Promise<void>;
}

export function useExercises(options: UseExercisesOptions = {}): UseExercisesReturn {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let results: Exercise[];

      if (options.searchQuery && options.searchQuery.trim().length > 0) {
        results = await exerciseRepo.search(options.searchQuery);
      } else if (options.muscles?.length || options.equipment?.length || options.level || options.category) {
        results = await exerciseRepo.getFiltered({
          muscles: options.muscles,
          equipment: options.equipment,
          level: options.level,
          category: options.category,
        });
      } else {
        results = await exerciseRepo.getAll();
      }

      setExercises(results);
      const count = await exerciseRepo.count();
      setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercises');
    } finally {
      setIsLoading(false);
    }
  }, [options.searchQuery, options.muscles, options.equipment, options.level, options.category]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { exercises, isLoading, error, totalCount, refetch: fetch };
}
