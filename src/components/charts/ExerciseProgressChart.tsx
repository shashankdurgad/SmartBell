
// components/charts/ExerciseProgressChart.tsx

export type SeriesPoint = { x: number; y: number; label?: string };

export function ExerciseProgressChart({
  points,
  width = 480,
  height = 200,
  stroke = '#4F8FF0',
  fill = 'rgba(79, 143, 240, 0.15)',
}: {
  points: SeriesPoint[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
}) {
  if (!points || points.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No data for this exercise yet.
      </div>
    );
  }

  const padding = { top: 10, right: 12, bottom: 20, left: 32 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = 0;
  const yMax = Math.max(1, Math.max(...ys));

  const xScale = (x: number) =>
    padding.left + (innerW * (x - xMin)) / (xMax - xMin || 1);
  const yScale = (y: number) =>
    padding.top + innerH - (innerH * (y - yMin)) / (yMax - yMin || 1);

  const sorted = [...points].sort((a, b) => a.x - b.x);
  const pathD = sorted
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.x)},${yScale(p.y)}`)
    .join(' ');

  const areaD = `${pathD} L${xScale(sorted[sorted.length - 1].x)},${yScale(
    0
  )} L${xScale(sorted[0].x)},${yScale(0)} Z`;

  const ticks = 5;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => (yMax * i) / ticks);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Exercise progress chart">
      {/* Axes */}
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#2A2F3A" />
      <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#2A2F3A" />

      {/* Y ticks & labels */}
      {yTicks.map((t, i) => {
        const y = yScale(t);
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#2A2F3A" opacity={0.2} />
            <text x={padding.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fill="#8A90A0" fontSize={10}>
              {Math.round(t)}
            </text>
          </g>
        );
      })}

      {/* Area */}
      <path d={areaD} fill={fill} stroke="none" />

      {/* Line */}
      <path d={pathD} fill="none" stroke={stroke} strokeWidth={2} />

      {/* Points */}
      {sorted.map((p, i) => (
        <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={3} fill={stroke} />
      ))}
    </svg>
  );
}
