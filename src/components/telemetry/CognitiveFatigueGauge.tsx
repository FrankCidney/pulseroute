import { Brain, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { CognitiveFatigueMetrics } from '../../types/telemetry';

export interface CognitiveFatigueGaugeProps {
  fatigue: CognitiveFatigueMetrics;
  ambientCo2Pct: number;
}

// --- Pure Deterministic Canaria Cognitive Fatigue Calculator ---
// Fuses 72-hour sleep debt, autonomic HRV RMSSD suppression, and ambient cabin CO2
// concentration to predict cognitive reaction latency and 4-hour fatigue trajectory.
export function calculateCognitiveFatigueIndex(params: {
  sleepDebt72HrHours: number;
  hrvRmssdMs: number;
   baselineHrvMs: number;
  ambientCo2Pct: number;
}): CognitiveFatigueMetrics {
  const { sleepDebt72HrHours, hrvRmssdMs, baselineHrvMs, ambientCo2Pct } = params;

  // 1. Sleep debt contribution (up to 45 points when 72h deficit >= 9 hours)
  const sleepComponent = Math.min(45, Math.max(0, (sleepDebt72HrHours / 9) * 45));

  // 2. Autonomic HRV suppression relative to personal baseline (up to 35 points)
  const hrvRatio = Math.max(0, (baselineHrvMs - hrvRmssdMs) / Math.max(25, baselineHrvMs));
  const hrvComponent = Math.min(35, hrvRatio * 45);

  // 3. Ambient cabin CO2 cognitive load penalty (NASA ExMC notes cognitive slowdown > 0.35% CO2)
  const co2Excess = Math.max(0, ambientCo2Pct - 0.12);
  const co2Component = Math.min(25, (co2Excess / 0.5) * 25);

  const fatigueIndexPct = Math.round(
    Math.min(100, Math.max(4, sleepComponent + hrvComponent + co2Component))
  );

  // 4-hour forward projection accounts for ongoing CO2 accumulation and circadian drift
  const projected4HrDrift = ambientCo2Pct > 0.4 ? 14 : sleepDebt72HrHours > 5 ? 9 : 4;
  const projected4HrIndexPct = Math.min(100, fatigueIndexPct + projected4HrDrift);

  // Reaction time latency penalty in ms (NASA Psychomotor Vigilance Task PVT correlation)
  const reactionLatencyPenaltyMs = Math.round(fatigueIndexPct * 2.4);

  const circadianPhaseStatus: CognitiveFatigueMetrics['circadianPhaseStatus'] =
    fatigueIndexPct >= 65
      ? 'SEVERE_DESYNC'
      : fatigueIndexPct >= 40
        ? 'PHASE_DELAYED'
        : 'ALIGNED';

  return {
    fatigueIndexPct,
    projected4HrIndexPct,
    sleepDebt72HrHours: Number(sleepDebt72HrHours.toFixed(1)),
    reactionLatencyPenaltyMs,
    circadianPhaseStatus,
    evaCleared: fatigueIndexPct < 60,
  };
}

export function CognitiveFatigueGauge({
  fatigue,
  ambientCo2Pct,
}: CognitiveFatigueGaugeProps) {
  const isCritical = fatigue.fatigueIndexPct >= 65;
  const isWarning = fatigue.fatigueIndexPct >= 40 && !isCritical;

  const barColorClass = isCritical
    ? 'bg-status-critical'
    : isWarning
      ? 'bg-status-warning'
      : 'bg-status-nominal';

  const statusTextClass = isCritical
    ? 'text-status-critical'
    : isWarning
      ? 'text-status-warning'
      : 'text-status-nominal';

  return (
    <div className="bg-space-void/90 border border-space-border rounded-lg p-3.5 flex flex-col justify-between gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent-cyan" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cockpit-muted">
            PREDICTIVE FATIGUE INDEX (CANARIA)
          </span>
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
            fatigue.evaCleared
              ? 'bg-status-nominal/15 text-status-nominal border-status-nominal/30'
              : 'bg-status-critical/20 text-status-critical border-status-critical'
          }`}
        >
          {fatigue.evaCleared ? 'EVA CLEARED' : 'EVA RESTRICTED'}
        </span>
      </div>

      {/* Primary Score & +4h Forecast */}
      <div className="flex items-baseline justify-between font-mono tabular-nums">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-2xl font-bold ${statusTextClass}`}>
            {fatigue.fatigueIndexPct}%
          </span>
          <span className="text-xs text-cockpit-muted">LOAD</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-cockpit-muted">
          <Clock className="h-3.5 w-3.5 text-accent-cyan" />
          <span>
            +4H FORECAST:{' '}
            <strong className="text-cockpit-primary">{fatigue.projected4HrIndexPct}%</strong>
          </span>
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="w-full h-2.5 bg-space-elevated rounded-full overflow-hidden border border-space-border">
        <div
          className={`h-full transition-all duration-300 ${barColorClass}`}
          style={{ width: `${fatigue.fatigueIndexPct}%` }}
        />
      </div>

      {/* Sub-metrics: 72h Sleep Debt, PVT Reaction Penalty & CO2 Coupling */}
      <div className="pt-1 border-t border-space-border/60 grid grid-cols-3 gap-1 text-[11px] font-mono tabular-nums">
        <div>
          <span className="text-cockpit-muted block">72H DEBT</span>
          <span className="text-cockpit-primary font-semibold">
            {fatigue.sleepDebt72HrHours.toFixed(1)} hrs
          </span>
        </div>
        <div>
          <span className="text-cockpit-muted block">PVT DELAY</span>
          <span className="text-cockpit-primary font-semibold">
            +{fatigue.reactionLatencyPenaltyMs} ms
          </span>
        </div>
        <div>
          <span className="text-cockpit-muted block">CO2 LOAD</span>
          <span className="text-cockpit-primary font-semibold">
            {ambientCo2Pct.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Circadian Advisory Footer */}
      <div className="flex items-center gap-1.5 text-[11px] font-mono text-cockpit-muted">
        {fatigue.evaCleared ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-status-nominal shrink-0" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5 text-status-critical shrink-0" />
        )}
        <span className="truncate">
          {fatigue.evaCleared
            ? `Circadian ${fatigue.circadianPhaseStatus} • Psychomotor vigilance nominal`
            : 'ExMC-05 Alert: Mandate 480nm blue light & cycle ergometer rest'}
        </span>
      </div>
    </div>
  );
}
