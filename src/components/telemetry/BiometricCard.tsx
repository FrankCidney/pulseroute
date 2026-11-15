import type { ReactNode } from 'react';
import type { CrewHealthStatus } from '../../types/crew';

export interface BiometricCardProps {
  title: string;
  primaryValue: string;
  unit: string;
  secondaryLabel: string;
  nominalRangeText: string;
  plainEnglishHint?: string;
  status: CrewHealthStatus;
  icon: ReactNode;
  children?: ReactNode;
}

const CARD_STATUS_THEME: Record<
  CrewHealthStatus,
  {
    border: string;
    valueText: string;
    badgeBg: string;
    badgeText: string;
    label: string;
  }
> = {
  NOMINAL: {
    border: 'border-space-border',
    valueText: 'text-cockpit-primary',
    badgeBg: 'bg-status-nominal/15 border-status-nominal/30',
    badgeText: 'text-status-nominal',
    label: 'IN RANGE',
  },
  WARNING: {
    border: 'border-status-warning/70',
    valueText: 'text-status-warning',
    badgeBg: 'bg-status-warning/15 border-status-warning/40',
    badgeText: 'text-status-warning',
    label: 'CHECK',
  },
  CRITICAL: {
    border: 'border-status-critical ring-1 ring-status-critical/40',
    valueText: 'text-status-critical',
    badgeBg: 'bg-status-critical/20 border-status-critical',
    badgeText: 'text-status-critical',
    label: 'HIGH',
  },
};

// Reusable telemetry readout card using monospaced tabular numerals so 1Hz sensor
// updates never shift adjacent layout columns.
export function BiometricCard({
  title,
  primaryValue,
  unit,
  secondaryLabel,
  nominalRangeText,
  plainEnglishHint,
  status,
  icon,
  children,
}: BiometricCardProps) {
  const theme = CARD_STATUS_THEME[status];

  return (
    <div
      className={`bg-space-void/90 border ${theme.border} rounded-lg p-3.5 flex flex-col justify-between gap-2.5 transition-colors`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-cockpit-muted">
          <span className="text-accent-cyan">{icon}</span>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
            {title}
          </span>
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${theme.badgeBg} ${theme.badgeText}`}
        >
          {theme.label}
        </span>
      </div>

      {/* Primary Monospaced Readout */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
          <span className={`text-2xl font-bold tracking-tight ${theme.valueText}`}>
            {primaryValue}
          </span>
          <span className="text-xs text-cockpit-muted">{unit}</span>
        </div>
        <span className="text-[11px] font-mono text-cockpit-muted tabular-nums">
          {secondaryLabel}
        </span>
      </div>

      {/* Plain-English Subtitle */}
      {plainEnglishHint ? (
        <p className="text-[11px] text-cockpit-muted leading-snug">
          {plainEnglishHint}
        </p>
      ) : null}

      {/* Optional Sparkline or Sub-Widget Slot */}
      {children ? <div className="pt-0.5">{children}</div> : null}

      {/* Footer Baseline Reference */}
      <div className="pt-1.5 border-t border-space-border/60 flex items-center justify-between text-[11px] font-mono text-cockpit-muted">
        <span>REFERENCE RANGE</span>
        <span className="tabular-nums text-cockpit-primary/80">{nominalRangeText}</span>
      </div>
    </div>
  );
}
