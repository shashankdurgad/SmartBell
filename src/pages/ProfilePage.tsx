import { useState, useEffect } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/shared/Card';
import { Input } from '../components/shared/Input';
import { Button } from '../components/shared/Button';
import { TrainingStylePicker } from '../components/generator/TrainingStylePicker';
import { DifficultyPicker } from '../components/generator/DifficultyPicker';
import { EquipmentPicker } from '../components/generator/EquipmentPicker';
import { DaySelector } from '../components/generator/DaySelector';
import { DurationSlider } from '../components/generator/DurationSlider';
import { ExerciseExcluder } from '../components/generator/ExerciseExcluder';
import { db } from '../database/db';
import { useUserStore } from '../stores/useUserStore';
import { useWeeklyPlanStore } from '../stores/useWeeklyPlanStore';
import type { UserPreferences } from '../database/db';
import { weeklyPlanRepo } from '../database/repositories/weeklyPlanRepo';
import { calcWorkoutDuration } from '../utils/calculations';

const REST_PRESETS = [
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '120s', value: 120 },
  { label: '180s', value: 180 },
];

export function ProfilePage() {
  const setDefaultRestSeconds = useUserStore((s) => s.setDefaultRestSeconds);
  const loadPlans = useWeeklyPlanStore((s) => s.loadPlans);
  const [trainingStyle, setTrainingStyle] = useState<'strength' | 'hypertrophy' | 'endurance'>('hypertrophy');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [timePerSession, setTimePerSession] = useState(45);
  const [restTimer, setRestTimer] = useState(120);
  const [excludedExercises, setExcludedExercises] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  // Load saved preferences
  useEffect(() => {
    db.userPreferences.get('default').then((prefs) => {
      if (!prefs) return;
      setTrainingStyle(prefs.trainingStyle);
      setDifficulty(prefs.difficulty);
      setEquipment(prefs.availableEquipment);
      setDaysPerWeek(prefs.daysPerWeek);
      setTimePerSession(prefs.timePerSession);
      setRestTimer(prefs.defaultRestTimer ?? 120);
      setExcludedExercises(prefs.excludedExercises ?? []);
    });
  }, []);

  const handleSave = async () => {
    const prefs: UserPreferences = {
      id: 'default',
      trainingStyle,
      difficulty,
      availableEquipment: equipment,
      daysPerWeek,
      timePerSession,
      defaultRestTimer: restTimer,
      excludedExercises,
    };

    await db.userPreferences.put(prefs);
    // Keep workout rest timer settings in sync with profile preference.
    await setDefaultRestSeconds(restTimer);

    // Recalculate estimated durations for all stored plans using the new rest time.
    const allPlans = await weeklyPlanRepo.getAll();
    for (const plan of allPlans) {
      const workouts = plan.workouts.map((w) => ({
        ...w,
        estimatedDuration: calcWorkoutDuration(w.exercises, plan.trainingStyle, restTimer),
      }));
      await weeklyPlanRepo.save({
        ...plan,
        workouts,
        estimatedWeeklyDuration: workouts.reduce((sum, w) => sum + w.estimatedDuration, 0),
      });
    }

    // Refresh the in-memory store so the Workout page reflects the new durations.
    await loadPlans();

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Profile" />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card>
          <TrainingStylePicker value={trainingStyle} onChange={setTrainingStyle} />
        </Card>

        <Card>
          <DifficultyPicker value={difficulty} onChange={setDifficulty} />
        </Card>

        <Card>
          <DaySelector value={daysPerWeek} onChange={setDaysPerWeek} />
        </Card>

        <Card>
          <DurationSlider value={timePerSession} onChange={setTimePerSession} />
        </Card>

        <Card>
          <EquipmentPicker value={equipment} onChange={setEquipment} />
        </Card>

        {/* Rest Timer */}
        <Card>
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Default Rest Timer</h3>
          <p className="text-xs text-zinc-500 mb-3">
            Time between sets during workouts
          </p>
          <div className="flex gap-2">
            {REST_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setRestTimer(preset.value)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  restTimer === preset.value
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <Input
              label="Custom (seconds)"
              type="number"
              min={15}
              max={300}
              value={restTimer}
              onChange={(e) => setRestTimer(Number(e.target.value))}
            />
          </div>
        </Card>

        {/* Excluded Exercises */}
        <Card>
          <ExerciseExcluder
            value={excludedExercises}
            onChange={setExcludedExercises}
          />
        </Card>

        <Button fullWidth size="lg" onClick={handleSave}>
          {saved ? '✓ Saved' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}