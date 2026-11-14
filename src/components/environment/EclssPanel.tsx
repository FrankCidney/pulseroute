import { Shield, Radiation, Cpu, AlertTriangle } from 'lucide-react';
import type { EclssEnvironment } from '../../types/environment';
import type { OperationalMode } from '../../types/crew';
import { CabinAtmosphere } from './CabinAtmosphere';

export interface EclssPanelProps {
  environment: EclssEnvironment;
  operationalMode: OperationalMode;
}

export function EclssPanel({ environment, operationalMode }: EclssPanelProps) {
  const isMarsMode = operationalMode === 'MARS_TRANSIT';
  const radEmergency = environment.radiationDoseRateMsvHr >= 5.0;
  const radElevated = environment.radiationDoseRateMsvHr >= 0.5 && !radEmergency;

  return (
    <section
      className="bg-space-hull border border-space-border rounded-xl p-4 flex flex-col gap-3"
      aria-label={
        isMarsMode
          ? 'Spacecraft Cabin Environment ECLSS Telemetry'
          : 'Field Clinic Environmental & Hazmat Telemetry'
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-space-border pb-2.5">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-accent-cyan" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cockpit-primary">
            {isMarsMode
              ? 'SPACECRAFT CABIN (ECLSS TELEMETRY)'
              : 'WARD ENVIRONMENT & HAZMAT SENSORS'}
          </h2>
        </div>
        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
            environment.overallStatus === 'CRITICAL'
              ? 'bg-status-critical/20 text-status-critical border-status-critical'
              : environment.overallStatus === 'WARNING'
                ? 'bg-status-warning/15 text-status-warning border-status-warning/40'
                : 'bg-status-nominal/15 text-status-nominal border-status-nominal/30'
          }`}
        >
          {environment.overallStatus}
        </span>
      </div>

      {/* 4-Parameter Atmospheric Gas Monitor */}
      <CabinAtmosphere environment={environment} operationalMode={operationalMode} />

      {/* Ionizing Radiation Dosimetry & Solar Proton Flux Box */}
      <div
        className={`rounded-lg p-3 border flex flex-col gap-1.5 font-mono ${
          radEmergency
            ? 'bg-status-critical/15 border-status-critical'
            : radElevated
              ? 'bg-status-warning/10 border-status-warning/50'
              : 'bg-space-void/90 border-space-border'
        }`}
      >
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-cockpit-muted">
            <Radiation
              className={`h-4 w-4 ${
                radEmergency
                  ? 'text-status-critical animate-spin'
                  : 'text-status-warning'
              }`}
            />
            {isMarsMode ? 'HABITAT DOSIMETER RATE' : 'IONIZING DOSIMETER'}
          </span>
          <span
            className={`text-sm font-bold tabular-nums ${
              radEmergency
                ? 'text-status-critical'
                : radElevated
                  ? 'text-status-warning'
                  : 'text-cockpit-primary'
            }`}
          >
            {environment.radiationDoseRateMsvHr.toFixed(2)} mSv/h
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-cockpit-muted tabular-nums">
          <span>
            {isMarsMode
              ? `SPE PROTON FLUX: ${environment.solarProtonFluxPfu} PFU`
              : `CDRA AIR SCRUBBER LOAD: ${environment.cdraLiOhSaturationPct}%`}
          </span>
          <span className="text-accent-cyan">
            {environment.stormShelterActive ? 'SHELTER PROTOCOL ACTIVE' : 'SHIELDING NOMINAL'}
          </span>
        </div>
      </div>

      {/* Habitat Module Compartment Status List */}
      <div className="space-y-1.5 pt-1 border-t border-space-border/60">
        <span className="text-[10px] font-mono uppercase tracking-wider text-cockpit-muted block">
          {isMarsMode ? 'HABITAT COMPARTMENT ISOLATION STATUS' : 'CLINIC ZONE STATUS'}
        </span>

        {environment.compartments.map((comp) => {
          const isCrit = comp.status === 'CRITICAL';
          const isWarn = comp.status === 'WARNING';

          return (
            <div
              key={comp.moduleId}
              className="bg-space-void/70 border border-space-border rounded-md px-2.5 py-1.5 flex items-center justify-between text-xs font-mono"
            >
              <div className="flex items-center gap-2 min-w-0">
                {isCrit || isWarn ? (
                  <AlertTriangle
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isCrit ? 'text-status-critical' : 'text-status-warning'
                    }`}
                  />
                ) : (
                  <Shield className="h-3.5 w-3.5 text-status-nominal shrink-0" />
                )}
                <div className="truncate">
                  <span className="text-cockpit-primary font-semibold">
                    {isMarsMode ? comp.name : comp.earthClinicZoneName}
                  </span>
                  <span className="text-[11px] text-cockpit-muted block truncate">
                    {comp.statusNote}
                  </span>
                </div>
              </div>

              <span className="text-[11px] tabular-nums text-cockpit-muted shrink-0 ml-2">
                {comp.pressurePsi.toFixed(1)} psi
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
