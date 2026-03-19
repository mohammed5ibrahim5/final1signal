import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
} from 'recharts';

declare const require: any;

export interface SignalLine {
  key: string;
  name: string;
  color: string;
  isDashed?: boolean;
  fillArea?: boolean;
}

export interface SignalChartProps {
  data: any[];
  domain: 'continuous' | 'discrete';
  xAxisKey: string;
  lines: SignalLine[];
  height?: number;
  xLabel?: string;
  yLabel?: string;
  processDiscontinuities?: boolean;
  extendToInfinity?: boolean;
}

// Custom dot that renders a filled circle for discrete (stem) plots
const StemDot = (props: any) => {
  const { cx, cy, fill, value } = props;
  if (value === null || value === undefined || isNaN(cy)) return null;
  return <circle cx={cx} cy={cy} r={6} fill={fill} stroke="white" strokeWidth={2} />;
};

const StemActiveDot = (props: any) => {
  const { cx, cy, fill } = props;
  return <circle cx={cx} cy={cy} r={9} fill={fill} stroke="white" strokeWidth={2} opacity={0.85} />;
};

export function SignalChart({
  data,
  domain,
  xAxisKey,
  lines,
  height = 400,
  xLabel,
  yLabel = 'Amplitude',
  processDiscontinuities = true,
  extendToInfinity = false,
}: SignalChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200"
      >
        <span className="text-slate-400 font-medium text-sm">No data to display</span>
      </div>
    );
  }

  const axisLabel = xLabel ?? (domain === 'discrete' ? 'n (samples)' : 't (time)');

  const commonProps = {
    data,
    margin: { top: 20, right: 30, left: 20, bottom: 30 },
  };

  const xAxisProps = {
    dataKey: xAxisKey,
    type: 'number' as const,
    domain: ['auto', 'auto'] as ['auto', 'auto'],
    tick: { fill: '#64748b', fontSize: 12 },
    label: { value: axisLabel, position: 'insideBottom' as const, offset: -10, fill: '#475569', fontSize: 12 },
  };

  const yAxisProps = {
    tick: { fill: '#64748b', fontSize: 12 },
    label: {
      value: yLabel,
      angle: -90,
      position: 'insideLeft' as const,
      offset: 10,
      fill: '#475569',
      fontSize: 12,
    },
  };

  const tooltipStyle = {
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    fontSize: 13,
  };

  // ── DISCRETE: Stem Plot ──────────────────────────────────────────────────
  if (domain === 'discrete') {
    return (
      <div style={{ height }} className="w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1.5} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => `${xAxisKey} = ${v}`} />
            <Legend verticalAlign="top" height={40} />
            <Brush dataKey={xAxisKey} height={30} stroke="#8884d8" fill="#f8fafc" strokeWidth={1} />

            {lines.map((line) => (
              <React.Fragment key={line.key}>
                {/* Thin bar = vertical stem from 0 to value */}
                <Bar
                  dataKey={line.key}
                  name={`${line.name} (stem)`}
                  barSize={3}
                  fill={line.color}
                  opacity={0.75}
                  legendType="none"
                  isAnimationActive={false}
                />
                {/* Line with no stroke but custom dots = circle markers */}
                <Line
                  dataKey={line.key}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={0}
                  dot={<StemDot fill={line.color} />}
                  activeDot={<StemActiveDot fill={line.color} />}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </React.Fragment>
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Process discontinuities for continuous signals
  let plotData = data;
  if (processDiscontinuities) {
    try {
      const mod = require('./DiscontinuityProcessor');
      const processed = mod.processContinuousData(data, lines, xAxisKey, extendToInfinity);
      plotData = processed.data;
    } catch (e) {
      console.warn('Discontinuity processing failed:', e);
    }
  }

  // ── CONTINUOUS: Line / Area Chart ────────────────────────────────────────
  return (
    <div style={{ height }} className="w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={plotData} margin={commonProps.margin}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis {...xAxisProps} />
          <YAxis {...yAxisProps} />
          <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
          <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => `${xAxisKey} = ${v}`} />
          <Legend verticalAlign="top" height={40} />
          <Brush dataKey={xAxisKey} height={30} stroke="#8884d8" fill="#f8fafc" />

          {lines.map((line) => (
            <React.Fragment key={line.key}>
              {line.fillArea && (
                <Area
                  dataKey={line.key}
                  fill={line.color}
                  fillOpacity={0.12}
                  stroke="none"
                  legendType="none"
                  connectNulls
                  isAnimationActive={false}
                />
              )}
              <Line
                type="linear"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeWidth={line.isDashed ? 2 : 3}
                strokeDasharray={line.isDashed ? '6 4' : undefined}
                dot={{ r: 4, fill: line.color, stroke: 'white', strokeWidth: 1.5 }}
                activeDot={{ r: 7, fill: line.color }}
                connectNulls
                isAnimationActive={false}
              />
            </React.Fragment>
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

