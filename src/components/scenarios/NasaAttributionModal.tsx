import { X, Database, ShieldCheck, ExternalLink, FileText } from 'lucide-react';
import nasaBaselinesRaw from '../../data/nasa_baselines.json';
import type { EarthBurstPacket, MedicalIncidentLog } from '../../lib/offlineDb';

export interface NasaAttributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recentLogs: readonly MedicalIncidentLog[];
  queuedBursts: readonly EarthBurstPacket[];
  onClearBursts: () => void;
}

export function NasaAttributionModal({
  isOpen,
  onClose,
  recentLogs,
  queuedBursts,
  onClearBursts,
}: NasaAttributionModalProps) {
  if (!isOpen) return null;

  const sources = nasaBaselinesRaw.datasetMetadata.sources;

  return (
    <div
      className="fixed inset-0 z-50 bg-space-void/85 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="NASA reference links and locally saved demo records"
    >
      <div className="bg-space-hull border border-accent-cyan/50 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-space-border pb-3">
          <div className="flex items-center gap-2.5">
            <Database className="h-5 w-5 text-accent-cyan" />
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-cockpit-primary">
                NASA REFERENCES &amp; SAVED DEMO DATA
              </h2>
              <p className="text-xs font-mono text-cockpit-muted">
                Reference links only; live data ingestion and Mission Control transmission are not implemented.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-lg bg-space-elevated hover:bg-space-border border border-space-border flex items-center justify-center text-cockpit-muted hover:text-cockpit-primary"
            aria-label="Close NASA Data Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* NASA Open Science Dataset Cards */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-accent-cyan">
            NASA and research references
          </h3>
          <p className="text-sm text-cockpit-muted">
            These references provide context for the prototype. They do not validate its estimates or response steps.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sources.map((src) => (
              <div
                key={src.id}
                className="bg-space-void/90 border border-space-border rounded-lg p-3.5 flex flex-col justify-between gap-2.5"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
                      {src.id}
                    </span>
                    <ShieldCheck className="h-4 w-4 text-status-nominal" />
                  </div>
                  <h4 className="text-xs font-bold text-cockpit-primary leading-snug">
                    {src.title}
                  </h4>
                  <p className="text-[11px] font-mono text-cockpit-muted">
                    {src.repository}
                  </p>
                  <ul className="space-y-1 pt-1 text-[11px] text-cockpit-primary/90">
                    {src.parametersDerived.map((param, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-accent-cyan">•</span>
                        <span>{param}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-mono text-accent-cyan hover:underline flex items-center gap-1 pt-1 border-t border-space-border/60"
                >
                  <span>Reference Portal</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Offline IndexedDB Store-and-Forward Burst Queue & Incident Audit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Queued Earth Burst Packets */}
          <div className="bg-space-void/90 border border-space-border rounded-lg p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cockpit-primary flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-accent-cyan" />
                SAVED SNAPSHOTS ({queuedBursts.length})
              </span>
              {queuedBursts.length > 0 ? (
                <button
                  type="button"
                  onClick={onClearBursts}
                  className="text-[11px] font-mono text-status-warning hover:underline"
                >
                  Clear saved snapshots
                </button>
              ) : null}
            </div>

            {queuedBursts.length === 0 ? (
              <p className="text-xs font-mono text-cockpit-muted py-4 text-center">
                No saved demo snapshots.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {queuedBursts.map((pkt) => (
                  <div
                    key={pkt.id ?? pkt.queuedAtIso}
                    className="p-2 rounded bg-space-elevated border border-space-border text-[11px] font-mono flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <span className="text-accent-cyan font-bold">{pkt.crewName}</span>
                      <span className="text-cockpit-muted"> • {pkt.conditionCode}</span>
                    </div>
                    <span className="text-status-nominal shrink-0">
                      Saved locally
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Local IndexedDB Clinical Incident Log */}
          <div className="bg-space-void/90 border border-space-border rounded-lg p-3.5 flex flex-col gap-2">
            <span className="text-xs font-mono font-bold text-cockpit-primary">
              DEMO ALERT LOG ({recentLogs.length})
            </span>

            {recentLogs.length === 0 ? (
              <p className="text-xs font-mono text-cockpit-muted py-4 text-center">
                Zero acute medical alarms logged during current session.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {recentLogs.map((log) => (
                  <div
                    key={log.id ?? log.timestampIso}
                    className="p-2 rounded bg-space-elevated border border-space-border text-[11px] font-mono flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <span className="text-cockpit-primary font-bold">
                        {log.crewName}
                      </span>
                      <span className="text-cockpit-muted"> — {log.conditionTitle}</span>
                    </div>
                    <span
                      className={
                        log.severity === 'CRITICAL'
                          ? 'text-status-critical font-bold'
                          : 'text-status-warning font-bold'
                      }
                    >
                      {log.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-space-border">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-5 py-2 rounded-lg bg-accent-cyan text-space-void font-mono font-bold text-xs"
          >
            CLOSE INSPECTOR
          </button>
        </div>
      </div>
    </div>
  );
}
