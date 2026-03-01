import { useState, useEffect } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { TrainingStylePicker } from './TrainingStylePicker';
import { EquipmentPicker } from './EquipmentPicker';
import { DaySelector } from './DaySelector';
import { DurationSlider } from './DurationSlider';
import { ExerciseExcluder } from './ExerciseExcluder';
import { weeklyPlanConstraintsSchema, type WeeklyPlanConstraints } from '../../utils/validators';
import { db } from '../../database/db';

interface GeneratorFormProps {
  onSubmit: (constraints: WeeklyPlanConstraints) => void;
  loading: boolean;
}

export function GeneratorForm({ onSubmit, loading }: GeneratorFormProps) {
  const [trainingStyle, setTrainingStyle] = useState<'strength' | 'hypertrophy' | 'endurance'>('hypertrophy');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(3);
  const [timePerSession, setTimePerSession] = useState<number>(45);
  const [excludeExercises, setExcludeExercises] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill from saved user preferences
  useEffect(() => {
    db.userPreferences.get('default').then((prefs) => {
      if (!prefs) return;
      setTrainingStyle(prefs.trainingStyle);
      setEquipment(prefs.availableEquipment);
      setDaysPerWeek(prefs.daysPerWeek);
      setTimePerSession(prefs.timePerSession);
      setExcludeExercises(prefs.excludedExercises ?? []);
    });
  }, []);

  const handleSubmit = () => {
    const data = {
      trainingStyle,
      availableEquipment: [...new Set([...equipment, 'body only'])],
      daysPerWeek,
      timePerSession,
      excludeExercises,
    };

    const result = weeklyPlanConstraintsSchema.safeParse(data);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    // Save preferences for next time
    db.userPreferences.put({
      id: 'default',
      ...data,
      difficulty: 'intermediate',
      excludedExercises: excludeExercises,
    });

    onSubmit(result.data);
  };

  return (
    <>
      <Card variant="outlined" className="space-y-4">
        <TrainingStylePicker value={trainingStyle} onChange={setTrainingStyle} />
      </Card>

      <Card variant="outlined" className="space-y-4">
        <DaySelector value={daysPerWeek} onChange={setDaysPerWeek} />
      </Card>

      <Card variant="outlined" className="space-y-4">
        <DurationSlider value={timePerSession} onChange={setTimePerSession} />
      </Card>

      <Card variant="outlined" className="space-y-4">
        <EquipmentPicker
          value={equipment}
          onChange={setEquipment}
          error={errors.availableEquipment}
        />
      </Card>

      <Card variant="outlined" className="space-y-4">
        <ExerciseExcluder
          value={excludeExercises}
          onChange={setExcludeExercises}
        />
      </Card>

      <Button fullWidth size="lg" onClick={handleSubmit} isLoading={loading}>
        Generate Personalized Routine
      </Button>
    </>
  );
}