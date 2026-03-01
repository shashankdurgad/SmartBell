interface TrainingStylePickerProps {
  value: 'strength' | 'hypertrophy' | 'endurance';
  onChange: (style: 'strength' | 'hypertrophy' | 'endurance') => void;
}

const STYLES = [
  {
    id: 'strength' as const,
    label: 'Strength',
    description: 'Heavy weight, low reps (3-5)',
    icon: '🏋️',
  },
  {
    id: 'hypertrophy' as const,
    label: 'Hypertrophy',
    description: 'Moderate weight, mid reps (8-12)',
    icon: '💪',
  },
  {
    id: 'endurance' as const,
    label: 'Endurance',
    description: 'Light weight, high reps (15-20)',
    icon: '🔥',
  },
];

export function TrainingStylePicker({ value, onChange }: TrainingStylePickerProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-400 mb-3">Training Style</h3>
      <div className="flex flex-col gap-2">
        {STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => onChange(style.id)}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
              value === style.id
                ? 'border-indigo-500 bg-indigo-500/10 text-white'
                : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-500'
            }`}
          >
            <span className="text-2xl">{style.icon}</span>
            <div>
              <p className="font-medium">{style.label}</p>
              <p className="text-xs text-zinc-400">{style.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}