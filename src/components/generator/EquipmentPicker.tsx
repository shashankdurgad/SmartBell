import { useState } from 'react';
import { Input } from '../shared/Input';

interface EquipmentPickerProps {
  value: string[];
  onChange: (equipment: string[]) => void;
  error?: string;
}

const EQUIPMENT_OPTIONS = [
  { id: 'barbell',      label: 'Barbell',    icon: BarIcon },
  { id: 'dumbbell',     label: 'Dumbbell',   icon: DumbbellIcon },
  { id: 'cable',        label: 'Cable',      icon: CableIcon },
  { id: 'machine',      label: 'Machine',    icon: MachineIcon },
  { id: 'bands',        label: 'Bands',      icon: BandIcon },
  { id: 'kettlebells',  label: 'Kettlebell', icon: KettlebellIcon },
  { id: 'e-z curl bar', label: 'EZ Bar',     icon: EzBarIcon },
];

// ─── SVG Icons ───


function BarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Long bar */}
      <line x1="1" y1="12" x2="23" y2="12" />
      {/* Outer plates */}
      <rect x="2" y="8" width="2.5" height="8" rx="0.5" fill="currentColor" />
      <rect x="19.5" y="8" width="2.5" height="8" rx="0.5" fill="currentColor" />
      {/* Inner plates */}
      <rect x="5" y="9.5" width="2" height="5" rx="0.5" fill="currentColor" />
      <rect x="17" y="9.5" width="2" height="5" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function DumbbellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Handle */}
      <line x1="8" y1="12" x2="16" y2="12" />
      {/* Left weight */}
      <rect x="2" y="8.5" width="3" height="7" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="5" y="9.5" width="3" height="5" rx="0.5" fill="currentColor" opacity="0.2" />
      {/* Right weight */}
      <rect x="16" y="9.5" width="3" height="5" rx="0.5" fill="currentColor" opacity="0.2" />
      <rect x="19" y="8.5" width="3" height="7" rx="1" fill="currentColor" opacity="0.2" />
      {/* Outlines */}
      <rect x="2" y="8.5" width="3" height="7" rx="1" />
      <rect x="5" y="9.5" width="3" height="5" rx="0.5" />
      <rect x="16" y="9.5" width="3" height="5" rx="0.5" />
      <rect x="19" y="8.5" width="3" height="7" rx="1" />
    </svg>
  );
}

function CableIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Tower */}
      <rect x="8" y="2" width="8" height="3" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="8" y="2" width="8" height="3" rx="1" />
      {/* Cable */}
      <line x1="12" y1="5" x2="12" y2="15" strokeDasharray="2 1.5" />
      {/* Handle */}
      <rect x="9" y="15" width="6" height="2.5" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="9" y="15" width="6" height="2.5" rx="1" />
      {/* Grip */}
      <line x1="10.5" y1="17.5" x2="10.5" y2="21" />
      <line x1="13.5" y1="17.5" x2="13.5" y2="21" />
      <line x1="9.5" y1="21" x2="14.5" y2="21" />
    </svg>
  );
}

function MachineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Frame */}
      <rect x="3" y="2" width="18" height="20" rx="2" fill="currentColor" opacity="0.1" />
      <rect x="3" y="2" width="18" height="20" rx="2" />
      {/* Weight stack */}
      <line x1="7" y1="6" x2="17" y2="6" />
      <line x1="7" y1="9" x2="17" y2="9" />
      <line x1="7" y1="12" x2="17" y2="12" />
      {/* Pin */}
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      {/* Seat */}
      <line x1="7" y1="17" x2="17" y2="17" />
    </svg>
  );
}

function BandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Band stretched */}
      <path d="M4 8 C4 8, 12 3, 20 8" />
      <path d="M4 8 C4 8, 12 13, 20 8" fill="currentColor" opacity="0.1" />
      {/* Handles */}
      <circle cx="4" cy="8" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="4" cy="8" r="2" />
      <circle cx="20" cy="8" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="20" cy="8" r="2" />
      {/* Tension lines */}
      <path d="M6 14 C8 12, 10 16, 12 14 C14 12, 16 16, 18 14" opacity="0.4" />
    </svg>
  );
}

function KettlebellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Handle */}
      <path d="M9 3.5 C9 2, 15 2, 15 3.5" />
      <line x1="9" y1="3.5" x2="9" y2="7" />
      <line x1="15" y1="3.5" x2="15" y2="7" />
      {/* Body */}
      <circle cx="12" cy="14" r="7" fill="currentColor" opacity="0.15" />
      <circle cx="12" cy="14" r="7" />
      {/* Center mark */}
      <circle cx="12" cy="14" r="2" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function EzBarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Plates left */}
      <rect x="1" y="9" width="2.5" height="6" rx="0.5" fill="currentColor" opacity="0.2" />
      <rect x="1" y="9" width="2.5" height="6" rx="0.5" />
      {/* EZ shape */}
      <path d="M3.5 12 L6 12 L8 10 L11 14 L13 10 L16 14 L18 12 L20.5 12" />
      {/* Plates right */}
      <rect x="20.5" y="9" width="2.5" height="6" rx="0.5" fill="currentColor" opacity="0.2" />
      <rect x="20.5" y="9" width="2.5" height="6" rx="0.5" />
    </svg>
  );
}

export function EquipmentPicker({ value, onChange, error }: EquipmentPickerProps) {
  const [search, setSearch] = useState('');

  const filteredOptions = EQUIPMENT_OPTIONS.filter((eq) =>
    eq.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((e) => e !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const selectAll = () => {
    if (value.length === EQUIPMENT_OPTIONS.length) {
      onChange([]);
    } else {
      onChange(EQUIPMENT_OPTIONS.map((e) => e.id));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-400">Available Equipment</h3>
        <button
          type="button"
          onClick={selectAll}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {value.length === EQUIPMENT_OPTIONS.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <p className="text-xs text-zinc-500 mb-3">
        Bodyweight exercises are always included
      </p>

      <Input
        placeholder="Search equipment..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        helperText={filteredOptions.length === 0 ? `No equipment matches "${search}"` : undefined}
      />

      <div className="grid grid-cols-3 gap-2 mt-3">
        {filteredOptions.map((eq) => {
          const Icon = eq.icon;
          return (
            <button
              key={eq.id}
              type="button"
              onClick={() => toggle(eq.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                value.includes(eq.id)
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{eq.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-accent">{error}</p>
      )}
    </div>
  );
}