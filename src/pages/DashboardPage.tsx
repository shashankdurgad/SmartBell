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
                        Vol: {formatVolume(session.totalVolume)}
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
