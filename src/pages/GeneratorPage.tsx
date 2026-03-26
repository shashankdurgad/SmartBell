import { useState } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { GeneratorForm } from '../components/Generator/GeneratorForm';
import { PlanPreview } from '../components/Generator/PlanPreview';
import { useWeeklyPlanStore } from '../stores/useWeeklyPlanStore';
import { generateWeeklyPlan } from '../engine/generatePlan';
import type { WeeklyPlanConstraints } from '../utils/validators';
import type { WeeklyPlan } from '../types';

export function GeneratorPage() {
  const savePlan = useWeeklyPlanStore((s) => s.savePlan);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (constraints: WeeklyPlanConstraints) => {
    setLoading(true);
    setError(null);
    try {
      const generated = await generateWeeklyPlan(constraints);
      await savePlan(generated);
      setPlan(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="New Session" showBack />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {plan ? (
          <PlanPreview plan={plan} onRegenerate={() => setPlan(null)} />
        ) : (
          <GeneratorForm onSubmit={handleGenerate} loading={loading} />
        )}
      </div>
    </div>
  );
}