import { useEffect, useState } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/shared/Card';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useUserStore } from '../stores/useUserStore';
import { useExercises } from '../hooks/useExercises';
import { ExerciseProgressChart, type SeriesPoint } from '../components/charts/ExerciseProgressChart';
import { MonthlyPRsChart, type MonthData } from '../components/charts/MonthlyPRsChart';
import { AbstractPhysiqueDiagram } from '../components/charts/AbstractPhysiqueDiagram';
import { estimatedMax, kgToLbs } from '../utils/calculations';
import { convertVolume } from '../utils/formatters';
import WorkoutCalendar from '../components/shared/WorkoutCalendar';
import type { WorkoutSession, MuscleGroup } from '../types';
import { ALL_MUSCLE_GROUPS } from '../types/exercise.types';

export function PerformanceAnalysisPage() {
  const { history, loadHistory } = useWorkoutStore();
  const { weightUnit } = useUserStore();
  const { exercises } = useExercises();
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [isExerciseListExpanded, setIsExerciseListExpanded] = useState<boolean>(false);
  const [isExerciseSearchOpen, setIsExerciseSearchOpen] = useState<boolean>(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState<string>('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'all'>('all');

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Progress chart displays last 60 days only.
  const nowTimestamp = Date.now();
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const sixtyDaysAgoTimestamp = sixtyDaysAgo.getTime();

  function hasProgressDataForExercise(session: WorkoutSession, exerciseId: string): boolean {
    const exercise = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!exercise) return false;

    return exercise.sets.some(
      (set) => !set.isWarmup && (set.weight ?? 0) > 0 && (set.completedReps ?? 0) > 0
    );
  }

  // Only include exercises that can produce at least one valid progress point.
  const exercisesWithData = exercises.filter((ex) =>
    history.some(
      (session) =>
        new Date(session.date).getTime() >= sixtyDaysAgoTimestamp &&
        hasProgressDataForExercise(session, ex.id)
    )
  );

  // Keep selection valid when data changes.
  useEffect(() => {
    if (exercisesWithData.length === 0) {
      if (selectedExercise) setSelectedExercise('');
      return;
    }

    const selectedStillValid = exercisesWithData.some((ex) => ex.id === selectedExercise);
    if (!selectedStillValid) {
      setSelectedExercise(exercisesWithData[0].id);
    }
  }, [exercisesWithData, selectedExercise]);

  // Helper to get estimated 1RM for a given exercise from a session
  function getEstimated1RMFromSession(session: WorkoutSession, exerciseId: string): number | null {
    if (!exerciseId) return null;

    // Find the exercise in the session
    const exercise = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!exercise || !exercise.sets || exercise.sets.length === 0) return null;

    // Find the heaviest working set (non-warmup)
    let maxWeight = 0;
    let repsAtMax = 0;

    for (const set of exercise.sets) {
      if (set.isWarmup) continue;
      const weight = set.weight || 0;
      const reps = set.completedReps || 0;
      if (weight > 0 && reps > 0 && weight > maxWeight) {
        maxWeight = weight;
        repsAtMax = reps;
      }
    }

    if (maxWeight === 0 || repsAtMax === 0) return null;

    // Calculate estimated 1RM (weights are stored in kg)
    const est1RM = estimatedMax(maxWeight, repsAtMax);
    
    // Convert to display unit
    return weightUnit === 'lbs' ? kgToLbs(est1RM) : est1RM;
  }

  // Build series from history for the selected exercise (estimated 1RM trend)
  // Filter to last 2 months (60 days)
  const series: SeriesPoint[] = history
    .map((session) => {
      const est1RM = getEstimated1RMFromSession(session, selectedExercise);
      return {
        date: new Date(session.date),
        x: new Date(session.date).getTime(),
        y: est1RM || 0,
      };
    })
    .filter(p => p.y > 0 && p.x >= sixtyDaysAgoTimestamp)
    .sort((a, b) => a.x - b.x)
    .map((p) => ({ x: p.x, y: p.y }));

  // Calculate estimated 1RM from the most recent workout for this exercise
  function calculateEstimated1RM(): number | null {
    if (!selectedExercise) return null;

    // Find the most recent session containing this exercise
    const sortedSessions = [...history].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const session of sortedSessions) {
      const est1RM = getEstimated1RMFromSession(session, selectedExercise);
      if (est1RM !== null) {
        return est1RM;
      }
    }

    return null;
  }

  const estimated1RM = calculateEstimated1RM();
  const displayedEstimated1RM = estimated1RM;

  // Helper to calculate volume for a session, optionally filtered by muscle group
  const calculateSessionVolume = (session: WorkoutSession, muscleGroupFilter: MuscleGroup | 'all'): number => {
    let totalVolumeKg = 0;
    
    for (const workoutExercise of session.exercises) {
      // If filtering by muscle group, check if exercise targets that muscle (primary or secondary)
      if (muscleGroupFilter !== 'all') {
        const exercise = exercises.find(ex => ex.id === workoutExercise.exerciseId);
        if (!exercise) {
          continue; // Skip if exercise not found
        }
        
        const targetsMuscle = 
          (exercise.primaryMuscles as readonly MuscleGroup[]).includes(muscleGroupFilter as MuscleGroup) ||
          (exercise.secondaryMuscles as readonly MuscleGroup[]).includes(muscleGroupFilter as MuscleGroup);
        
        if (!targetsMuscle) {
          continue; // Skip this exercise
        }
      }
      
      // Calculate volume for this exercise (sum of all sets)
      for (const set of workoutExercise.sets) {
        if (!set.isWarmup) {
          const weight = set.weight || 0;
          const reps = set.completedReps || 0;
          totalVolumeKg += weight * reps;
        }
      }
    }
    
    return convertVolume(totalVolumeKg, 'kg', weightUnit);
  };

  // Helper to get the start of the week (Sunday) for a given date
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  // Weekly volume data for last 10 weeks (excluding current week)
  const currentWeekStart = getWeekStart(new Date());
  currentWeekStart.setHours(0, 0, 0, 0);
  
  // Go back 10 weeks from the start of current week
  const tenWeeksAgo = new Date(currentWeekStart);
  tenWeeksAgo.setDate(currentWeekStart.getDate() - (10 * 7));
  const tenWeeksAgoTimestamp = tenWeeksAgo.getTime();
  const currentWeekTimestamp = currentWeekStart.getTime();

  // Group workouts by week and sum volumes
  const weeklyVolumeMap = new Map<number, number>();
  
  history.forEach((session) => {
    const sessionDate = new Date(session.date);
    const sessionTimestamp = sessionDate.getTime();
    
    // Only include sessions from the last 10 weeks, excluding current week
    if (sessionTimestamp >= tenWeeksAgoTimestamp && sessionTimestamp < currentWeekTimestamp) {
      const weekStart = getWeekStart(sessionDate);
      weekStart.setHours(0, 0, 0, 0);
      const weekTimestamp = weekStart.getTime();
      
      const sessionVolume = calculateSessionVolume(session, selectedMuscleGroup);
      const currentVolume = weeklyVolumeMap.get(weekTimestamp) || 0;
      weeklyVolumeMap.set(weekTimestamp, currentVolume + sessionVolume);
    }
  });

  // Convert to series points (volume already in display unit from calculateSessionVolume)
  const volumeSeries: SeriesPoint[] = Array.from(weeklyVolumeMap.entries())
    .map(([weekTimestamp, volume]) => ({
      x: weekTimestamp,
      y: volume,
    }))
    .sort((a, b) => a.x - b.x);

  // Build volume totals per calendar day (YYYY-MM-DD)
  const volumesByDate: Record<string, number> = history.reduce((acc: Record<string, number>, s) => {
    const d = new Date(s.date);
    const key = d.toISOString().slice(0, 10);
    const sessionVolume = calculateSessionVolume(s, selectedMuscleGroup);
    acc[key] = (acc[key] || 0) + sessionVolume;
    return acc;
  }, {});

  const last9Weeks = (() => {
    const arr: { date: Date; volume: number }[] = [];
    const today = new Date();
    
    // Find the start of the current week (Sunday)
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const startOfCurrentWeek = new Date(today);
    startOfCurrentWeek.setDate(today.getDate() - currentDayOfWeek);
    
    // Go back 8 more weeks (9 weeks total including current week)
    const startDate = new Date(startOfCurrentWeek);
    startDate.setDate(startOfCurrentWeek.getDate() - (8 * 7));
    
    // Generate all days from start date to today
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const key = currentDate.toISOString().slice(0, 10);
      arr.push({ date: new Date(currentDate), volume: volumesByDate[key] || 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return arr;
  })();

  // Calculate total volume from calendar period
  const totalCalendarVolume = last9Weeks.reduce((sum, day) => sum + day.volume, 0);

  // Calculate monthly PRs for the last 6 months
  const monthlyPRs = (() => {
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    // Sort sessions chronologically
    const sortedSessions = [...history].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Track best estimated 1RM for each exercise up to each point in time
    const exerciseBests = new Map<string, number>();
    const prsByMonth = new Map<string, number>();

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.date);
      if (sessionDate < sixMonthsAgo) {
        // Build up historical bests but don't count PRs before 6 months ago
        for (const exercise of session.exercises) {
          const est1RM = getEstimated1RMFromSession(session, exercise.exerciseId);
          if (est1RM !== null) {
            const currentBest = exerciseBests.get(exercise.exerciseId) || 0;
            if (est1RM > currentBest) {
              exerciseBests.set(exercise.exerciseId, est1RM);
            }
          }
        }
        continue;
      }

      const monthKey = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}`;
      
      for (const exercise of session.exercises) {
        const est1RM = getEstimated1RMFromSession(session, exercise.exerciseId);
        if (est1RM !== null) {
          const currentBest = exerciseBests.get(exercise.exerciseId) || 0;
          if (est1RM > currentBest) {
            // This is a PR!
            exerciseBests.set(exercise.exerciseId, est1RM);
            prsByMonth.set(monthKey, (prsByMonth.get(monthKey) || 0) + 1);
          }
        }
      }
    }

    // Build array of last 6 months
    const months: MonthData[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today);
      d.setMonth(today.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('default', { month: 'short' });
      months.push({ month: monthLabel, count: prsByMonth.get(monthKey) || 0 });
    }

    return months;
  })();

  // Calculate current estimated 1RM for all exercises with data
  const allExercise1RMs = (() => {
    const exerciseMap = new Map<string, { name: string; est1RM: number; bestPR: number }>();

    // Sort sessions by date (most recent first)
    const sortedSessions = [...history].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Track which exercises we've already found the most recent workout for
    const processedExercises = new Set<string>();

    // First pass: get current (most recent) 1RM for each exercise
    for (const session of sortedSessions) {
      for (const exercise of session.exercises) {
        if (processedExercises.has(exercise.exerciseId)) continue;

        const est1RM = getEstimated1RMFromSession(session, exercise.exerciseId);
        if (est1RM !== null) {
          const exerciseData = exercises.find(ex => ex.id === exercise.exerciseId);
          if (exerciseData) {
            exerciseMap.set(exercise.exerciseId, {
              name: exerciseData.name.replace(/_/g, ' '),
              est1RM: est1RM,
              bestPR: est1RM // Initialize with current value
            });
            processedExercises.add(exercise.exerciseId);
          }
        }
      }
    }

    // Second pass: find best PR (highest 1RM) across all sessions
    for (const session of history) {
      for (const exercise of session.exercises) {
        const est1RM = getEstimated1RMFromSession(session, exercise.exerciseId);
        if (est1RM !== null) {
          const existing = exerciseMap.get(exercise.exerciseId);
          if (existing && est1RM > existing.bestPR) {
            existing.bestPR = est1RM;
          }
        }
      }
    }

    // Convert to array and sort by name
    return Array.from(exerciseMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  })();

  const filteredExercise1RMs = allExercise1RMs.filter((ex) =>
    ex.name.toLowerCase().includes(exerciseSearchQuery.trim().toLowerCase())
  );

  const visibleExercise1RMs =
    isExerciseListExpanded || exerciseSearchQuery.trim().length > 0
      ? filteredExercise1RMs
      : filteredExercise1RMs.slice(0, 5);

  return (
    <div className="min-h-screen pb-24">
      <PageHeader 
        title="Performance Analysis" 
        showBack 
      />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Estimated 1RM Trend */}
        <section>
          <h2 className="text-sm font-semibold text-gray-text uppercase tracking-wider">
            Performance
          </h2>
          <h1 className="text-lg font-semibold text-white-text uppercase tracking-wider mb-3">
            Estimated 1RM Trend
          </h1>
          <Card className="mt-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-text mb-1">Current Estimated 1RM</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-bold text-white-primary">
                      {displayedEstimated1RM ? Math.round(displayedEstimated1RM) : '—'}
                    </h3>
                    <span className="text-sm text-gray-text">{displayedEstimated1RM ? weightUnit : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    id="exercise-select"
                    value={selectedExercise}
                    onChange={(e) => setSelectedExercise(e.target.value)}
                    className="w-40 bg-dark-700 border border-dark-600 rounded px-2 py-1 text-sm text-gray-text"
                  >
                    <option value="">Select exercise…</option>
                    {exercisesWithData.map((ex) => (
                      <option key={ex.id || ex.name} value={ex.id}>{ex.name.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <ExerciseProgressChart
                  points={series}
                  width={480}
                  height={240}
                  xTickDays={10}
                  xDomain={[sixtyDaysAgoTimestamp, nowTimestamp]}
                />
              </div>
            </div>
          </Card>
        </section>

        {/* Monthly PRs */}
        <section>
          <h2 className="text-sm font-semibold text-gray-text uppercase tracking-wider">
            Progress
          </h2>
          <h1 className="text-lg font-semibold text-white-text tracking-wider mb-3">
            PERSONAL RECORDS
          </h1>
          <Card>
            <h3 className="text-sm font-semibold text-gray-text uppercase tracking-wider group-hover:text-white transition-colors mb-3">
              Personal Records Achieved Per Month (Last 6 Months)
            </h3>
            <div className="space-y-4">
              <MonthlyPRsChart data={monthlyPRs} width={480} height={200} />
              
              {/* Exercise 1RM List */}
              <div className="border-t border-dark-600 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    className="text-left group"
                    onClick={() => setIsExerciseListExpanded(!isExerciseListExpanded)}
                  >
                    <h3 className="text-sm font-semibold text-gray-text uppercase tracking-wider group-hover:text-white transition-colors">
                      Current Estimated 1RM | Best PR (by Exercise)
                    </h3>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Search exercises"
                      className="p-1 rounded text-gray-text hover:text-white hover:bg-dark-700 transition-colors"
                      onClick={() => {
                        setIsExerciseSearchOpen(!isExerciseSearchOpen);
                        if (isExerciseSearchOpen) {
                          setExerciseSearchQuery('');
                        }
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.6-5.15a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      aria-label={isExerciseListExpanded ? 'Collapse exercise list' : 'Expand exercise list'}
                      className="p-1 rounded text-gray-text hover:text-white hover:bg-dark-700 transition-colors"
                      onClick={() => setIsExerciseListExpanded(!isExerciseListExpanded)}
                    >
                      <svg
                        className={`w-5 h-5 transition-all ${isExerciseListExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </div>
                </div>
                {isExerciseSearchOpen && (
                  <div className="mb-3">
                    <input
                      type="text"
                      value={exerciseSearchQuery}
                      onChange={(e) => setExerciseSearchQuery(e.target.value)}
                      placeholder="Search exercise..."
                      className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-sm text-white placeholder:text-gray-text focus:outline-none focus:border-blue-primary"
                    />
                  </div>
                )}
                {allExercise1RMs.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {visibleExercise1RMs.map((ex, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 px-2 rounded hover:bg-dark-700/50 transition-colors">
                        <span className="text-sm text-white">{ex.name}</span>
                        <span className="text-sm font-semibold text-blue-primary">
                          {Math.round(ex.est1RM)} {weightUnit} | {Math.round(ex.bestPR)} {weightUnit}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-text text-center py-4">
                    No exercise data available yet.
                  </p>
                )}
                {allExercise1RMs.length > 0 && filteredExercise1RMs.length === 0 && (
                  <p className="text-sm text-gray-text text-center py-4">
                    No matching exercises.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </section>

        {/* Physique Diagram */}
        <section>
          <h2 className="text-sm font-semibold text-gray-text uppercase tracking-wider">
            Muscle Focus
          </h2>
          <h1 className="text-lg font-semibold text-white-text tracking-wider mb-3">
            PHYSIQUE DIAGRAM
          </h1>
          <Card>
            <p className="text-sm text-gray-text mb-4">
              Minimal front and back muscle map inspired by your reference style.
            </p>
            <AbstractPhysiqueDiagram />
          </Card>
        </section>

        {/* Training Volume */}
        <section>
          <h2 className="text-sm font-semibold text-gray-text uppercase tracking-wider">
            Consistency
          </h2>
          <h1 className="text-lg font-semibold text-white-text tracking-wider mb-3">
            TRAINING VOLUME
          </h1>
          <Card>
            <div className="mb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-text mb-1">Total Volume (Last 9 Weeks)</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-white-primary">
                      {Math.round(totalCalendarVolume).toLocaleString()}
                    </h3>
                    <span className="text-sm text-gray-text">{weightUnit}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <select
                    value={selectedMuscleGroup}
                    onChange={(e) => setSelectedMuscleGroup(e.target.value as MuscleGroup | 'all')}
                    className="bg-dark-700 border border-dark-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-primary"
                  >
                    <option value="all">All Muscles</option>
                    {ALL_MUSCLE_GROUPS.map((muscle) => (
                      <option key={muscle} value={muscle}>
                        {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <WorkoutCalendar days={last9Weeks} unit={weightUnit} />
            </div>
            <div className="mt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <p className="text-sm text-gray-text">
                    Volume Trend (Last 10 Weeks)
                  </p>
                </div>
              </div>
              <div>
                <ExerciseProgressChart
                  points={volumeSeries}
                  width={480}
                  height={240}
                  stroke= '#3d80e3'
                  fill = 'rgba(66, 133, 232, 0.15)'
                  xTickDays={7}
                  xDomain={[tenWeeksAgoTimestamp, currentWeekTimestamp]}
                />
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
