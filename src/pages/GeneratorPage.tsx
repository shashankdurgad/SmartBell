import { useState } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { GeneratorForm } from '../components/generator/GeneratorForm';
import { PlanPreview } from '../components/generator/PlanPreview';
import { useWeeklyPlanStore } from '../stores/useWeeklyPlanStore';
import { generateWeeklyPlan } from '../engine/generatePlan';
import type { WeeklyPlanConstraints } from '../utils/validators';
import type { WeeklyPlan } from '../types';

export function GeneratorPage() {
  const savePlan = useWeeklyPlanStore((s) => s.savePlan);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (constraints: WeeklyPlanConstraints) => {
    setLoading(true);
    try {
      //TODO: wire up generateWeeklyPlan(constraints) from engine
      const generated = await generateWeeklyPlan(constraints);
      await savePlan(generated);
      setPlan(generated);
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="New Session" showBack />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {plan ? (
          <PlanPreview plan={plan} onRegenerate={() => setPlan(null)} />
        ) : (
          <GeneratorForm onSubmit={handleGenerate} loading={loading} />
        )}
      </div>
    </div>
  );
}