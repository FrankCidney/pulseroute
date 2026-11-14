import { Wind, Gauge, Thermometer, Droplets } from 'lucide-react';
import type { EclssEnvironment } from '../../types/environment';
import type { OperationalMode } from '../../types/crew';

export interface CabinAtmosphereProps {
  environment: EclssEnvironment;
  operationalMode: OperationalMode;
}

export function CabinAtmosphere({
  environment,
  operationalMode,
}: CabinAtmosphereProps) {
  const isMarsMode = operationalMode === 'MARS_TRANSIT';

  const pressureCrit = environment.cabinPressurePsi < 12.2;
  const pressureWarn = environment.cabinPressurePsi < 13.8 && !pressureCrit;

  const co2Crit = environment.cabinCo2Pct >= 0.5;
  const co2Warn = environment.cabinCo2Pct >= 0.35 && !co2Crit;

  const o2Crit = environment.cabinO2Pct < 18.0;
  const o2Warn = environment.cabinO2Pct < 19.5 && !o2Crit;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {/* Cabin Total Pressure */}
      <div
        className={`bg-space-void/90 border rounded-lg p-2.5 flex flex-col justify-between gap-1 ${
          pressureCrit
            ? 'border-status-critical'
            : pressureWarn
              ? 'border-status-warning'
              : 'border-space-border'
        }`}
      >
        <div className="flex items-center justify-between text-[10px] font-mono text-cockpit-muted">
          <span className="flex items-center gap-1">
            <Gauge className="h-3.5 w-3.5 text-accent-cyan" />
            {isMarsMode ? 'CABIN PRESSURE' : 'BAROMETRIC'}
          </span>
          <span>14.7 NOM</span>
        </div>
        <div className="font-mono tabular-nums flex items-baseline gap-1">
          <span
            className={`text-lg font-bold ${
              pressureCrit
                ? 'text-status-critical'
                : pressureWarn
                  ? 'text-status-warning'
                  : 'text-cockpit-primary'
            }`}
          >
            {environment.cabinPressurePsi.toFixed(1)}
          </span>
          <span className="text-[11px] text-cockpit-muted">psi</span>
        </div>
      </div>

      {/* Cabin Carbon Dioxide (pCO2) */}
      <div
        className={`bg-space-void/90 border rounded-lg p-2.5 flex flex-col justify-between gap-1 ${
          co2Crit
            ? 'border-status-critical'
            : co2Warn
              ? 'border-status-warning'
              : 'border-space-border'
        }`}
      >
        <div className="flex items-center justify-between text-[10px] font-mono text-cockpit-muted">
          <span className="flex items-center gap-1">
            <Wind className="h-3.5 w-3.5 text-accent-cyan" />
            {isMarsMode ? 'CABIN pCO2' : 'AMBIENT CO2'}
          </span>
          <span>{environment.cabinCo2MmHg.toFixed(1)} mmHg</span>
        </div>
        <div className="font-mono tabular-nums flex items-baseline gap-1">
          <span
            className={`text-lg font-bold ${
              co2Crit
                ? 'text-status-critical'
                : co2Warn
                  ? 'text-status-warning'
                  : 'text-cockpit-primary'
            }`}
          >
            {environment.cabinCo2Pct.toFixed(2)}
          </span>
          <span className="text-[11px] text-cockpit-muted">%</span>
        </div>
      </div>

      {/* Cabin Oxygen (pO2) */}
      <div
        className={`bg-space-void/90 border rounded-lg p-2.5 flex flex-col justify-between gap-1 ${
          o2Crit
            ? 'border-status-critical'
            : o2Warn
              ? 'border-status-warning'
              : 'border-space-border'
        }`}
      >
        <div className="flex items-center justify-between text-[10px] font-mono text-cockpit-muted">
          <span className="flex items-center gap-1">
            <Droplets className="h-3.5 w-3.5 text-accent-cyan" />
            {isMarsMode ? 'CABIN pO2' : 'ROOM O2'}
          </span>
          <span>21.0% NOM</span>
        </div>
        <div className="font-mono tabular-nums flex items-baseline gap-1">
          <span
            className={`text-lg font-bold ${
              o2Crit
                ? 'text-status-critical'
                : o2Warn
                  ? 'text-status-warning'
                  : 'text-cockpit-primary'
            }`}
          >
            {environment.cabinO2Pct.toFixed(1)}
          </span>
          <span className="text-[11px] text-cockpit-muted">%</span>
        </div>
      </div>

      {/* Ambient Temp & Humidity */}
      <div className="bg-space-void/90 border border-space-border rounded-lg p-2.5 flex flex-col justify-between gap-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-cockpit-muted">
          <span className="flex items-center gap-1">
            <Thermometer className="h-3.5 w-3.5 text-accent-cyan" />
            TEMP / RH
          </span>
          <span>{environment.relativeHumidityPct}% RH</span>
        </div>
        <div className="font-mono tabular-nums flex items-baseline gap-1">
          <span className="text-lg font-bold text-cockpit-primary">
            {environment.ambientTempCelsius.toFixed(1)}
          </span>
          <span className="text-[11px] text-cockpit-muted">°C</span>
        </div>
      </div>
    </div>
  );
}
