interface DifficultyPickerProps {
  value: 'beginner' | 'intermediate' | 'expert';
  onChange: (difficulty: 'beginner' | 'intermediate' | 'expert') => void;
}

const DIFFICULTIES = [
  {
    id: 'beginner' as const,
    label: 'Beginner',
    description: 'Less than 1 year training',
    icon: '🌱',
  },
  {
    id: 'intermediate' as const,
    label: 'Intermediate',
    description: '1–3 years training',
    icon: '💪',
  },
  {
    id: 'expert' as const,
    label: 'Expert',
    description: '3+ years training',
    icon: '🔥',
  },
];

export function DifficultyPicker({ value, onChange }: DifficultyPickerProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-400 mb-3">Experience Level</h3>
      <div className="flex gap-2">
        {DIFFICULTIES.map((diff) => (
          <button
            key={diff.id}
            type="button"
            onClick={() => onChange(diff.id)}
            className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
              value === diff.id
                ? 'border-indigo-500 bg-indigo-500/10 text-white'
                : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500'
            }`}
          >
            <span className="text-xl">{diff.icon}</span>
            <span className="text-xs font-semibold">{diff.label}</span>
            <span className="text-[10px] text-zinc-500">{diff.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}