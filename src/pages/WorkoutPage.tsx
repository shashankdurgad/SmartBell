import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/shared/Card';
import { EmptyState } from '../components/shared/EmptyState';
import { Button } from '../components/shared/Button';
import { useNavigate } from 'react-router-dom';
import { useWeeklyPlanStore } from '../stores/useWeeklyPlanStore';

export function WorkoutPage() {
  const navigate = useNavigate();
  const { activePlan } = useWeeklyPlanStore();

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Workout" />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {activePlan ? (
          <>
            <h2 className="text-sm font-semibold text-gray-text uppercase tracking-wider">
              Today's Workout
            </h2>
            <div className="space-y-3">
              {activePlan.workouts.map((day, index) => (
                <Card
                  key={day.id}
                  variant="outlined"
                  className="cursor-pointer hover:border-blue-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-blue-primary/20 flex items-center justify-center text-sm font-bold text-blue-primary">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-white">{day.name}</p>
                          <p className="text-sm text-gray-text">
                            {day.exercises.length} exercises &middot; ~{day.estimatedDuration}min
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="secondary">Start</Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {day.targetMuscles.slice(0, 5).map((muscle) => (
                      <span
                        key={muscle}
                        className="text-xs px-2 py-0.5 rounded-full bg-dark-600 text-gray-text"
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
              description="Generate a workout plan first, then come back here to start logging your workouts."
              action={
                <Button onClick={() => navigate('/generator')}>
                  Generate Plan
                </Button>
              }
            />
          </Card>
        )}
      </div>
    </div>
  );
}
