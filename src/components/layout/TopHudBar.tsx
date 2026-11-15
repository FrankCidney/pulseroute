import {
  Rocket,
  Globe2,
  Radio,
  Send,
  Database,
} from 'lucide-react';
import type { OperationalMode } from '../../types/crew';

export interface TopHudBarProps {
  operationalMode: OperationalMode;
  onToggleOperationalMode: (mode: OperationalMode) => void;
  oneWayCommsDelaySeconds: number;
  queuedBurstCount: number;
  onQueueBurstTransmission: () => void;
  onOpenNasaAttribution: () => void;
}

function formatCommsLatency(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  return `About ${mins} minutes one way`;
}

export function TopHudBar({
  operationalMode,
  onToggleOperationalMode,
  oneWayCommsDelaySeconds,
  queuedBurstCount,
  onQueueBurstTransmission,
  onOpenNasaAttribution,
}: TopHudBarProps) {
  const isMarsMode = operationalMode === 'MARS_TRANSIT';

  return (
    <header className="bg-space-hull border-b border-space-border px-4 py-3">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center text-accent-cyan">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-cockpit-primary">AURA</h1>
            <p className="text-sm text-cockpit-muted">Astronaut health monitor · simulation prototype</p>
          </div>
          {isMarsMode && (
            <div className="hidden xl:flex items-center gap-2 border-l border-space-border pl-4 text-sm text-cockpit-muted">
              <Radio className="h-4 w-4 text-accent-cyan" />
              <span>Earth communication delay: {formatCommsLatency(oneWayCommsDelaySeconds)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-lg bg-space-void p-1 border border-space-border"
            role="group"
            aria-label="Demo setting"
          >
            <button
              type="button"
              onClick={() => onToggleOperationalMode('MARS_TRANSIT')}
              className={`min-h-[44px] px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors ${
                isMarsMode
                  ? 'bg-accent-cyan text-white shadow-sm'
                  : 'text-cockpit-muted hover:text-cockpit-primary'
              }`}
            >
              <Rocket className="h-4 w-4" />
              <span>Spaceflight</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleOperationalMode('EARTH_DUAL_USE')}
              className={`min-h-[44px] px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors ${
                !isMarsMode
                  ? 'bg-accent-cyan text-white shadow-sm'
                  : 'text-cockpit-muted hover:text-cockpit-primary'
              }`}
            >
              <Globe2 className="h-4 w-4" />
              <span>Remote clinic</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onQueueBurstTransmission}
            className="min-h-[44px] px-3 py-2 rounded-lg bg-space-hull hover:bg-space-elevated border border-space-border text-sm font-semibold text-cockpit-primary flex items-center gap-2 transition-colors"
            title="Save a local copy of the selected crew member's current demo readings"
          >
            <Send className="h-4 w-4 text-accent-cyan" />
            <span>Save snapshot</span>
            <span className="px-1.5 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan font-bold tabular-nums">
              {queuedBurstCount}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenNasaAttribution}
            className="min-h-[44px] px-3 py-2 rounded-lg bg-space-hull hover:bg-space-elevated border border-space-border text-sm font-semibold text-cockpit-primary flex items-center gap-2 transition-colors"
          >
            <Database className="h-4 w-4 text-accent-cyan" />
            <span>Sources &amp; saved data</span>
          </button>
        </div>
      </div>
    </header>
  );
}
