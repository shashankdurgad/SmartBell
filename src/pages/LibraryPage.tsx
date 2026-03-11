import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/shared/Card';
import { Input } from '../components/shared/Input';
import { Badge } from '../components/shared/Badge';
import { Spinner } from '../components/shared/Spinner';
import { EmptyState } from '../components/shared/EmptyState';
import { useExercises } from '../hooks/useExercises';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import type { WorkoutSession } from '../types';

export function LibraryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('');
  const [showHistoryOnly, setShowHistoryOnly] = useState(false);
  const { exercises, isLoading, totalCount } = useExercises();
  const { history, loadHistory } = useWorkoutStore();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const hasRecordedDataForExercise = (session: WorkoutSession, exerciseId: string): boolean => {
    const exercise = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!exercise) return false;

    return exercise.sets.some(
      (set) => !set.isWarmup && (set.weight ?? 0) > 0 && (set.completedReps ?? 0) > 0
    );
  };

  const exerciseIdsWithData = useMemo(() => {
    const ids = new Set<string>();

    for (const session of history) {
      for (const exercise of session.exercises) {
        if (hasRecordedDataForExercise(session, exercise.exerciseId)) {
          ids.add(exercise.exerciseId);
        }
      }
    }

    return ids;
  }, [history]);

  const filtered = useMemo(() => {
    let result = exercises;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((ex) => ex.name.toLowerCase().includes(q));
    }

    if (selectedMuscle) {
      result = result.filter((ex) =>
        ex.primaryMuscles.includes(selectedMuscle as never)
      );
    }

    if (showHistoryOnly) {
      result = result.filter((ex) => exerciseIdsWithData.has(ex.id));
    }

    return result;
  }, [exercises, searchQuery, selectedMuscle, showHistoryOnly, exerciseIdsWithData]);

  const muscleGroups = [
    'chest', 'lats', 'shoulders', 'biceps', 'triceps', 'quadriceps',
    'hamstrings', 'glutes', 'calves', 'abdominals', 'traps', 'forearms',
  ];

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Exercise Library" />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <Input
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <button
          type="button"
          onClick={() => setShowHistoryOnly((prev) => !prev)}
          className={`w-full flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors ${
            showHistoryOnly
              ? 'border-blue-primary bg-blue-primary/15 text-blue-light'
              : 'border-dark-600 bg-dark-800 text-gray-text hover:border-dark-500'
          }`}
          aria-pressed={showHistoryOnly}
        >
          <span>Show only exercises with history</span>
          <span
            className={`inline-flex h-5 w-10 items-center rounded-full p-0.5 transition-colors ${
              showHistoryOnly ? 'bg-blue-primary' : 'bg-dark-600'
            }`}
            aria-hidden="true"
          >
            <span
              className={`h-4 w-4 rounded-full bg-white transition-transform ${
                showHistoryOnly ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </span>
        </button>

        {/* Muscle filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <button
            onClick={() => setSelectedMuscle('')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !selectedMuscle
                ? 'bg-blue-primary text-white'
                : 'bg-dark-700 text-gray-text hover:bg-dark-600'
            }`}
          >
            All
          </button>
          {muscleGroups.map((muscle) => (
            <button
              key={muscle}
              onClick={() => setSelectedMuscle(muscle === selectedMuscle ? '' : muscle)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                muscle === selectedMuscle
                  ? 'bg-blue-primary text-white'
                  : 'bg-dark-700 text-gray-text hover:bg-dark-600'
              }`}
            >
              {muscle}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-text">
          {totalCount > 0 ? `${filtered.length} of ${totalCount} exercises` : 'No exercises loaded'}
        </p>

        {isLoading ? (
          <Spinner className="py-8" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={totalCount === 0 ? 'No exercises loaded' : 'No matches found'}
            description={
              totalCount === 0
                ? 'Exercise database will be loaded when data is available.'
                : 'Try adjusting your search or filters.'
            }
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((exercise) => (
              <Card
                key={exercise.id}
                variant="outlined"
                padding="sm"
                className={exerciseIdsWithData.has(exercise.id) ? 'cursor-pointer hover:border-blue-primary/70 transition-colors' : ''}
                role={exerciseIdsWithData.has(exercise.id) ? 'button' : undefined}
                tabIndex={exerciseIdsWithData.has(exercise.id) ? 0 : undefined}
                onClick={
                  exerciseIdsWithData.has(exercise.id)
                    ? () => navigate(`/library/exercise/${encodeURIComponent(exercise.id)}`)
                    : undefined
                }
                onKeyDown={
                  exerciseIdsWithData.has(exercise.id)
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigate(`/library/exercise/${encodeURIComponent(exercise.id)}`);
                        }
                      }
                    : undefined
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-white">{exercise.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {exerciseIdsWithData.has(exercise.id) && (
                        <Badge variant='purple'>Has history</Badge>
                      )}
                      {exercise.mechanic && (
                        <Badge variant={exercise.mechanic === 'compound' ? 'blue' : 'default'}>
                          {exercise.mechanic}
                        </Badge>
                      )}
                      <Badge>{exercise.level}</Badge>
                      {exercise.equipment && (
                        <Badge variant="green">{exercise.equipment}</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {exercise.primaryMuscles.map((m) => (
                        <span key={m} className="text-xs text-blue-light capitalize">{m}</span>
                      ))}
                      {exercise.secondaryMuscles.length > 0 && (
                        <>
                          <span className="text-xs text-gray-text">&middot;</span>
                          {exercise.secondaryMuscles.slice(0, 3).map((m) => (
                            <span key={m} className="text-xs text-gray-text capitalize">{m}</span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {exerciseIdsWithData.has(exercise.id) && (
                    <span className="ml-3 mt-1 text-blue-light" aria-hidden="true">
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                      </svg>
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
