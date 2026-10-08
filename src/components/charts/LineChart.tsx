"use client";
import { motion, useReducedMotion } from "framer-motion";
export interface ChartPoint {
  x: number;
  y: number;
  label?: string;
}

// Small, accessible SVG plot: no heavyweight dashboard library in the bundle.
// Numeric x coordinates preserve real time/strain spacing between observations.
export function LineChart({
  points,
  label,
  xLabel,
  yLabel,
  formatX = (v: number) => String(v),
  formatY = (v: number) => String(v),
  zeroBaseline = false,
}: {
  points: ChartPoint[];
  label: string;
  xLabel: string;
  yLabel: string;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  zeroBaseline?: boolean;
}) {
  const reduced = useReducedMotion();
  if (!points.length)
    return <div className="chart-empty">No data in this range.</div>;
  const width = 700,
    height = 290,
    left = 48,
    right = 22,
    top = 22,
    bottom = 47;
  const plotW = width - left - right,
    plotH = height - top - bottom;
  const minX = Math.min(...points.map((p) => p.x)),
    maxX = Math.max(...points.map((p) => p.x));
  const values = points.map((p) => p.y);
  const minValue = Math.min(...values),
    maxValue = Math.max(...values);
  const spread = maxValue - minValue || Math.max(5, maxValue * 0.1);
  const minY = zeroBaseline
    ? 0
    : Math.max(0, Math.floor(minValue - spread * 0.2));
  const maxY = Math.ceil(maxValue + spread * 0.2);
  const x = (value: number) =>
    left + ((value - minX) / (maxX - minX || 1)) * plotW;
  const y = (value: number) =>
    top + plotH - ((value - minY) / (maxY - minY || 1)) * plotH;
  const path = points
    .map(
      (point, i) =>
        `${i ? "L" : "M"}${x(point.x).toFixed(2)},${y(point.y).toFixed(2)}`,
    )
    .join(" ");
  const area = `${path} L${x(points.at(-1)!.x)},${top + plotH} L${x(points[0].x)},${top + plotH} Z`;
  const ticks = Array.from(
    { length: 4 },
    (_, i) => minY + ((maxY - minY) * i) / 3,
  );
  const xTicks = [0, Math.floor((points.length - 1) / 2), points.length - 1]
    .filter((v, i, a) => a.indexOf(v) === i)
    .map((i) => points[i]);
  return (
    <svg
      className="line-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <desc>{`${yLabel} plotted against ${xLabel}. ${points.length} observations. Values from ${minValue} to ${maxValue}. Exact values are available in the data table below.`}</desc>
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            className="chart-grid"
            x1={left}
            x2={width - right}
            y1={y(tick)}
            y2={y(tick)}
          />
          <text
            className="chart-axis"
            x={left - 12}
            y={y(tick) + 4}
            textAnchor="end"
          >
            {formatY(tick)}
          </text>
        </g>
      ))}
      <motion.path
        className="chart-area"
        initial={false}
        animate={{ d: area }}
        transition={{ duration: reduced ? 0 : 0.4 }}
      />
      <motion.path
        className="chart-line"
        initial={false}
        animate={{ d: path }}
        transition={{ duration: reduced ? 0 : 0.4 }}
      />
      {points.map((point) => (
        <circle
          key={point.x}
          className="chart-dot"
          cx={x(point.x)}
          cy={y(point.y)}
          r={points.length > 20 ? 2 : 3.5}
        >
          <title>{`${point.label || formatX(point.x)}: ${point.y}`}</title>
        </circle>
      ))}
      {xTicks.map((tick) => (
        <text
          className="chart-axis"
          key={tick.x}
          x={x(tick.x)}
          y={height - 26}
          textAnchor={
            tick === xTicks[0]
              ? "start"
              : tick === xTicks.at(-1)
                ? "end"
                : "middle"
          }
        >
          {tick.label || formatX(tick.x)}
        </text>
      ))}
      <text
        className="chart-axis"
        x={width - right}
        y={height - 6}
        textAnchor="end"
      >
        {xLabel}
      </text>
      <text className="chart-axis" x={left} y={12}>
        {yLabel}
      </text>
    </svg>
  );
}
