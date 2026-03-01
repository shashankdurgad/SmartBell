interface DurationSliderProps {
  value: number;
  onChange: (minutes: number) => void;
}

const MIN_DURATION = 15;
const MAX_DURATION = 120;
const STEP = 5;

export function DurationSlider({ value, onChange }: DurationSliderProps) {
  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-400">Session Duration</h3>
        <span className="text-sm font-semibold text-indigo-400">
          {formatDuration(value)}
        </span>
      </div>

      <input
        type="range"
        min={MIN_DURATION}
        max={MAX_DURATION}
        step={STEP}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer
                   bg-zinc-700 accent-indigo-500"
      />

      <div className="flex justify-between mt-1">
        <span className="text-xs text-zinc-500">{MIN_DURATION} min</span>
        <span className="text-xs text-zinc-500">{MAX_DURATION} min</span>
      </div>
    </div>
  );
}