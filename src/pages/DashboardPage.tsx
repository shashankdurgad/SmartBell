import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { EmptyState } from '../components/shared/EmptyState';
import { useWeeklyPlanStore } from '../stores/useWeeklyPlanStore';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { exerciseRepo } from '../database/repositories/exerciseRepo';
import { formatDate, formatVolume, formatDuration } from '../utils/formatters';
import { ExerciseProgressChart, type SeriesPoint } from '../components/charts/ExerciseProgressChart';
import { useExercises } from '../hooks/useExercises';
import WorkoutCalendar from '../components/shared/WorkoutCalendar';

export function DashboardPage() {
  const navigate = useNavigate();
  const { plans, activePlan, loadPlans } = useWeeklyPlanStore();
  const { history, loadHistory } = useWorkoutStore();
  const [exerciseCount, setExerciseCount] = useState(0);

  useEffect(() => {
    loadPlans();
    loadHistory();
    exerciseRepo.count().then(setExerciseCount);
  }, [loadPlans, loadHistory]);

  const recentWorkouts = history.slice(0, 3);
  const totalVolume = history.reduce((sum, s) => sum + s.totalVolume, 0);
  const totalWorkouts = history.length;

  // Exercises for dropdown
  const { exercises } = useExercises();
  const [selectedExercise, setSelectedExercise] = useState<string>('');

  // when exercises load, default to first
  useEffect(() => {
    if (!selectedExercise && exercises.length > 0) {
      setSelectedExercise(exercises[0].name);
    }
  }, [exercises, selectedExercise]);

  // Helper to extract total volume for a given exercise name from a session
  // NOTE: Adjust this function if your session schema differs.
  function getExerciseVolumeFromSession(session: any, exerciseName: string): number {
    if (!exerciseName) return 0;
    // Expected shape: session.exercises: Array<{ name: string, sets: Array<{ reps: number, weight: number }> }>
    // Fallbacks included in case your shape uses volume directly per exercise
    const items = (session.exercises || []).filter((e: any) => (e.name || e.exerciseName) === exerciseName);
    if (items.length === 0) return 0;
    let vol = 0;
    for (const e of items) {
      if (typeof e.totalVolume === 'number') {
        vol += e.totalVolume;
        continue;
      }
      const sets = e.sets || [];
      for (const s of sets) {
        const reps = Number(s.reps) || 0;
        const weight = Number(s.weight) || 0;
        vol += reps * weight;
      }
    }
    return vol;
  }

  // Build series from history for the selected exercise
  const series: SeriesPoint[] = history
    .map((session: any, _: number) => ({
      date: new Date(session.date),
      x: new Date(session.date).getTime(),
      y: getExerciseVolumeFromSession(session, selectedExercise),
    }))
    .filter(p => p.y > 0)
    .sort((a, b) => a.x - b.x)
    .map((p, _) => ({ x: p.x, y: p.y }));

    // Build volume totals per calendar day (YYYY-MM-DD)
    const volumesByDate: Record<string, number> = history.reduce((acc: Record<string, number>, s: any) => {
      const d = new Date(s.date);
      const key = d.toISOString().slice(0, 10);
      acc[key] = (acc[key] || 0) + (Number(s.totalVolume) || 0);
      return acc;
    }, {});

    const last60Days = (() => {
      const arr: { date: Date; volume: number }[] = [];
      const today = new Date();
      for (let i = 59; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        arr.push({ date: d, volume: volumesByDate[key] || 0 });
      }
      return arr;
    })();

    // Calculate estimated 1RM using Epley and Brzycki formulas
    function calculateEstimated1RM(): number | null {
      if (!selectedExercise) return null;

      // Find the last set for the selected exercise with highest weight
      let maxWeight = 0;
      let repsAtMax = 0;

      for (const session of history) {
        for (const exercise of session.exercises || []) {
          // Match exercise - check by name or ID
          const matchesName = exercise.exerciseId === selectedExercise;
          const exerciseData = exercises.find((ex: any) => ex.id === exercise.exerciseId);
          const matchesById = exerciseData && exerciseData.name === selectedExercise;

          if (matchesName || matchesById) {
            for (const set of exercise.sets || []) {
              const weight = set.weight || 0;
              const reps = set.completedReps || set.completedReps || 0;
              if (weight > 0 && reps > 0) {
                if (weight > maxWeight) {
                  maxWeight = weight;
                  repsAtMax = reps;
                }
              }
            }
          }
        }
      }

      if (maxWeight === 0 || repsAtMax === 0) return null;

      // Epley formula: 1RM = weight × (1 + reps/30)
      const epley = maxWeight * (1 + repsAtMax / 30);

      // Brzycki formula: 1RM = weight / (1.0278 - 0.0278 × reps)
      const brzycki = maxWeight / (1.0278 - 0.0278 * repsAtMax);

      // Average the two
      return (epley + brzycki) / 2;
    }

    const estimated1RM = calculateEstimated1RM();


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
            <p className="text-2xl font-bold text-yellow-accent">{formatVolume(totalVolume)}</p>
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
        <Card className="mt-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-text mb-1">Current Estimated 1RM</p>
                <h3 className="text-3xl font-bold text-blue-primary">
                  {estimated1RM ? Math.round(estimated1RM) : '—'}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <select
                  id="exercise-select"
                  value={selectedExercise}
                  onChange={(e) => setSelectedExercise(e.target.value)}
                  className="w-40 bg-dark-700 border border-dark-600 rounded px-2 py-1 text-sm text-gray-text"
                >
                  <option value="">Select exercise…</option>
                  {exercises.map((ex: any) => (
                    <option key={ex.id || ex.name} value={ex.name}>{ex.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <Card variant="outlined" className="mt-6">
              <div className="p-4 overflow-x-auto">
                <ExerciseProgressChart points={series} width={640} height={260} />
              </div>
            </Card>
          </div>
        </Card>
        <h2 className="text-sm font-semibold text-gray-text uppercase tracking-wider mt-4">
          Consistency
        </h2>
        <h1 className="text-lg font-semibold text-white-text tracking-wider">
          Training Frequency
        </h1>
        <Card className="mt-4">
          <div>
            <WorkoutCalendar days={last60Days} />
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
                <Card key={session.id} variant="outlined" padding="sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{session.dayName}</p>
                      <p className="text-sm text-gray-text">
                        {formatDate(new Date(session.date))} &middot; {formatDuration(session.duration)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-light">
                        {formatVolume(session.totalVolume)} vol
                      </p>
                      <p className="text-xs text-gray-text">{session.totalSets} sets</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card variant="outlined">
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
                  variant="outlined"
                  padding="sm"
                  className="cursor-pointer hover:border-blue-primary/50 transition-colors"
                  onClick={() => navigate(`/plan/${plan.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{plan.name}</p>
                      <p className="text-sm text-gray-text">
                        {plan.daysPerWeek} days &middot; {plan.splitType} &middot; {plan.trainingStyle}
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
