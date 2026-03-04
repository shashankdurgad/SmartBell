import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import type { WeeklyPlan } from '../../types';

interface PlanPreviewProps {
  plan: WeeklyPlan;
  onRegenerate: () => void;
  regenerateLabel?: string;
  showRegenerateButton?: boolean;
  onSetActive?: () => void;
  onDelete?: () => void;
}

export function PlanPreview({ plan, onRegenerate, regenerateLabel = 'Regenerate', showRegenerateButton = true, onSetActive, onDelete }: PlanPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
        <Badge variant="blue">{plan.trainingStyle}</Badge>
      </div>

      {plan.workouts.map((day) => (
        <Card key={day.id}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-white">{day.name}</h3>
            <span className="text-xs text-zinc-500">
              ~{day.estimatedDuration} min
            </span>
          </div>
          <ul className="space-y-1">
            {day.exercises.map((ex, j) => (
              <li key={j} className="flex justify-between text-sm">
                <span className="text-zinc-300">{ex.exerciseName}</span>
                <span className="text-zinc-500">
                  {ex.sets} × {ex.reps}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ))}

      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{plan.daysPerWeek} days/week</span>
        <span>~{plan.estimatedWeeklyDuration} min/week</span>
      </div>

      <div className="flex gap-2">
        {onSetActive && (
          <Button variant="primary" onClick={onSetActive} className="flex-1">
            Set Active
          </Button>
        )}
        {onDelete && (
          <Button variant="danger" onClick={onDelete} className="flex-1">
            Delete
          </Button>
        )}
        {showRegenerateButton && (
          <Button variant="secondary" onClick={onRegenerate} className="flex-1">
            {regenerateLabel}
          </Button>
        )}
      </div>
    </div>
  );
}