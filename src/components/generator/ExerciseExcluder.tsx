import { useState, useEffect } from 'react';
import { Input } from '../shared/Input';
import { db } from '../../database/db';
import type { Exercise } from '../../types';

interface ExerciseExcluderProps {
  value: string[];
  onChange: (excludedIds: string[]) => void;
}

export function ExerciseExcluder({ value, onChange }: ExerciseExcluderProps) {
  const [search, setSearch] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    db.exercises.toArray().then(setExercises);
  }, []);

  const filteredExercises = search.length >= 2
    ? exercises.filter((ex) =>
        ex.name.toLowerCase().includes(search.toLowerCase()) &&
        !value.includes(ex.id)
      ).slice(0, 8)
    : [];

  const excludedExercises = exercises.filter((ex) => value.includes(ex.id));

  const addExclusion = (id: string) => {
    onChange([...value, id]);
    setSearch('');
    setIsOpen(false);
  };

  const removeExclusion = (id: string) => {
    onChange(value.filter((e) => e !== id));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-400">Exclude Exercises</h3>
        {value.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <p className="text-xs text-zinc-500 mb-3">
        Search and exclude exercises you want to avoid
      </p>

      {/* Search input */}
      <div className="relative">
        <Input
          placeholder="Search exercises to exclude..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />

        {/* Dropdown results */}
        {isOpen && filteredExercises.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 rounded-xl border border-zinc-700 bg-zinc-800 shadow-lg overflow-hidden max-h-48 overflow-y-auto">
            {filteredExercises.map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => addExclusion(ex.id)}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-between"
                >
                  <span>{ex.name}</span>
                  <span className="text-xs text-zinc-500">{ex.equipment}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {isOpen && search.length >= 2 && filteredExercises.length === 0 && (
          <div className="absolute z-10 w-full mt-1 rounded-xl border border-zinc-700 bg-zinc-800 shadow-lg px-4 py-3">
            <p className="text-xs text-zinc-500 text-center">No exercises match "{search}"</p>
          </div>
        )}
      </div>

      {/* Excluded exercise tags */}
      {excludedExercises.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {excludedExercises.map((ex) => (
            <span
              key={ex.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400"
            >
              {ex.name}
              <button
                type="button"
                onClick={() => removeExclusion(ex.id)}
                className="hover:text-red-300 transition-colors"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}