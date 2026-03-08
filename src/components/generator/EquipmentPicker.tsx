import { useState } from 'react';

interface EquipmentPickerProps {
  value: string[];
  onChange: (equipment: string[]) => void;
  error?: string;
}

const EQUIPMENT_CATEGORIES = {
  'Free Weights': [
    { id: 'barbell', label: 'Barbell' },
    { id: 'dumbbell', label: 'Dumbbell' },
    { id: 'kettlebells', label: 'Kettlebells' },
    { id: 'e-z curl bar', label: 'EZ Curl Bar' },
    { id: 'bands', label: 'Bands' },
    { id: 'medicine ball', label: 'Medicine Ball' },
    { id: 'exercise ball', label: 'Exercise Ball' },
    { id: 'foam roll', label: 'Foam Roll' },
  ],
  'Cable Machines': [
    { id: 'cable station', label: 'Cable Station' },
    { id: 'cable crossover machine', label: 'Cable Crossover' },
    { id: 'lat pulldown machine', label: 'Lat Pulldown' },
    { id: 'seated cable row machine', label: 'Seated Cable Row' },
  ],
  'Chest & Shoulders': [
    { id: 'chest press machine', label: 'Chest Press' },
    { id: 'incline chest press machine', label: 'Incline Chest Press Machine' },
    { id: 'decline chest press machine', label: 'Decline Chest Press Machine' },
    { id: 'pec deck machine', label: 'Pec Deck' },
    { id: 'shoulder press machine', label: 'Shoulder Press' },
    { id: 'rear delt fly machine', label: 'Rear Delt Fly Machine' },
    { id: 'assisted dip machine', label: 'Assisted Dip' },
  ],
  'Legs': [
    { id: 'leg press machine', label: 'Leg Press' },
    { id: 'leg extension machine', label: 'Leg Extension' },
    { id: 'hack squat machine', label: 'Hack Squat' },
    { id: 'lying leg curl machine', label: 'Lying Leg Curl' },
    { id: 'seated leg curl machine', label: 'Seated Leg Curl' },
    { id: 'standing leg curl machine', label: 'Standing Leg Curl' },
    { id: 'lying squat machine', label: 'Lying Squat' },
    { id: 'hip abduction machine', label: 'Hip Abduction Machine' },
    { id: 'hip adduction machine', label: 'Hip Adduction Machine' },
    { id: 'standing calf raise machine', label: 'Standing Calf Raise  Machine' },
    { id: 'seated calf raise machine', label: 'Seated Calf Raise  Machine' },
    { id: 'glute ham raise machine', label: 'Glute Ham Raise' },
  ],
  'Back & Arms': [
    { id: 'high row machine', label: 'High Row' },
    { id: 'iso row machine', label: 'Iso Row' },
    { id: 't-bar row machine', label: 'T-Bar Row' },
    { id: 'bicep curl machine', label: 'Bicep Curl Machine' },
    { id: 'preacher curl machine', label: 'Preacher Curl Machine' },
    { id: 'tricep extension machine', label: 'Tricep Extension Machine' },
  ],
  'Other Machines': [
    { id: 'smith machine', label: 'Smith Machine' },
    { id: 'ab crunch machine', label: 'Ab Crunch' },
    { id: 'reverse hyperextension machine', label: 'Reverse Hyperextension' },
    { id: 'leverage shrug machine', label: 'Leverage Shrug' },
    { id: 'leverage deadlift machine', label: 'Leverage Deadlift' },
  ],
  'Cardio': [
    { id: 'treadmill', label: 'Treadmill' },
    { id: 'stationary bike', label: 'Stationary Bike' },
    { id: 'recumbent bike', label: 'Recumbent Bike' },
    { id: 'elliptical', label: 'Elliptical' },
    { id: 'rowing machine', label: 'Rowing Machine' },
    { id: 'stairmaster', label: 'Stairmaster' },
  ],
};

export function EquipmentPicker({ value, onChange, error }: EquipmentPickerProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((e) => e !== id) : [...value, id]
    );
  };

  const toggleCategory = (category: string) => {
    const items = EQUIPMENT_CATEGORIES[category as keyof typeof EQUIPMENT_CATEGORIES];
    const allSelected = items.every((item) => value.includes(item.id));

    if (allSelected) {
      onChange(value.filter((e) => !items.some((item) => item.id === e)));
    } else {
      onChange([...new Set([...value, ...items.map((item) => item.id)])]);
    }
  };

  const selectedCount = value.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-400">Available Equipment</h3>
        <span className="text-xs text-zinc-500">{selectedCount} selected</span>
      </div>

      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
        {Object.entries(EQUIPMENT_CATEGORIES).map(([category, items]) => {
          const isExpanded = expandedCategory === category;
          const selectedInCategory = items.filter((item) => value.includes(item.id)).length;
          const allSelected = selectedInCategory === items.length;

          return (
            <div key={category} className="rounded-xl border border-zinc-700 overflow-hidden">
              {/* Category Header */}
              <button
                type="button"
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-300">{category}</span>
                  {selectedInCategory > 0 && (
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full">
                      {selectedInCategory}/{items.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Select All for category */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(category);
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                      allSelected
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                        : 'border-zinc-600 text-zinc-500 hover:border-zinc-400'
                    }`}
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                  <svg
                    className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Items */}
              {isExpanded && (
                <div className="px-3 py-2 grid grid-cols-2 gap-1.5 bg-zinc-900/50">
                  {items.map((item) => {
                    const selected = value.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggle(item.id)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all text-left ${
                          selected
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-zinc-700/50 bg-zinc-800/30 text-zinc-500 hover:border-zinc-500'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}