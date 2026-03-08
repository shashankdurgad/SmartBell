import { useEffect, useState } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/shared/Card';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useUserStore } from '../stores/useUserStore';
import { useExercises } from '../hooks/useExercises';
import { ExerciseProgressChart, type SeriesPoint } from '../components/charts/ExerciseProgressChart';
import { estimatedMax, kgToLbs } from '../utils/calculations';
import { convertVolume } from '../utils/formatters';
import WorkoutCalendar from '../components/shared/WorkoutCalendar';
import type { WorkoutSession } from '../types';

export function PerformanceAnalysisPage() {
  const { history, loadHistory } = useWorkoutStore();
  const { weightUnit } = useUserStore();
  const { exercises } = useExercises();
  const [selectedExercise, setSelectedExercise] = useState<string>('');

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

  // Calculate estimated 1RM using Epley and Brzycki formulas
  function calculateEstimated1RM(): number | null {
    if (!selectedExercise) return null;

    // Find the highest estimated 1RM across all sessions for this exercise
    let maxEstimated1RM = 0;

    for (const session of history) {
      const est1RM = getEstimated1RMFromSession(session, selectedExercise);
      if (est1RM && est1RM > maxEstimated1RM) {
        maxEstimated1RM = est1RM;
      }
    }

    return maxEstimated1RM > 0 ? maxEstimated1RM : null;
  }

  const estimated1RM = calculateEstimated1RM();
  const displayedEstimated1RM = estimated1RM;

  // Build volume totals per calendar day (YYYY-MM-DD)
  const volumesByDate: Record<string, number> = history.reduce((acc: Record<string, number>, s) => {
    const d = new Date(s.date);
    const key = d.toISOString().slice(0, 10);
    const sessionVolumeKg = Number(s.totalVolume) || 0;
    const displayVolume = convertVolume(sessionVolumeKg, 'kg', weightUnit);
    acc[key] = (acc[key] || 0) + displayVolume;
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

        {/* Training Volume */}
        <section>
          <h2 className="text-sm font-semibold text-gray-text uppercase tracking-wider mb-1">
            Consistency
          </h2>
          <h1 className="text-lg font-semibold text-white-text tracking-wider mb-3">
            Training Volume
          </h1>
          <Card>
            <div>
              <WorkoutCalendar days={last9Weeks} unit={weightUnit} />
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
