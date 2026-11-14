import {
  Rocket,
  Globe2,
  Radio,
  Send,
  Database,
  ShieldAlert,
  Clock,
  WifiOff,
} from 'lucide-react';
import type { OperationalMode } from '../../types/crew';

export interface TopHudBarProps {
  operationalMode: OperationalMode;
  onToggleOperationalMode: (mode: OperationalMode) => void;
  missionElapsedSeconds: number;
  earthDistanceMillionMiles: number;
  oneWayCommsDelaySeconds: number;
  queuedBurstCount: number;
  onQueueBurstTransmission: () => void;
  onOpenNasaAttribution: () => void;
  activeEmergencyCount: number;
}

// Formats mission elapsed seconds into DD:HH:MM:SS aerospace mission clock format.
function formatMissionElapsedTime(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return `MET ${pad(days, 3)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Formats one-way comms latency in minutes and seconds (e.g., +18m 42s).
function formatCommsLatency(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `+${mins}m ${String(secs).padStart(2, '0')}s`;
}

export function TopHudBar({
  operationalMode,
  onToggleOperationalMode,
  missionElapsedSeconds,
  earthDistanceMillionMiles,
  oneWayCommsDelaySeconds,
  queuedBurstCount,
  onQueueBurstTransmission,
  onOpenNasaAttribution,
  activeEmergencyCount,
}: TopHudBarProps) {
  const isMarsMode = operationalMode === 'MARS_TRANSIT';

  return (
    <header className="bg-space-hull border-b border-space-border px-4 py-3 select-none">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left Brand & Mission Telemetry Strip */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 pr-3 border-r border-space-border">
            <div
              className={`h-11 w-11 rounded-lg flex items-center justify-center border transition-colors ${
                activeEmergencyCount > 0
                  ? 'bg-status-critical/20 border-status-critical text-status-critical animate-pulse'
                  : 'bg-accent-cyan/10 border-accent-cyan/40 text-accent-cyan'
              }`}
            >
              {activeEmergencyCount > 0 ? (
                <ShieldAlert className="h-6 w-6" />
              ) : (
                <Rocket className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-wider text-cockpit-primary">
                  AURA
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-status-nominal/15 text-status-nominal border border-status-nominal/30">
                  {isMarsMode ? 'AUTONOMOUS FLIGHT SURGEON' : 'OFFLINE RURAL TRIAGE'}
                </span>
              </div>
              <p className="text-xs font-mono text-cockpit-muted tabular-nums">
                {isMarsMode
                  ? 'MISSION: ARTEMIS-VI MARS TRANSIT'
                  : 'DEPLOYMENT: EARTH DUAL-USE FIELD CLINIC'}
              </p>
            </div>
          </div>

          {/* Live Distance, Comms Delay & MET Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums">
            <div className="bg-space-void border border-space-border rounded-md px-3 py-1.5 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-accent-cyan" />
              <span className="text-cockpit-primary">
                {formatMissionElapsedTime(missionElapsedSeconds)}
              </span>
            </div>

            {isMarsMode ? (
              <>
                <div className="bg-space-void border border-space-border rounded-md px-3 py-1.5 flex items-center gap-1.5">
                  <span className="text-cockpit-muted">EARTH DIST:</span>
                  <span className="text-cockpit-primary font-semibold">
                    {earthDistanceMillionMiles.toFixed(1)}M MI
                  </span>
                </div>
                <div
                  className="bg-status-warning/10 border border-status-warning/40 rounded-md px-3 py-1.5 flex items-center gap-1.5"
                  title="One-way radio travel delay to NASA Johnson Space Center MCC"
                >
                  <Radio className="h-3.5 w-3.5 text-status-warning animate-pulse" />
                  <span className="text-status-warning font-semibold">
                    COMMS DELAY: {formatCommsLatency(oneWayCommsDelaySeconds)} (1-WAY)
                  </span>
                </div>
              </>
            ) : (
              <div className="bg-status-nominal/10 border border-status-nominal/40 rounded-md px-3 py-1.5 flex items-center gap-1.5">
                <WifiOff className="h-3.5 w-3.5 text-status-nominal" />
                <span className="text-status-nominal font-semibold">
                  100% OFFLINE LAN • ZERO SATELLITE UPLINK REQUIRED
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Controls: Dual-Use Mode Switcher + Burst Queue + NASA Data Inspector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dual-Use Mode Toggle with >= 48px glove-friendly touch targets */}
          <div
            className="inline-flex rounded-lg bg-space-void p-1 border border-space-border"
            role="group"
            aria-label="Operational Environment Mode"
          >
            <button
              type="button"
              onClick={() => onToggleOperationalMode('MARS_TRANSIT')}
              className={`min-h-[44px] px-3.5 py-2 rounded-md text-xs font-mono font-semibold flex items-center gap-2 transition-all ${
                isMarsMode
                  ? 'bg-accent-cyan text-space-void shadow-sm'
                  : 'text-cockpit-muted hover:text-cockpit-primary'
              }`}
            >
              <Rocket className="h-4 w-4" />
              <span>DEEP SPACE (MARS)</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleOperationalMode('EARTH_DUAL_USE')}
              className={`min-h-[44px] px-3.5 py-2 rounded-md text-xs font-mono font-semibold flex items-center gap-2 transition-all ${
                !isMarsMode
                  ? 'bg-status-nominal text-space-void shadow-sm'
                  : 'text-cockpit-muted hover:text-cockpit-primary'
              }`}
            >
              <Globe2 className="h-4 w-4" />
              <span>EARTH DUAL-USE (CLINIC)</span>
            </button>
          </div>

          {/* Store-and-Forward Earth Burst Queue Trigger */}
          <button
            type="button"
            onClick={onQueueBurstTransmission}
            className="min-h-[48px] px-3.5 py-2 rounded-lg bg-space-elevated hover:bg-space-border border border-space-border text-xs font-mono text-cockpit-primary flex items-center gap-2 transition-colors"
            title="Snapshot current crew vitals & diagnosis into local IndexedDB burst queue for next DSN uplink window"
          >
            <Send className="h-4 w-4 text-accent-cyan" />
            <span>{isMarsMode ? 'QUEUE MCC BURST' : 'QUEUE SATELLITE SYNC'}</span>
            <span className="px-1.5 py-0.5 rounded bg-accent-cyan/20 text-accent-cyan font-bold tabular-nums">
              {queuedBurstCount}
            </span>
          </button>

          {/* NASA Open Science Data Attribution Inspector */}
          <button
            type="button"
            onClick={onOpenNasaAttribution}
            className="min-h-[48px] px-3.5 py-2 rounded-lg bg-space-elevated hover:bg-space-border border border-accent-cyan/40 text-xs font-mono text-accent-cyan flex items-center gap-2 transition-colors"
          >
            <Database className="h-4 w-4" />
            <span>NASA DATA &amp; AUDIT</span>
          </button>
        </div>
      </div>
    </header>
  );
}
