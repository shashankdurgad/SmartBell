interface DayCell {
  date: Date;
  volume: number;
}

interface Props {
  days: DayCell[];
  unit?: 'kg' | 'lbs';
}

export default function WorkoutCalendar({ days, unit = 'kg' }: Props) {
  if (!days || days.length === 0) return null;

  // Determine max volume for scaling
  const maxVolume = days.reduce((max, d) => (d.volume > max ? d.volume : max), 0);

  // Group days by week (Sunday = 0)
  const weeks: DayCell[][] = [];
  let currentWeek: DayCell[] = [];

  for (const day of days) {
    if (currentWeek.length === 0) {
      // Start with padding for the day of week
      const dow = day.date.getDay();
      for (let i = 0; i < dow; i++) {
        currentWeek.push({ date: new Date(), volume: 0 }); // dummy entries
      }
    }

    currentWeek.push(day);

    if (day.date.getDay() === 6) {
      // End of week (Saturday)
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Build month labels based on first non-zero volume day in each week
  const monthLabels = weeks.map((week) => {
    const real = week.find((d) => d.volume > 0);
    const date = real ? real.date : week[0].date;
    return date.toLocaleString('default', { month: 'short' });
  });

  return (
    <div>
      {/* month label row */}
      <div className="flex gap-1 justify-center text-xs text-gray-text mb-1">
        {monthLabels.map((m, i) => (
          <div key={`ml-${i}`} className="w-11 text-center">
            {i === 0 || m !== monthLabels[i - 1] ? m : ''}
          </div>
        ))}
      </div>
      <div className="flex gap-1 justify-center">
        {weeks.map((week, weekIdx) => (
          <div key={`week-${weekIdx}`} className="flex flex-col gap-1">
            {week.map((day, dayIdx) => {
              const key = day.date.toISOString().slice(0, 10);
              const has = day.volume > 0;
              const maxLight = 60;
              const minLight = 15;
              let lightness = 8;
              if (has && maxVolume > 0) {
                const ratio = day.volume / maxVolume * 1.2;
                lightness = Math.round(minLight + ratio * (maxLight - minLight));
              }

              const bg = has ? `hsl(215 90% ${lightness}%)` : 'rgba(52, 52, 71, 0.31)';
              const title = has ? `${key} - ${Math.round(day.volume)} ${unit}` : key;

              return (
                <div
                  key={`${weekIdx}-${dayIdx}`}
                  title={title}
                  className="w-11 h-6 rounded-sm"
                  style={{
                    background: bg,
                    border: 'none',
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-text">
        <span className="whitespace-nowrap">Low volume</span>
        <div
          className="h-2 flex-1 rounded-sm"
          style={{
            background: 'linear-gradient(to right, hsl(215 90% 15%), hsl(215 90% 60%))',
          }}
          aria-hidden="true"
        />
        <span className="whitespace-nowrap">High volume</span>
      </div>
    </div>
  );
}
