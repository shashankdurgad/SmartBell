export type MonthData = { month: string; count: number };

export function MonthlyPRsChart({
  data,
  width = 480,
  height = 200,
}: {
  data: MonthData[];
  width?: number;
  height?: number;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No PR data available yet.
      </div>
    );
  }

  const padding = { top: 10, right: 12, bottom: 30, left: 32 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const barWidth = innerW / data.length;
  const barGap = 8;
  const actualBarWidth = barWidth - barGap;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Monthly PRs chart">
      {/* Axes */}
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#2A2F3A" />
      <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#2A2F3A" />

      {/* Y-axis labels */}
      {[0, Math.ceil(maxCount / 2), maxCount].map((tick, i) => {
        const y = padding.top + innerH - (innerH * tick) / maxCount;
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#2A2F3A" opacity={0.2} />
            <text x={padding.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fill="#8A90A0" fontSize={10}>
              {tick}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const x = padding.left + i * barWidth + barGap / 2;
        const barHeight = (d.count / maxCount) * innerH;
        const y = height - padding.bottom - barHeight;

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={actualBarWidth}
              height={barHeight}
              fill="#3b82f6"
              rx={2}
            />
            <text
              x={x + actualBarWidth / 2}
              y={height - padding.bottom + 14}
              textAnchor="middle"
              fill="#8A90A0"
              fontSize={10}
            >
              {d.month}
            </text>
            {d.count > 0 && (
              <text
                x={x + actualBarWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fill="#8A90A0"
                fontSize={10}
                fontWeight="500"
              >
                {d.count}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
