import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/shared/Card';
import { Badge } from '../components/shared/Badge';
import { EmptyState } from '../components/shared/EmptyState';
import WorkoutCalendar from '../components/shared/WorkoutCalendar';
import { ExerciseProgressChart, type SeriesPoint } from '../components/charts/ExerciseProgressChart';
import { useExercises } from '../hooks/useExercises';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useUserStore } from '../stores/useUserStore';
import { estimatedMax, kgToLbs } from '../utils/calculations';
import { convertVolume, formatDate, formatWeight } from '../utils/formatters';
import type { WorkoutSession, WorkoutSet } from '../types';

function getBestWorkingSet(sets: WorkoutSet[]): WorkoutSet | null {
  let best: WorkoutSet | null = null;

  for (const set of sets) {
    if (set.isWarmup) continue;
    if ((set.weight ?? 0) <= 0 || (set.completedReps ?? 0) <= 0) continue;

    if (!best) {
      best = set;
      continue;
    }

    if (set.weight > best.weight || (set.weight === best.weight && set.completedReps > best.completedReps)) {
      best = set;
    }
  }

  return best;
}

function getExerciseFromSession(session: WorkoutSession, exerciseId: string) {
  return session.exercises.find((exercise) => exercise.exerciseId === exerciseId);
}

function getExerciseVolumeKg(session: WorkoutSession, exerciseId: string): number {
  const exercise = getExerciseFromSession(session, exerciseId);
  if (!exercise) return 0;

  return exercise.sets.reduce((sum, set) => {
    if (set.isWarmup) return sum;
    return sum + ((set.weight || 0) * (set.completedReps || 0));
  }, 0);
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function ExercisePerformancePage() {
  const params = useParams<{ exerciseId: string }>();
  const rawExerciseId = params.exerciseId ?? '';
  const exerciseId = decodeURIComponent(rawExerciseId);

  const { exercises } = useExercises();
  const { history, loadHistory } = useWorkoutStore();
  const { weightUnit } = useUserStore();

  // Match Dashboard trend chart time window: last 60 days.
  const nowTimestamp = Date.now();
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const sixtyDaysAgoTimestamp = sixtyDaysAgo.getTime();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const exercise = useMemo(
    () => exercises.find((item) => item.id === exerciseId),
    [exercises, exerciseId]
  );

  const sessionsForExercise = useMemo(() => {
    return history
      .map((session) => {
        const sessionExercise = getExerciseFromSession(session, exerciseId);
        if (!sessionExercise) return null;

        const bestSet = getBestWorkingSet(sessionExercise.sets);
        if (!bestSet) return null;

        const estimatedOneRm = estimatedMax(bestSet.weight, bestSet.completedReps);

        return {
          session,
          bestSet,
          estimatedOneRm,
        };
      })
      .filter((item): item is { session: WorkoutSession; bestSet: WorkoutSet; estimatedOneRm: number } => item !== null)
      .sort((a, b) => new Date(a.session.date).getTime() - new Date(b.session.date).getTime());
  }, [history, exerciseId]);

  const chartPoints: SeriesPoint[] = useMemo(
    () =>
      sessionsForExercise
        .map((item) => ({
          x: new Date(item.session.date).getTime(),
          y: weightUnit === 'lbs' ? kgToLbs(item.estimatedOneRm) : item.estimatedOneRm,
        }))
        .filter((point) => point.x >= sixtyDaysAgoTimestamp),
    [sessionsForExercise, weightUnit, sixtyDaysAgoTimestamp]
  );

  const latestEntry = sessionsForExercise[sessionsForExercise.length - 1];
  const bestWeight = sessionsForExercise.reduce((max, item) => Math.max(max, item.bestSet.weight), 0);
  const displayedBestWeight = weightUnit === 'lbs' ? kgToLbs(bestWeight) : bestWeight;
  const bestEstimatedOneRm = sessionsForExercise.reduce(
    (max, item) => Math.max(max, item.estimatedOneRm),
    0
  );
  const currentEstimatedOneRm = latestEntry
    ? (weightUnit === 'lbs' ? kgToLbs(latestEntry.estimatedOneRm) : latestEntry.estimatedOneRm)
    : null;
  const displayedBestEstimatedOneRm =
    weightUnit === 'lbs' ? kgToLbs(bestEstimatedOneRm) : bestEstimatedOneRm;

  const volumesByDate = useMemo(() => {
    return history.reduce((acc: Record<string, number>, session) => {
      const key = toLocalDateKey(new Date(session.date));
      const sessionVolumeKg = getExerciseVolumeKg(session, exerciseId);
      const sessionVolume = convertVolume(sessionVolumeKg, 'kg', weightUnit);

      if (sessionVolume > 0) {
        acc[key] = (acc[key] || 0) + sessionVolume;
      }

      return acc;
    }, {});
  }, [history, exerciseId, weightUnit]);

  const last9Weeks = useMemo(() => {
    const days: { date: Date; volume: number }[] = [];
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const startOfCurrentWeek = new Date(today);
    startOfCurrentWeek.setDate(today.getDate() - currentDayOfWeek);

    const startDate = new Date(startOfCurrentWeek);
    startDate.setDate(startOfCurrentWeek.getDate() - (8 * 7));

    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const key = toLocalDateKey(currentDate);
      days.push({ date: new Date(currentDate), volume: volumesByDate[key] || 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [volumesByDate]);

  const totalCalendarVolume = useMemo(
    () => last9Weeks.reduce((sum, day) => sum + day.volume, 0),
    [last9Weeks]
  );

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Exercise Performance" showBack />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {!exercise ? (
          <EmptyState
            title="Exercise not found"
            description="The exercise ID is not in your library."
          />
        ) : (
          <>
            <section>
              <h1 className="text-2xl font-bold text-white">{exercise.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                {exercise.primaryMuscles.map((muscle) => (
                  <Badge key={`primary-${muscle}`} variant="blue" className="capitalize">
                    {muscle}
                  </Badge>
                ))}
                {exercise.secondaryMuscles.map((muscle) => (
                  <Badge key={`secondary-${muscle}`} className="capitalize">
                    {muscle}
                  </Badge>
                ))}
              </div>
            </section>

            {sessionsForExercise.length === 0 ? (
              <EmptyState
                title="No recorded data"
                description="Complete at least one logged set for this exercise to view performance trends."
              />
            ) : (
              <>
            <section>
              <h2 className="text-sm font-semibold text-gray-text uppercase tracking-wider">
                Performance
              </h2>
              <h1 className="text-lg font-semibold text-white-text uppercase tracking-wider mb-3">
                Estimated 1RM Trend
              </h1>
              <Card className="mt-2">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-text">Current Estimated 1RM</p>
                      <p className="mt-1 text-2xl font-bold text-white-primary">
                        {currentEstimatedOneRm ? Math.round(currentEstimatedOneRm) : '—'}
                        {currentEstimatedOneRm && <span className="ml-1 text-sm font-medium text-gray-text">{weightUnit}</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-text">Best 1RM</p>
                      <p className="mt-1 text-2xl font-bold text-white-primary">
                        {Math.round(displayedBestEstimatedOneRm)}
                        <span className="ml-1 text-sm font-medium text-gray-text">{weightUnit}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-text">Best Working Weight</p>
                      <p className="mt-1 text-2xl font-bold text-white-primary">
                        {displayedBestWeight.toFixed(1)}
                        <span className="ml-1 text-sm font-medium text-gray-text">{weightUnit}</span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <ExerciseProgressChart
                      points={chartPoints}
                      width={480}
                      height={240}
                      xTickDays={10}
                      xDomain={[sixtyDaysAgoTimestamp, nowTimestamp]}
                    />
                  </div>
                </div>
              </Card>
            </section>

            <div className="grid grid-cols-2 gap-3">
              <Card variant="outlined" padding="sm">
                <p className="text-xs text-gray-text">Logged Sessions</p>
                <p className="text-xl font-semibold text-white mt-1">{sessionsForExercise.length}</p>
              </Card>

              <Card variant="outlined" padding="sm">
                <p className="text-xs text-gray-text">Last Performed</p>
                <p className="text-xl font-semibold text-white mt-1">
                  {latestEntry ? formatDate(new Date(latestEntry.session.date)) : '-'}
                </p>
              </Card>
            </div>

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
                  </div>
                </div>
                <div>
                  <WorkoutCalendar days={last9Weeks} unit={weightUnit} />
                </div>
              </Card>
            </section>

            <Card variant="outlined" padding="sm">
              <p className="text-sm text-gray-text mb-2">Recent Sessions</p>
              <div className="space-y-2">
                {[...sessionsForExercise]
                  .reverse()
                  .slice(0, 8)
                  .map((item) => {
                    return (
                      <div
                        key={item.session.id}
                        className="flex items-center justify-between rounded-lg bg-dark-700 px-3 py-2"
                      >
                        <span className="text-sm text-white">
                          {formatDate(new Date(item.session.date))}
                        </span>
                        <span className="text-xs text-gray-text">
                          {item.bestSet.completedReps} x {formatWeight(item.bestSet.weight, weightUnit)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </Card>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
