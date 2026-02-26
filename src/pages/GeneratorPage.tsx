import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { EmptyState } from '../components/shared/EmptyState';

export function GeneratorPage() {
  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="New Session" showBack />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card variant="elevated">
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            }
            title="Routine Generator"
            description="Configure your training preferences and generate a personalized weekly workout plan. Coming in Sprint 2."
            action={
              <Button disabled>
                Generate Personalized Routine
              </Button>
            }
          />
        </Card>

        {/* Preview of the generator form UI */}
        <Card variant="outlined" className="space-y-4">
          <h3 className="font-semibold text-white">Training Style</h3>
          <div className="flex gap-3">
            {(['Strength', 'Hypertrophy', 'Endurance'] as const).map((style) => (
              <div
                key={style}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors cursor-pointer ${
                  style === 'Strength'
                    ? 'border-blue-primary bg-blue-primary/10'
                    : 'border-dark-500 bg-dark-700 hover:border-dark-400'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-dark-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-white">{style}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="outlined" className="space-y-4">
          <h3 className="font-semibold text-white">Equipment</h3>
          <div className="grid grid-cols-2 gap-2">
            {['Barbell', 'Dumbbell', 'Kettlebell', 'Machine', 'Cable', 'Body Only'].map((eq) => (
              <div
                key={eq}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-dark-500 bg-dark-700 text-sm text-gray-light"
              >
                {eq}
                <div className="w-5 h-5 rounded-full border-2 border-dark-400" />
              </div>
            ))}
          </div>
        </Card>

        <Card variant="outlined" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Available days per week</h3>
          </div>
          <div className="flex gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div
                key={day}
                className={`flex-1 text-center py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  day === 'Thu'
                    ? 'bg-blue-primary text-white'
                    : 'bg-dark-700 text-gray-text hover:bg-dark-600'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </Card>

        <Card variant="outlined" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Duration</h3>
            <span className="text-blue-primary font-semibold">45 <span className="text-sm text-gray-text">min</span></span>
          </div>
          <div className="relative">
            <input
              type="range"
              min={15}
              max={120}
              defaultValue={45}
              className="w-full h-1 bg-dark-600 rounded-lg appearance-none cursor-pointer accent-blue-primary"
              disabled
            />
            <div className="flex justify-between mt-1 text-xs text-gray-text">
              <span>15m</span>
              <span>120m</span>
            </div>
          </div>
        </Card>

        <Button fullWidth size="lg" disabled className="!bg-blue-primary/50">
          Generate Personalized Routine
        </Button>
      </div>
    </div>
  );
}
