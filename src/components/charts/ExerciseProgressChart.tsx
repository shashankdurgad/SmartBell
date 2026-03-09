
// components/charts/ExerciseProgressChart.tsx

export type SeriesPoint = { x: number; y: number; label?: string };

type ScreenPoint = { x: number; y: number };

function buildSmoothPath(points: ScreenPoint[]): string {
  if (points.length === 0) return '';
  if (points.length < 3) {
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
      .join(' ');
  }

  const tension = 0.18;
  let d = `M${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return d;
}

export function ExerciseProgressChart({
  points,
  width = 480,
  height = 200,
  stroke = '#4F8FF0',
  fill = 'rgba(79, 143, 240, 0.15)',
  xTickDays = 10,
  xDomain,
}: {
  points: SeriesPoint[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  xTickDays?: number;
  xDomain?: [number, number];
}) {
  if (!points || points.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No data for this exercise yet.
      </div>
    );
  }

  const padding = { top: 10, right: 12, bottom: 30, left: 32 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const dataXMin = Math.min(...xs);
  const dataXMax = Math.max(...xs);
  const xMin = xDomain ? xDomain[0] : dataXMin;
  const xMax = xDomain ? xDomain[1] : dataXMax;
  const yMin = 0;
  const yMax = Math.max(1, Math.max(...ys));

  const xScale = (x: number) =>
    padding.left + (innerW * (x - xMin)) / (xMax - xMin || 1);
  const yScale = (y: number) =>
    padding.top + innerH - (innerH * (y - yMin)) / (yMax - yMin || 1);

  const sorted = [...points].sort((a, b) => a.x - b.x);
  const screenPoints: ScreenPoint[] = sorted.map((p) => ({
    x: xScale(p.x),
    y: yScale(p.y),
  }));
  const pathD = buildSmoothPath(screenPoints);

  const areaD = `${pathD} L${screenPoints[screenPoints.length - 1].x},${yScale(
    0
  )} L${screenPoints[0].x},${yScale(0)} Z`;

  const ticks = 5;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => (yMax * i) / ticks);

  const oneDayMs = 24 * 60 * 60 * 1000;
  const tickStepMs = Math.max(1, xTickDays) * oneDayMs;
  const firstTick = xDomain ? xMin : Math.floor(xMin / tickStepMs) * tickStepMs;
  const xTicks: number[] = [];

  for (let t = firstTick; t <= xMax; t += tickStepMs) {
    if (t >= xMin) xTicks.push(t);
  }

  if (xTicks.length === 0 || xTicks[xTicks.length - 1] < xMax) {
    xTicks.push(xMax);
  }

  const formatTickLabel = (timestamp: number) => {
    const d = new Date(timestamp);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

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

      {/* X ticks & labels (time scale) */}
      {xTicks.map((t, i) => {
        const x = xScale(t);
        return (
          <g key={`x-${i}`}>
            <line
              x1={x}
              y1={padding.top}
              x2={x}
              y2={height - padding.bottom}
              stroke="#2A2F3A"
              opacity={0.18}
            />
            <text
              x={x}
              y={height - padding.bottom + 14}
              textAnchor="middle"
              fill="#8A90A0"
              fontSize={10}
            >
              {formatTickLabel(t)}
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
