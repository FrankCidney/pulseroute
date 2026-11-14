import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  YAxis,
  ReferenceLine,
  Tooltip,
} from 'recharts';
import { HeartPulse, Activity } from 'lucide-react';
import type { EcgWaveformPoint } from '../../types/telemetry';
import type { CrewHealthStatus } from '../../types/crew';

export interface LiveEcgWaveformProps {
  waveformWindow: readonly EcgWaveformPoint[];
  heartRateBpm: number;
  spO2Pct: number;
  hrvRmssdMs: number;
  status: CrewHealthStatus;
}

// High-framerate sliding-window waveform panel for 3-Lead Astroskin ECG and SpO2 PPG.
// Disables Recharts SVG tweening (isAnimationActive={false}) so 1Hz ring-buffer shifts
// render at a locked 60fps without frame drops or path interpolation artifacts.
export function LiveEcgWaveform({
  waveformWindow,
  heartRateBpm,
  spO2Pct,
  hrvRmssdMs,
  status,
}: LiveEcgWaveformProps) {
  const ecgStrokeColor =
    status === 'CRITICAL'
      ? '#EF4444'
      : status === 'WARNING'
        ? '#F59E0B'
        : '#10B981';

  // Copy readonly window to mutable array required by Recharts data prop
  const chartData = [...waveformWindow];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
      {/* Left 7 Cols: 3-Lead ECG Rhythm Strip (Lead II) */}
      <div className="md:col-span-7 bg-space-void/90 border border-space-border rounded-lg p-3.5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse
              className="h-4 w-4"
              style={{ color: ecgStrokeColor }}
            />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cockpit-primary">
              ASTROSKIN 3-LEAD ECG (LEAD II • 25mm/s)
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
            <span className="text-cockpit-muted">
              RHYTHM:{' '}
              <strong className="text-cockpit-primary">
                {heartRateBpm > 105
                  ? 'SINUS TACHYCARDIA'
                  : heartRateBpm < 52
                    ? 'SINUS BRADYCARDIA'
                    : 'NORMAL SINUS'}
              </strong>
            </span>
            <span
              className="font-bold px-2 py-0.5 rounded bg-space-elevated border border-space-border"
              style={{ color: ecgStrokeColor }}
            >
              {heartRateBpm} BPM
            </span>
          </div>
        </div>

        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 6, right: 6, left: -24, bottom: 2 }}>
              <YAxis domain={[-0.7, 1.9]} tick={{ fontSize: 10, fill: '#64748B' }} />
              <ReferenceLine y={0} stroke="#232D3F" strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F141C',
                  borderColor: '#232D3F',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
                formatter={(val: number) => [`${val.toFixed(2)} mV`, 'ECG Lead II']}
                labelFormatter={() => 'Astroskin Sample'}
              />
              <Line
                type="monotone"
                dataKey="ecgMv"
                stroke={ecgStrokeColor}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right 5 Cols: SpO2 Plethysmograph & Autonomic HRV Trend */}
      <div className="md:col-span-5 bg-space-void/90 border border-space-border rounded-lg p-3.5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent-cyan" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cockpit-primary">
              SpO2 PLETH &amp; HRV AUTONOMIC TREND
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
            <span className="text-accent-cyan font-bold">{spO2Pct.toFixed(1)}% SpO2</span>
            <span className="text-cockpit-muted">|</span>
            <span className="text-cockpit-primary">{hrvRmssdMs} ms HRV</span>
          </div>
        </div>

        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 6, right: 6, left: -24, bottom: 2 }}>
              <defs>
                <linearGradient id="ppgCyanFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <YAxis domain={[0, 110]} tick={{ fontSize: 10, fill: '#64748B' }} />
              <ReferenceLine y={50} stroke="#232D3F" strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F141C',
                  borderColor: '#232D3F',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
              <Area
                type="monotone"
                dataKey="ppgWave"
                stroke="#06B6D4"
                strokeWidth={1.75}
                fill="url(#ppgCyanFill)"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="hrvMs"
                stroke="#F59E0B"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
