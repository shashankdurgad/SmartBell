import { useState, useMemo } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/shared/Card';
import { Input } from '../components/shared/Input';
import { Badge } from '../components/shared/Badge';
import { Spinner } from '../components/shared/Spinner';
import { EmptyState } from '../components/shared/EmptyState';
import { useExercises } from '../hooks/useExercises';

export function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('');
  const { exercises, isLoading, totalCount } = useExercises();

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

    return result;
  }, [exercises, searchQuery, selectedMuscle]);

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
              <Card key={exercise.id} variant="outlined" padding="sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-white">{exercise.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
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
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
