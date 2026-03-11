import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { EmptyState } from '../components/shared/EmptyState';
import { useWeeklyPlanStore } from '../stores/useWeeklyPlanStore';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useUserStore } from '../stores/useUserStore';
import { exerciseRepo } from '../database/repositories/exerciseRepo';
import { formatDate, formatVolume, formatDuration } from '../utils/formatters';
import { ExerciseProgressChart, type SeriesPoint } from '../components/charts/ExerciseProgressChart';
import { useExercises } from '../hooks/useExercises';
import { estimatedMax, kgToLbs } from '../utils/calculations';
import type { WorkoutSession } from '../types';

export function DashboardPage() {
  const navigate = useNavigate();
  const { plans, activePlan, loadPlans } = useWeeklyPlanStore();
  const { history, loadHistory } = useWorkoutStore();
  const { weightUnit } = useUserStore();
  const [exerciseCount, setExerciseCount] = useState(0);

  useEffect(() => {
    loadPlans();
    loadHistory();
    exerciseRepo.count().then(setExerciseCount);
  }, [loadPlans, loadHistory]);

  const recentWorkouts = history.slice(0, 3);
  const totalVolume = history.reduce((sum, s) => sum + s.totalVolume, 0);
  const totalWorkouts = history.length;

  // Auto-select most recently performed strength-based exercise
  const { exercises } = useExercises();

  // Progress chart displays last 60 days only.
  const nowTimestamp = Date.now();
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const sixtyDaysAgoTimestamp = sixtyDaysAgo.getTime();

  // Find the most recently performed strength-based exercise
  const selectedExercise = (() => {
    // Sort sessions by date (most recent first)
    const sortedSessions = [...history].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Find first exercise with valid strength data
    for (const session of sortedSessions) {
      for (const exercise of session.exercises) {
        const hasValidData = exercise.sets.some(
          (set) => !set.isWarmup && (set.weight ?? 0) > 0 && (set.completedReps ?? 0) > 0
        );
        if (hasValidData) {
          return exercise.exerciseId;
        }
      }
    }
    return '';
  })();

  // Get exercise name for display
  const selectedExerciseName = selectedExercise
    ? exercises.find((ex) => ex.id === selectedExercise)?.name.replace(/_/g, ' ') || ''
    : '';

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


  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="SmartBell" />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          <Card variant="elevated" padding="sm" className="text-center">
            <p className="text-2xl font-bold text-blue-primary">{exerciseCount}</p>
            <p className="text-xs text-gray-text mt-1">Exercises</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <p className="text-2xl font-bold text-green-accent">{totalWorkouts}</p>
            <p className="text-xs text-gray-text mt-1">Workouts</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <p className="text-2xl font-bold text-yellow-accent">{formatVolume(totalVolume, weightUnit)}</p>
            <p className="text-xs text-gray-text mt-1">Volume</p>
          </Card>
        </div>

        {/* Active Plan */}
        <section>
          <h2 className="text-sm font-semibold text-gray-text uppercase tracking-wider mb-3">
            Active Plan
          </h2>
          {activePlan ? (
            <Card variant="outlined" className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{activePlan.name}</h3>
                  <p className="text-sm text-gray-text">
                    {activePlan.daysPerWeek} days/week &middot; {activePlan.trainingStyle}
                  </p>
                </div>
                <Button size="sm" onClick={() => navigate('/workout')}>
                  Start
                </Button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {activePlan.workouts.map((day) => (
                  <div
                    key={day.id}
                    className="flex-shrink-0 bg-dark-700 rounded-lg px-3 py-2 text-xs"
                  >
                    <p className="font-medium text-white">{day.name}</p>
                    <p className="text-gray-text">{day.exercises.length} exercises</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card variant="outlined">
              <EmptyState
                title="No active plan"
                description="Generate a personalized weekly workout plan to get started."
                action={
                  <Button onClick={() => navigate('/generator')}>
                    Generate Plan
                  </Button>
                }
              />
            </Card>
          )}
        </section>

        
      {/* Exercise Progress */}
      <section>
        <h2 className="text-sm font-semibold text-gray-text uppercase tracking-wider">
          Performance
        </h2>
        <h1 className="text-lg font-semibold text-white-text uppercase tracking-wider mb-3">
          Estimated 1RM Trend
        </h1>
        <Card 
          className="mt-2 cursor-pointer hover:border-blue-primary/50 transition-colors" 
          onClick={() => navigate('/performance')}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div>
                  <p className="text-xs text-gray-text mb-1">Current Estimated 1RM</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-bold text-white-primary">
                      {displayedEstimated1RM ? Math.round(displayedEstimated1RM) : '—'}
                    </h3>
                    <span className="text-sm text-gray-text">{displayedEstimated1RM ? weightUnit : ''}</span>
                  </div>
                </div>
                {selectedExerciseName && (
                  <p className="text-sm text-gray-text">
                    Exercise: <span className="text-white">{selectedExerciseName}</span>
                  </p>
                )}
              </div>
              <svg className="w-5 h-5 text-gray-text flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
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

      {/* Recent Workouts */}

        <section>
          <h2 className="text-sm font-semibold text-gray-text uppercase tracking-wider mb-3">
            Recent Workouts
          </h2>
          {recentWorkouts.length > 0 ? (
            <div className="space-y-2">
              {recentWorkouts.map((session) => (
                <Card key={session.id} padding="sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{session.dayName}</p>
                      <p className="text-sm text-gray-text">
                        {formatDate(new Date(session.date))} &middot; {formatDuration(session.duration)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-light">
                        Vol: {formatVolume(session.totalVolume, weightUnit)} {weightUnit}
                      </p>
                      <p className="text-xs text-gray-text">{session.totalSets} sets</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-center text-gray-text text-sm py-4">
                No workouts logged yet. Complete your first workout to see history.
              </p>
            </Card>
          )}
        </section>

        {/* Saved Plans */}
        {plans.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-text uppercase tracking-wider mb-3">
              Saved Plans ({plans.length})
            </h2>
            <div className="space-y-2">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  padding="sm"
                  className="cursor-pointer hover:border-blue-primary/50 transition-colors"
                  onClick={() => navigate(`/plan/${plan.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{plan.name}</p>
                      <p className="text-sm text-gray-text">
                        {plan.daysPerWeek} days &middot; {plan.trainingStyle}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
