import { useEffect } from 'react';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { useUserStore } from '../stores/useUserStore';
import type { WeightUnit, TrainingStyle } from '../types';

export function ProfilePage() {
  const {
    weightUnit,
    defaultRestSeconds,
    defaultTrainingStyle,
    isLoaded,
    loadSettings,
    setWeightUnit,
    setDefaultRestSeconds,
    setDefaultTrainingStyle,
  } = useUserStore();

  useEffect(() => {
    if (!isLoaded) loadSettings();
  }, [isLoaded, loadSettings]);

  return (
    <div className="min-h-screen pb-24">
      <PageHeader title="Profile & Settings" />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Weight Unit */}
        <Card className="space-y-3">
          <h3 className="font-semibold text-white">Weight Unit</h3>
          <div className="flex gap-2">
            {(['lbs', 'kg'] as WeightUnit[]).map((unit) => (
              <button
                key={unit}
                onClick={() => setWeightUnit(unit)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  weightUnit === unit
                    ? 'bg-blue-primary text-white'
                    : 'bg-dark-700 text-gray-text hover:bg-dark-600'
                }`}
              >
                {unit.toUpperCase()}
              </button>
            ))}
          </div>
        </Card>

        {/* Default Rest Timer */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Default Rest Timer</h3>
            <span className="text-blue-primary font-semibold">{defaultRestSeconds}s</span>
          </div>
          <input
            type="range"
            min={15}
            max={300}
            step={15}
            value={defaultRestSeconds}
            onChange={(e) => setDefaultRestSeconds(Number(e.target.value))}
            className="w-full h-1 bg-dark-600 rounded-lg appearance-none cursor-pointer accent-blue-primary"
          />
          <div className="flex justify-between text-xs text-gray-text">
            <span>15s</span>
            <span>5m</span>
          </div>
        </Card>

        {/* Default Training Style */}
        <Card className="space-y-3">
          <h3 className="font-semibold text-white">Default Training Style</h3>
          <div className="flex gap-2">
            {(['strength', 'hypertrophy', 'endurance'] as TrainingStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => setDefaultTrainingStyle(style)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors ${
                  defaultTrainingStyle === style
                    ? 'bg-blue-primary text-white'
                    : 'bg-dark-700 text-gray-text hover:bg-dark-600'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </Card>

        {/* Data Management */}
        <Card className="space-y-3">
          <h3 className="font-semibold text-white">Data Management</h3>
          <div className="space-y-2">
            <Button variant="secondary" fullWidth disabled>
              Export Data (JSON)
            </Button>
            <Button variant="secondary" fullWidth disabled>
              Import Data
            </Button>
            <Button variant="danger" fullWidth disabled>
              Clear All Data
            </Button>
          </div>
          <p className="text-xs text-gray-text text-center">
            Data export/import coming in Sprint 4.
          </p>
        </Card>

        {/* App Info */}
        <Card padding="sm">
          <div className="text-center">
            <p className="text-sm font-medium text-white">SmartBell v0.1.0</p>
            <p className="text-xs text-gray-text mt-1">All data stored locally on your device</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
