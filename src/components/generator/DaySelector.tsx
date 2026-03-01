interface DaySelectorProps {
  value: number;
  onChange: (days: number) => void;
}

const SPLIT_LABELS: Record<number, string> = {
  1: 'Full Body',
  2: 'Upper / Lower',
  3: 'Push / Pull / Legs',
  4: 'Upper / Lower ×2',
  5: 'UL + PPL',
  6: 'PPL ×2',
};

export function DaySelector({ value, onChange }: DaySelectorProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-400 mb-1">Days Per Week</h3>
      <p className="text-xs text-zinc-500 mb-3">
        Split: <span className="text-zinc-300">{SPLIT_LABELS[value]}</span>
      </p>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6].map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => onChange(day)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              value === day
                ? 'bg-indigo-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}