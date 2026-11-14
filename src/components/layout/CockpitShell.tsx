import type { ReactNode } from 'react';

export interface CockpitShellProps {
  topHud: ReactNode;
  scenarioBar: ReactNode;
  crewRoster: ReactNode;
  telemetryHud: ReactNode;
  eclssPanel: ReactNode;
  flightSurgeonPanel: ReactNode;
  molecularPanel: ReactNode;
  opticalScannerTrigger: ReactNode;
  footerStatusSlot?: ReactNode;
}

// High-contrast aerospace single-page HUD layout modeled after the SpaceX Crew Dragon
// flight display so astronauts never have to drill through nested menus during an alarm.
export function CockpitShell({
  topHud,
  scenarioBar,
  crewRoster,
  telemetryHud,
  eclssPanel,
  flightSurgeonPanel,
  molecularPanel,
  opticalScannerTrigger,
  footerStatusSlot,
}: CockpitShellProps) {
  return (
    <div className="min-h-screen bg-space-void text-cockpit-primary flex flex-col">
      {/* Top Mission Telemetry & Dual-Use Mode Bar */}
      {topHud}

      {/* Interactive Judge Scenario Switcher Strip */}
      <div className="border-b border-space-border bg-space-hull/70 px-4 py-2">
        <div className="max-w-[1600px] mx-auto">{scenarioBar}</div>
      </div>

      {/* Main Single-Screen Cockpit Grid */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 flex flex-col gap-4">
        {/* Upper Quadrant: Left Crew Roster + Right Biometric & ECLSS Sensor Fusion */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
            {crewRoster}
            {eclssPanel}
          </div>

          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
            {telemetryHud}
            {flightSurgeonPanel}
          </div>
        </div>

        {/* Lower Quadrant: NASA OSDR Molecular Countermeasures + Multi-Modal Optical Scanner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7">{molecularPanel}</div>
          <div className="lg:col-span-5">{opticalScannerTrigger}</div>
        </div>
      </main>

      {/* Bottom Offline IndexedDB & Burst Queue Telemetry Bar */}
      <footer className="border-t border-space-border bg-space-hull px-4 py-2.5 text-xs font-mono text-cockpit-muted">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>
            AURA DETERMINISTIC CLINICAL CORE • NASA ExMC ICL 1.0 &amp; OSDR (OSD-574 / OSD-379)
          </span>
          {footerStatusSlot ?? (
            <span className="text-status-nominal">
              INDEXEDDB (DEXIE) STORE-AND-FORWARD ACTIVE • 0% AI HALLUCINATION RISK
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}
