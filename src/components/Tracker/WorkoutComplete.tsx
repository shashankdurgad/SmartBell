import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { formatDuration, formatVolume, formatWeight } from '../../utils/formatters';
import { useUserStore } from '../../stores/useUserStore';
import type { WorkoutSession } from '../../types';

export function WorkoutComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const { weightUnit } = useUserStore();
  const session = location.state?.session as WorkoutSession | undefined;

  if (!session) {
    navigate('/workout');
    return null;
  }

  const totalExercises = session.exercises.length;
  const prs = session.exercises.filter((e) => e.personalRecord);

  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      <div className="max-w-lg mx-auto px-4 py-12 space-y-6">

        <div className="text-center space-y-2">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-white">Workout Complete!</h1>
          <p className="text-gray-text">{session.dayName}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card variant="elevated" padding="sm" className="text-center">
            <p className="text-2xl font-bold text-blue-primary">{formatDuration(session.duration)}</p>
            <p className="text-xs text-gray-text mt-1">Duration</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <p className="text-2xl font-bold text-green-accent">{session.totalSets}</p>
            <p className="text-xs text-gray-text mt-1">Sets</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <p className="text-2xl font-bold text-yellow-accent">{formatVolume(session.totalVolume, weightUnit)}</p>
            <p className="text-xs text-gray-text mt-1">Volume</p>
          </Card>
        </div>

        {prs.length > 0 && (
          <Card variant="outlined" className="space-y-3">
            <h3 className="font-semibold text-white">Personal Records 🏆</h3>
            <div className="space-y-2">
              {prs.map((ex, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-text">{ex.exerciseId.replace(/_/g, ' ')}</span>
                  <Badge variant="yellow">PR {ex.personalRecord}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card variant="outlined" className="space-y-3">
          <h3 className="font-semibold text-white">Exercises ({totalExercises})</h3>
          <div className="space-y-2">
            {session.exercises.map((ex, i) => {
              const workingSets = ex.sets.filter((s) => !s.isWarmup);
              const topSet = workingSets.reduce(
                (best, s) => (s.weight > best.weight ? s : best),
                workingSets[0]
              );
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-text">{ex.exerciseId.replace(/_/g, ' ')}</span>
                  <div className="text-right">
                    <span className="text-white font-medium">{workingSets.length} sets</span>
                    {topSet && (
                      <span className="text-gray-text ml-2">
                        top: {formatWeight(topSet.weight, weightUnit)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-3">
          <Button fullWidth size="lg" onClick={() => navigate('/workout')}>
            Back to Workouts
          </Button>
          <Button fullWidth variant="secondary" onClick={() => navigate('/')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}