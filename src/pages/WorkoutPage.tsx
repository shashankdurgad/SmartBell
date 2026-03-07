
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/shared/Card';
import { EmptyState } from '../components/shared/EmptyState';
import { Button } from '../components/shared/Button';
import { Modal } from '../components/shared/Modal';
import { useWeeklyPlanStore } from '../stores/useWeeklyPlanStore';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useUserStore } from '../stores/useUserStore';
import { formatDate, formatDuration, formatVolume } from '../utils/formatters';
import { useEffect, useState } from 'react';
import type { DailyWorkout } from '../types';

export function WorkoutPage() {
  const navigate = useNavigate();
  const { activePlan } = useWeeklyPlanStore();
  const { history, loadHistory, startSession, activeSession, cancelSession } = useWorkoutStore();
  const { weightUnit } = useUserStore();
  const [showReplaceWorkoutModal, setShowReplaceWorkoutModal] = useState(false);
  const [pendingWorkout, setPendingWorkout] = useState<DailyWorkout | null>(null);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const startWorkout = (day: DailyWorkout) => {
    startSession({
      weeklyPlanId: activePlan!.id,
      dailyWorkoutId: day.id,
      dayNumber: day.dayNumber,
      dayName: day.name,
      date: new Date(),
      startTime: new Date(),
      exercises: day.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        targetSets: ex.sets,
        sets: [],
      })),
    });
    navigate('/workout/active');
  };

  const handleStart = (day: DailyWorkout) => {
    if (activeSession) {
      setPendingWorkout(day);
      setShowReplaceWorkoutModal(true);
      return;
    }
    startWorkout(day);
  };

  const handleConfirmReplaceWorkout = () => {
    if (!pendingWorkout) return;
    cancelSession();
    startWorkout(pendingWorkout);
    setPendingWorkout(null);
    setShowReplaceWorkoutModal(false);
  };

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Workout" />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {activePlan ? (
          <>
            <section>
              <h2 className="text-sm font-semibold text-gray-text uppercase tracking-wider mb-3">
                {activePlan.name}
              </h2>
              <div className="space-y-3">
                {activePlan.workouts.map((day, index) => (
                  <Card key={day.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-blue-primary/20 flex items-center justify-center text-sm font-bold text-blue-primary">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-white">{day.name}</p>
                          <p className="text-sm text-gray-text">
                            {day.exercises.length} exercises · ~{day.estimatedDuration}min
                          </p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleStart(day)}>
                        Start
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {day.targetMuscles.slice(0, 5).map((muscle) => (
                        <span
                          key={muscle}
                          className="text-xs px-2 py-0.5 rounded-full bg-dark-600 text-gray-text capitalize"
                        >
                          {muscle}
                        </span>
                      ))}
                      {day.targetMuscles.length > 5 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-dark-600 text-gray-text">
                          +{day.targetMuscles.length - 5}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {history.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-text uppercase tracking-wider mb-3">
                  Recent Sessions
                </h2>
                <div className="space-y-2">
                  {history.slice(0, 5).map((session) => (
                    <Card key={session.id} padding="sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{session.dayName}</p>
                          <p className="text-sm text-gray-text">
                            {formatDate(new Date(session.date))} · {formatDuration(session.duration)}
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
              </section>
            )}
          </>
        ) : (
          <Card variant="elevated">
            <EmptyState
              icon={
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              }
              title="No Active Plan"
              description="Generate a workout plan first, then come back here to start logging."
              action={
                <Button onClick={() => navigate('/generator')}>
                  Generate Plan
                </Button>
              }
            />
          </Card>
        )}
      </div>

      <Modal
        isOpen={showReplaceWorkoutModal}
        onClose={() => {
          setShowReplaceWorkoutModal(false);
          setPendingWorkout(null);
        }}
        title="Start New Workout?"
      >
        <p className="text-gray-text text-sm mb-4">
          Starting a new workout will end your current workout and discard its unsaved progress.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setShowReplaceWorkoutModal(false);
              setPendingWorkout(null);
            }}
          >
            Keep Current
          </Button>
          <Button variant="danger" fullWidth onClick={handleConfirmReplaceWorkout}>
            End And Start New
          </Button>
        </div>
      </Modal>
    </div>
  );
}
