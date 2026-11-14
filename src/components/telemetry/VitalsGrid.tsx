import {
  Heart,
  Wind,
  Thermometer,
  Activity,
  Eye,
  Radiation,
  Gauge,
} from 'lucide-react';
import type { CrewHealthStatus, CrewMember, OperationalMode } from '../../types/crew';
import type { CrewTelemetryStream } from '../../types/telemetry';
import { BiometricCard } from './BiometricCard';
import { LiveEcgWaveform } from './LiveEcgWaveform';
import { CognitiveFatigueGauge } from './CognitiveFatigueGauge';

export interface VitalsGridProps {
  selectedCrew: CrewMember;
  telemetryStream: CrewTelemetryStream;
  ambientCo2Pct: number;
  operationalMode: OperationalMode;
}

function evaluateMetricStatus(
  value: number,
  warnLow: number,
  warnHigh: number,
  critLow: number,
  critHigh: number
): CrewHealthStatus {
  if (value <= critLow || value >= critHigh) return 'CRITICAL';
  if (value <= warnLow || value >= warnHigh) return 'WARNING';
  return 'NOMINAL';
}

export function VitalsGrid({
  selectedCrew,
  telemetryStream,
  ambientCo2Pct,
  operationalMode,
}: VitalsGridProps) {
  const { latestVitals, waveformWindow, status } = telemetryStream;
  const isMarsMode = operationalMode === 'MARS_TRANSIT';

  const hrStatus = evaluateMetricStatus(latestVitals.heartRateBpm, 54, 98, 45, 110);
  const spo2Status = evaluateMetricStatus(latestVitals.spO2Pct, 94, 101, 90, 102);
  const hrvStatus = evaluateMetricStatus(latestVitals.hrvRmssdMs, 30, 110, 20, 130);
  const respStatus = evaluateMetricStatus(latestVitals.respirationRateBrPm, 10, 20, 8, 23);
  const tempStatus = evaluateMetricStatus(latestVitals.coreTempCelsius, 36.2, 37.6, 35.5, 38.2);
  const fluidStatus = evaluateMetricStatus(
    latestVitals.fluidShift.venousEngorgementPct,
    -5,
    17,
    -10,
    20
  );
  const radStatus = evaluateMetricStatus(
    latestVitals.personalRadiationRateMsvHr,
    -1,
    1.5,
    -1,
    5.0
  );

  return (
    <section
      className="bg-space-hull border border-space-border rounded-xl p-3 flex flex-col gap-3"
      aria-label="Fused Biometric Telemetry HUD"
    >
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-space-border pb-2">
        <div className="flex items-center gap-2.5">
          <Gauge className="h-4 w-4 text-accent-cyan" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cockpit-primary">
            FUSED BIOMETRIC TELEMETRY HUD — SELECTED: {selectedCrew.name.toUpperCase()} (
            {selectedCrew.callsign})
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-cockpit-muted tabular-nums">
          <span>
            BP:{' '}
            <strong className="text-cockpit-primary">
              {latestVitals.systolicBpMmHg}/{latestVitals.diastolicBpMmHg} mmHg
            </strong>
          </span>
          <span>•</span>
          <span>
            {isMarsMode
              ? `MISSION DAY ${selectedCrew.missionDaysInMicrogravity} (0G)`
              : `FIELD TRIAGE MONITOR`}
          </span>
        </div>
      </div>

      {/* Continuous 60fps Sliding-Window Waveforms (3-Lead ECG + SpO2 PPG & HRV) */}
      <LiveEcgWaveform
        waveformWindow={waveformWindow}
        heartRateBpm={latestVitals.heartRateBpm}
        spO2Pct={latestVitals.spO2Pct}
        hrvRmssdMs={latestVitals.hrvRmssdMs}
        status={status}
      />

      {/* Primary 4-Column Biometric & Canaria Fatigue Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
        <BiometricCard
          title="HEART RATE (ECG)"
          primaryValue={String(latestVitals.heartRateBpm)}
          unit="BPM"
          secondaryLabel={`REST: ${selectedCrew.baseline.restingHeartRateBpm} BPM`}
          nominalRangeText="55 – 95 BPM"
          status={hrStatus}
          icon={<Heart className="h-4 w-4" />}
        />

        <BiometricCard
          title="BLOOD OXYGEN (SpO2)"
          primaryValue={latestVitals.spO2Pct.toFixed(1)}
          unit="%"
          secondaryLabel={`PP: ${latestVitals.systolicBpMmHg}/${latestVitals.diastolicBpMmHg}`}
          nominalRangeText="95.0 – 100.0%"
          status={spo2Status}
          icon={<Activity className="h-4 w-4" />}
        />

        <BiometricCard
          title="HRV RMSSD (STRESS)"
          primaryValue={String(latestVitals.hrvRmssdMs)}
          unit="ms"
          secondaryLabel={
            latestVitals.hrvRmssdMs < 25 ? 'SYMPATHETIC SURGE' : 'AUTONOMIC BALANCED'
          }
          nominalRangeText="> 30 ms (OSD-574)"
          status={hrvStatus}
          icon={<Activity className="h-4 w-4" />}
        />

        <CognitiveFatigueGauge
          fatigue={latestVitals.cognitiveFatigue}
          ambientCo2Pct={ambientCo2Pct}
        />
      </div>

      {/* Secondary 4-Column Core Temp, Respiration, Cephalic Fluid Shift & Dosimetry Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
        <BiometricCard
          title="CORE TEMPERATURE"
          primaryValue={latestVitals.coreTempCelsius.toFixed(1)}
          unit="°C"
          secondaryLabel={`SKIN: ${latestVitals.skinTempCelsius.toFixed(1)} °C`}
          nominalRangeText="36.3 – 37.5 °C"
          status={tempStatus}
          icon={<Thermometer className="h-4 w-4" />}
        />

        <BiometricCard
          title="RESPIRATION RATE"
          primaryValue={String(latestVitals.respirationRateBrPm)}
          unit="BrPM"
          secondaryLabel={`CO2: ${ambientCo2Pct.toFixed(2)}%`}
          nominalRangeText="12 – 20 BrPM"
          status={respStatus}
          icon={<Wind className="h-4 w-4" />}
        />

        <BiometricCard
          title={isMarsMode ? 'CEPHALIC FLUID SHIFT' : 'INTRACRANIAL / IOP'}
          primaryValue={`+${latestVitals.fluidShift.venousEngorgementPct}`}
          unit="% VENOUS"
          secondaryLabel={`IOP: ${latestVitals.fluidShift.intraocularPressureMmHg.toFixed(1)} mmHg`}
          nominalRangeText="< +18% | IOP < 18"
          status={fluidStatus}
          icon={<Eye className="h-4 w-4" />}
        />

        <BiometricCard
          title={isMarsMode ? 'PERSONAL DOSIMETER' : 'ENVIRONMENTAL RAD'}
          primaryValue={latestVitals.personalRadiationRateMsvHr.toFixed(2)}
          unit="mSv/h"
          secondaryLabel={`CAREER: ${latestVitals.cumulativeMissionDoseMsv.toFixed(1)}/${latestVitals.careerAlaraLimitMsv} mSv`}
          nominalRangeText="< 0.08 mSv/h ALARA"
          status={radStatus}
          icon={<Radiation className="h-4 w-4" />}
        />
      </div>
    </section>
  );
}
