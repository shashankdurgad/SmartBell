import { useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Input } from '../shared/Input';
import type { WeeklyPlan, RoutineExercise } from '../../types';
import { useExercises } from '../../hooks/useExercises';
import { Modal } from '../shared/Modal';
import { Spinner } from '../shared/Spinner';
import type { Exercise, MuscleGroup } from '../../types';
import { ALL_MUSCLE_GROUPS } from '../../types/exercise.types';
import { useUserStore } from '../../stores/useUserStore';
import { calcWorkoutDuration } from '../../utils/calculations';

interface SortableExerciseItemProps {
  id: string;
  exercise: RoutineExercise;
  onRemove: () => void;
  onEdit: () => void;
}

function SortableExerciseItem({ id, exercise, onRemove, onEdit }: SortableExerciseItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    transition: {
      duration: 250,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : 'auto',
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded bg-zinc-800 p-2 text-sm transition-shadow duration-200 ${
        isDragging ? 'shadow-lg shadow-blue-950/40' : 'shadow-none'
      }`}
    >
      <button
        className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none p-1 text-zinc-500 hover:text-zinc-300"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="7" cy="5" r="1.2" /><circle cx="13" cy="5" r="1.2" />
          <circle cx="7" cy="10" r="1.2" /><circle cx="13" cy="10" r="1.2" />
          <circle cx="7" cy="15" r="1.2" /><circle cx="13" cy="15" r="1.2" />
        </svg>
      </button>
      <button className="flex-1 min-w-0 text-left hover:opacity-80" onClick={onEdit}>
        <div className="text-zinc-200">{exercise.exerciseName.replace(/_/g, ' ')}</div>
        <div className="text-xs text-zinc-500">
          {exercise.sets} × {exercise.reps} Reps
        </div>
      </button>
      <Button variant="danger" size="sm" onClick={onRemove} className="flex-shrink-0">
        Remove
      </Button>
    </li>
  );
}

function calcEstimatedDuration(exercises: RoutineExercise[], trainingStyle: string, defaultRestSeconds: number): number {
  return calcWorkoutDuration(exercises, trainingStyle, defaultRestSeconds);
}

interface PlanEditorProps {
  plan: WeeklyPlan;
  onSave: (updatedPlan: WeeklyPlan) => Promise<void>;
  onCancel: () => void;
}

export function PlanEditor({ plan, onSave, onCancel }: PlanEditorProps) {
  const [editedPlan, setEditedPlan] = useState<WeeklyPlan>(plan);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState<{ dayIndex: number; exerciseIndex: number } | null>(null);
  const [editSets, setEditSets] = useState('');
  const [editReps, setEditReps] = useState('');

  const defaultRestSeconds = useUserStore((state) => state.defaultRestSeconds);
  const exerciseSortableIdsRef = useRef(new WeakMap<RoutineExercise, string>());
  const exerciseSortableIdCounterRef = useRef(0);

  const getExerciseSortableId = (exercise: RoutineExercise) => {
    const existingId = exerciseSortableIdsRef.current.get(exercise);
    if (existingId) {
      return existingId;
    }

    exerciseSortableIdCounterRef.current += 1;
    const nextId = `${exercise.exerciseId}-${exerciseSortableIdCounterRef.current}`;
    exerciseSortableIdsRef.current.set(exercise, nextId);
    return nextId;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleReorderExercises = (dayIndex: number, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setEditedPlan((prev) => ({
      ...prev,
      workouts: prev.workouts.map((workout, idx) => {
        if (idx !== dayIndex) return workout;
        const oldIndex = workout.exercises.findIndex((exercise) => getExerciseSortableId(exercise) === active.id);
        const newIndex = workout.exercises.findIndex((exercise) => getExerciseSortableId(exercise) === over.id);
        if (oldIndex === -1 || newIndex === -1) {
          return workout;
        }
        return { ...workout, exercises: arrayMove(workout.exercises, oldIndex, newIndex) };
      }),
    }));
  };
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
  const { exercises, isLoading } = useExercises({ muscles: selectedMuscles.length > 0 ? selectedMuscles : undefined, searchQuery });

  const handleRemoveExercise = (dayIndex: number, exerciseIndex: number) => {
    setEditedPlan((prev) => {
      const workouts = prev.workouts.map((workout, idx) => {
        if (idx !== dayIndex) return workout;
        const exercises = workout.exercises.filter((_, j) => j !== exerciseIndex);
        return {
          ...workout,
          exercises,
          estimatedDuration: calcEstimatedDuration(exercises, prev.trainingStyle, defaultRestSeconds),
        };
      });
      return {
        ...prev,
        workouts,
        estimatedWeeklyDuration: workouts.reduce((sum, w) => sum + w.estimatedDuration, 0),
      };
    });
  };

  const handleAddExercise = (dayIndex: number, exercise: Exercise) => {
    const newExercise: RoutineExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: 3,
      reps: '8-12',
      restSeconds: defaultRestSeconds,
    };

    setEditedPlan((prev) => {
      const workouts = prev.workouts.map((workout, idx) => {
        if (idx !== dayIndex) return workout;
        const exercises = [...workout.exercises, newExercise];
        return {
          ...workout,
          exercises,
          estimatedDuration: calcEstimatedDuration(exercises, prev.trainingStyle, defaultRestSeconds),
        };
      });
      return {
        ...prev,
        workouts,
        estimatedWeeklyDuration: workouts.reduce((sum, w) => sum + w.estimatedDuration, 0),
      };
    });
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

  const openEditExercise = (dayIndex: number, exerciseIndex: number) => {
    const ex = editedPlan.workouts[dayIndex].exercises[exerciseIndex];
    setEditSets(String(ex.sets));
    setEditReps(ex.reps);
    setEditingExercise({ dayIndex, exerciseIndex });
  };

  const handleUpdateExercise = () => {
    if (!editingExercise) return;
    const { dayIndex, exerciseIndex } = editingExercise;
    const sets = Math.max(1, parseInt(editSets, 10) || 1);
    const reps = editReps.trim() || '8-12';
    setEditedPlan((prev) => {
      const workouts = prev.workouts.map((workout, idx) => {
        if (idx !== dayIndex) return workout;
        const exercises = workout.exercises.map((ex, j) =>
          j === exerciseIndex ? { ...ex, sets, reps } : ex
        );
        return {
          ...workout,
          exercises,
          estimatedDuration: calcEstimatedDuration(exercises, prev.trainingStyle, defaultRestSeconds),
        };
      });
      return {
        ...prev,
        workouts,
        estimatedWeeklyDuration: workouts.reduce((sum, w) => sum + w.estimatedDuration, 0),
      };
    });
    setEditingExercise(null);
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

      {/* Day List — editor replaces the card inline */}
      <div className="space-y-2">
        {editedPlan.workouts.map((day, dayIndex) =>
          selectedDayIndex === dayIndex ? (
            <Card key={day.id} className="border-blue-500 bg-blue-950">
              {/* Header row with back button */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-white">{day.name}</h3>
                  <p className="text-xs text-zinc-400">
                    {day.targetMuscles.join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDayIndex(null)}
                  className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-zinc-700"
                >
                  ✕ Close
                </button>
              </div>

              {day.exercises.length === 0 ? (
                <p className="text-sm text-zinc-500 mb-4">No exercises added yet</p>
              ) : (
                <DndContext
                  sensors={sensors}
                  onDragEnd={(event) => handleReorderExercises(dayIndex, event)}
                >
                  <SortableContext
                    items={day.exercises.map((exercise) => getExerciseSortableId(exercise))}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul className="space-y-2 mb-4">
                      {day.exercises.map((ex, i) => (
                        <SortableExerciseItem
                          key={getExerciseSortableId(ex)}
                          id={getExerciseSortableId(ex)}
                          exercise={ex}
                          onRemove={() => handleRemoveExercise(dayIndex, i)}
                          onEdit={() => openEditExercise(dayIndex, i)}
                        />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAddExercise(true)}
                className="w-full"
              >
                + Add Exercise
              </Button>
            </Card>
          ) : (
            <Card
              key={day.id}
              className="cursor-pointer transition-colors hover:bg-zinc-800"
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
          )
        )}
      </div>

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

      {/* Edit Exercise Modal */}
      <Modal isOpen={editingExercise !== null} onClose={() => setEditingExercise(null)}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">
            {editingExercise !== null
              ? editedPlan.workouts[editingExercise.dayIndex].exercises[editingExercise.exerciseIndex].exerciseName.replace(/_/g, ' ')
              : ''}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-light mb-1">Sets</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={editSets}
                onChange={(e) => setEditSets(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-light mb-1">Reps</label>
              <Input
                type="text"
                placeholder="e.g. 8-12"
                value={editReps}
                onChange={(e) => setEditReps(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setEditingExercise(null)}>
              Cancel
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleUpdateExercise}>
              Apply
            </Button>
          </div>
        </div>
      </Modal>

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
