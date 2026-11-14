import { Activity, ShieldCheck, Radio } from 'lucide-react';

// Initial cockpit shell entry point before per-member domain modules are merged.
export function App() {
  return (
    <div className="min-h-screen bg-space-void text-cockpit-primary flex flex-col justify-between p-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-space-border bg-space-hull px-5 py-4 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent-cyan/10 border border-accent-cyan/40 flex items-center justify-center text-accent-cyan">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-wider uppercase">AURA Flight Surgeon</h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-status-nominal/15 text-status-nominal border border-status-nominal/30">
                LOCAL AUTONOMOUS
              </span>
            </div>
            <p className="text-xs text-cockpit-muted font-mono">
              MISSION: ARTEMIS-VI MARS TRANSIT | COMMS DELAY: +18m 42s RTT
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-cockpit-muted">
          <span className="flex items-center gap-1.5 text-status-nominal">
            <ShieldCheck className="h-4 w-4" />
            ExMC ICL 1.0 READY
          </span>
          <span className="flex items-center gap-1.5 text-accent-cyan">
            <Radio className="h-4 w-4" />
            OFFLINE PWA ACTIVE
          </span>
        </div>
      </header>

      <main className="my-auto text-center max-w-xl mx-auto space-y-3">
        <p className="text-sm font-mono uppercase tracking-widest text-accent-cyan">
          Autonomous Universal Rescue &amp; Astronaut Health Monitor
        </p>
        <h2 className="text-2xl font-semibold text-cockpit-primary">
          Spacecraft Telemetry &amp; Clinical Triage Cockpit Initialized
        </h2>
        <p className="text-sm text-cockpit-muted">
          Multi-sensor fusion core ready for biometric streams, ECLSS cabin telemetry, and deterministic NASA ExMC clinical evaluation.
        </p>
      </main>

      <footer className="border-t border-space-border pt-3 flex items-center justify-between text-xs font-mono text-cockpit-muted">
        <span>NASA OSDR (OSD-574 / OSD-379) &amp; ExMC ICL 1.0</span>
        <span>100% OFFLINE-FIRST ARCHITECTURE</span>
      </footer>
    </div>
  );
}

export default App;
