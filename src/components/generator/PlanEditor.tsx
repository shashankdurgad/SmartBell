import { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Input } from '../shared/Input';
import type { WeeklyPlan, DailyWorkout, RoutineExercise } from '../../types';
import { useExercises } from '../../hooks/useExercises';
import { Modal } from '../shared/Modal';
import { Spinner } from '../shared/Spinner';
import type { Exercise, MuscleGroup } from '../../types';
import { ALL_MUSCLE_GROUPS } from '../../types/exercise.types';

interface PlanEditorProps {
  plan: WeeklyPlan;
  onSave: (updatedPlan: WeeklyPlan) => Promise<void>;
  onCancel: () => void;
}

export function PlanEditor({ plan, onSave, onCancel }: PlanEditorProps) {
  const [editedPlan, setEditedPlan] = useState<WeeklyPlan>(plan);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
  const { exercises, isLoading } = useExercises({ muscles: selectedMuscles.length > 0 ? selectedMuscles : undefined, searchQuery });

  const handleRemoveExercise = (dayIndex: number, exerciseIndex: number) => {
    setEditedPlan((prev) => ({
      ...prev,
      workouts: prev.workouts.map((workout, idx) =>
        idx === dayIndex
          ? {
              ...workout,
              exercises: workout.exercises.filter((_, j) => j !== exerciseIndex),
            }
          : workout
      ),
    }));
  };

  const handleAddExercise = (dayIndex: number, exercise: Exercise) => {
    const newExercise: RoutineExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: 3,
      reps: '8-12',
      restSeconds: 60,
    };

    setEditedPlan((prev) => ({
      ...prev,
      workouts: prev.workouts.map((workout, idx) =>
        idx === dayIndex
          ? {
              ...workout,
              exercises: [...workout.exercises, newExercise],
            }
          : workout
      ),
    }));
    setShowAddExercise(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedPlan);
    } finally {
      setIsSaving(false);
    }
  };

  const currentDay = selectedDayIndex !== null ? editedPlan.workouts[selectedDayIndex] : null;
  const filteredExercises = exercises.filter((exercise) =>
    searchQuery === '' || exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const toggleMuscle = (muscle: MuscleGroup) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Edit {editedPlan.name}</h2>
        <Badge variant="blue">{editedPlan.trainingStyle}</Badge>
      </div>

      {/* Day List */}
      <div className="space-y-2">
        {editedPlan.workouts.map((day, dayIndex) => (
          <Card
            key={day.id}
            className={`cursor-pointer transition-colors ${
              selectedDayIndex === dayIndex
                ? 'bg-blue-900 border-blue-500'
                : 'hover:bg-zinc-800'
            }`}
            onClick={() => setSelectedDayIndex(dayIndex)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-white">{day.name}</h3>
                <p className="text-xs text-zinc-500">
                  {day.exercises.length} exercises
                </p>
              </div>
              <span className="text-xs text-zinc-500">~{day.estimatedDuration} min</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Day Editor */}
      {currentDay && (
        <Card className="border-blue-500 bg-blue-950">
          <div className="mb-4">
            <h3 className="font-medium text-white mb-2">{currentDay.name}</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Target muscles: {currentDay.targetMuscles.join(', ')}
            </p>

            {currentDay.exercises.length === 0 ? (
              <p className="text-sm text-zinc-500 mb-4">No exercises added yet</p>
            ) : (
              <ul className="space-y-2 mb-4">
                {currentDay.exercises.map((ex, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between bg-zinc-800 p-2 rounded text-sm"
                  >
                    <div className="flex-1">
                      <div className="text-zinc-200">{ex.exerciseName.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-zinc-500">
                        {ex.sets} × {ex.reps} • {ex.restSeconds}s rest
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveExercise(selectedDayIndex, i)}
                      className="ml-2"
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAddExercise(true)}
              className="w-full"
            >
              + Add Exercise
            </Button>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          className="flex-1"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Add Exercise Modal */}
      <Modal isOpen={showAddExercise} onClose={() => setShowAddExercise(false)}>
        <div className="space-y-4 flex flex-col max-h-[80vh]">
          <h3 className="text-lg font-semibold text-white">Add Exercise to {currentDay?.name}</h3>

          {/* Search Input */}
          <Input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm"
          />

          {/* Muscle Group Filter */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-light">Filter by Muscle Group:</p>
            <div className="flex flex-wrap gap-2">
              {ALL_MUSCLE_GROUPS.map((muscle) => (
                <button
                  key={muscle}
                  onClick={() => toggleMuscle(muscle)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedMuscles.includes(muscle)
                      ? 'bg-blue-primary text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {muscle}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise List */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <p className="text-sm">No exercises found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1 pr-2">
              {filteredExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => {
                    handleAddExercise(selectedDayIndex!, exercise);
                    setSearchQuery('');
                    setSelectedMuscles([]);
                  }}
                  className="w-full text-left p-3 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
                >
                  <div className="font-medium text-white text-sm">
                    {exercise.name.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {exercise.primaryMuscles.join(', ')}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
