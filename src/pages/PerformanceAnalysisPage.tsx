import { useEffect } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/shared/Card';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import WorkoutCalendar from '../components/shared/WorkoutCalendar';

export function PerformanceAnalysisPage() {
  const { history, loadHistory } = useWorkoutStore();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Build volume totals per calendar day (YYYY-MM-DD)
  const volumesByDate: Record<string, number> = history.reduce((acc: Record<string, number>, s) => {
    const d = new Date(s.date);
    const key = d.toISOString().slice(0, 10);
    acc[key] = (acc[key] || 0) + (Number(s.totalVolume) || 0);
    return acc;
  }, {});

  const last60Days = (() => {
    const arr: { date: Date; volume: number }[] = [];
    const today = new Date();
    for (let i = 59; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      arr.push({ date: d, volume: volumesByDate[key] || 0 });
    }
    return arr;
  })();

  return (
    <div className="min-h-screen pb-24">
      <PageHeader 
        title="Performance Analysis" 
        showBack 
      />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <section>
          <h2 className="text-sm font-semibold text-gray-text uppercase tracking-wider mb-1">
            Consistency
          </h2>
          <h1 className="text-lg font-semibold text-white-text tracking-wider mb-3">
            Training Frequency
          </h1>
          <Card>
            <div>
              <WorkoutCalendar days={last60Days} />
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
