import { INITIAL_CREW_ROSTER, type CrewId, type CrewMember } from '../types/crew';
import type {
  BiometricVitals,
  CrewTelemetryStream,
  EcgWaveformPoint,
} from '../types/telemetry';
import type { EclssEnvironment, HabitatCompartmentStatus } from '../types/environment';
import { calculateCognitiveFatigueIndex } from '../components/telemetry/CognitiveFatigueGauge';
import { evaluateSansAndFluidShift } from '../engine/fluidShiftTracker';
import { evaluateClinicalDiagnosis } from '../engine/clinicalEngine';
import type { ClinicalDiagnosisVerdict } from '../types/diagnosis';
import { getScenarioPresetById, type ScenarioId } from './scenarioPresets';

const WAVEFORM_WINDOW_SIZE = 36;

// Synthesizes a realistic P-QRS-T Lead II ECG sample and PPG pulse wave for a given phase index.
function synthesizeEcgAndPpgPoint(
  sampleIndex: number,
  heartRateBpm: number,
  spO2Pct: number,
  hrvRmssdMs: number
): EcgWaveformPoint {
  // Cycle length scales with heart rate so tachycardia visibly compresses R-R intervals
  const period = Math.max(5, Math.round((60 / Math.max(45, heartRateBpm)) * 8));
  const phase = sampleIndex % period;

  let ecgMv = 0.04 * Math.sin(sampleIndex * 0.7);
  if (phase === 1) ecgMv = 0.22; // P wave
  else if (phase === 2) ecgMv = -0.18; // Q dip
  else if (phase === 3) ecgMv = 1.55; // R peak
  else if (phase === 4) ecgMv = -0.38; // S trough
  else if (phase === 6) ecgMv = 0.34; // T wave

  // Add subtle physiological micro-jitter
  const jitter = ((sampleIndex * 17) % 7 - 3) * 0.015;
  const clampedEcg = Number((ecgMv + jitter).toFixed(2));

  // PPG oxygen wave scales with SpO2 perfusion
  const ppgAmplitude = (spO2Pct / 100) * 42;
  const ppgWave = Number(
    (52 + ppgAmplitude * Math.sin((phase / period) * Math.PI * 2)).toFixed(1)
  );

  const hrvPoint = Math.max(12, Math.round(hrvRmssdMs + Math.sin(sampleIndex * 0.4) * 3));

  return {
    sampleIndex,
    timestampLabel: `T+${sampleIndex}s`,
    ecgMv: clampedEcg,
    ppgWave,
    hrvMs: hrvPoint,
  };
}

export interface SimulationTickSnapshot {
  tickCount: number;
  scenarioId: ScenarioId;
  environment: EclssEnvironment;
  crewRoster: readonly CrewMember[];
  streamsByCrewId: Record<CrewId, CrewTelemetryStream>;
  verdictsByCrewId: Record<CrewId, ClinicalDiagnosisVerdict>;
}

// Generates a complete initial 36-point waveform ring buffer so charts are populated on mount.
function buildInitialWaveformWindow(
  heartRateBpm: number,
  spO2Pct: number,
  hrvRmssdMs: number
): EcgWaveformPoint[] {
  const points: EcgWaveformPoint[] = [];
  for (let i = 0; i < WAVEFORM_WINDOW_SIZE; i += 1) {
    points.push(synthesizeEcgAndPpgPoint(i, heartRateBpm, spO2Pct, hrvRmssdMs));
  }
  return points;
}

export function createSimulationTickSnapshot(params: {
  tickCount: number;
  scenarioId: ScenarioId;
  previousStreams?: Record<CrewId, CrewTelemetryStream>;
}): SimulationTickSnapshot {
  const { tickCount, scenarioId, previousStreams } = params;
  const preset = getScenarioPresetById(scenarioId);
  const nowMs = Date.now();

  // Deterministic pseudo-random harmonic oscillation so numbers breathe realistically on 1Hz ticks
  const harmonicA = Math.sin(tickCount * 0.65);
  const harmonicB = Math.cos(tickCount * 0.45);

  // 1. Build Spacecraft ECLSS Environment
  const cabinPressurePsi = Number(
    (preset.eclssTarget.cabinPressurePsi + harmonicA * 0.05).toFixed(2)
  );
  const cabinCo2Pct = Number(
    Math.max(0.05, preset.eclssTarget.cabinCo2Pct + harmonicB * 0.01).toFixed(2)
  );
  const cabinCo2MmHg = Number(((cabinCo2Pct / 100) * 760).toFixed(2));
  const cabinO2Pct = Number(
    (preset.eclssTarget.cabinO2Pct + harmonicA * 0.05).toFixed(1)
  );
  const radiationDoseRateMsvHr = Number(
    Math.max(0.02, preset.eclssTarget.radiationDoseRateMsvHr + harmonicB * 0.03).toFixed(2)
  );

  const envOverallStatus =
    cabinPressurePsi < 12.2 || cabinCo2Pct >= 0.5 || radiationDoseRateMsvHr >= 5.0
      ? 'CRITICAL'
      : cabinPressurePsi < 13.8 || cabinCo2Pct >= 0.35 || radiationDoseRateMsvHr >= 0.5
        ? 'WARNING'
        : 'NOMINAL';

  const compartments: HabitatCompartmentStatus[] = [
    {
      moduleId: 'MOD_A_HAB',
      name: 'Module A • Crew Quarters & Galley',
      earthClinicZoneName: 'Ward A • Acute Triage Bay',
      pressurePsi: Number(Math.max(13.9, cabinPressurePsi).toFixed(1)),
      cdraScrubberHealthPct: 96,
      status: radiationDoseRateMsvHr >= 5.0 ? 'WARNING' : 'NOMINAL',
      statusNote:
        radiationDoseRateMsvHr >= 5.0
          ? 'SPE Proton Flux Warning — Evacuate to Shelter'
          : 'Atmosphere & Scrubber Nominal',
    },
    {
      moduleId: 'MOD_B_LAB',
      name: 'Module B • Life Sciences Lab',
      earthClinicZoneName: 'Ward B • Respiratory Isolation',
      pressurePsi: cabinPressurePsi,
      cdraScrubberHealthPct: 100 - preset.eclssTarget.cdraLiOhSaturationPct,
      status:
        cabinPressurePsi < 12.2 || cabinCo2Pct >= 0.5
          ? 'CRITICAL'
          : cabinCo2Pct >= 0.35
            ? 'WARNING'
            : 'NOMINAL',
      statusNote:
        cabinPressurePsi < 12.2
          ? 'Hull Pressure Drop — Isolate Hatch H-02'
          : cabinCo2Pct >= 0.5
            ? 'LiOH Canister Saturated — Swap CDRA B-02'
            : 'Nominal Lab Ventilation',
    },
    {
      moduleId: 'AIRLOCK_SHELTER',
      name: 'Central Water-Wall Storm Shelter',
      earthClinicZoneName: 'Bunker C • Shielded Clean Zone',
      pressurePsi: 14.7,
      cdraScrubberHealthPct: 99,
      status: 'NOMINAL',
      statusNote: preset.eclssTarget.stormShelterActive
        ? 'ACTIVE CREW REFUGE (Polyethylene + H2O Shielded)'
        : 'Standby Emergency Shelter Ready',
    },
  ];

  const environment: EclssEnvironment = {
    timestampMs: nowMs,
    cabinPressurePsi,
    cabinCo2Pct,
    cabinCo2MmHg,
    cabinO2Pct,
    radiationDoseRateMsvHr,
    ambientTempCelsius: Number(
      (preset.eclssTarget.ambientTempCelsius + harmonicA * 0.1).toFixed(1)
    ),
    relativeHumidityPct: preset.eclssTarget.relativeHumidityPct,
    solarProtonFluxPfu: preset.eclssTarget.solarProtonFluxPfu,
    cdraLiOhSaturationPct: preset.eclssTarget.cdraLiOhSaturationPct,
    stormShelterActive: preset.eclssTarget.stormShelterActive,
    overallStatus: envOverallStatus,
    compartments,
  };

  // 2. Build Per-Crew Biometrics, Waveforms, and Deterministic Clinical Verdicts
  const streamsByCrewId = {} as Record<CrewId, CrewTelemetryStream>;
  const verdictsByCrewId = {} as Record<CrewId, ClinicalDiagnosisVerdict>;
  const updatedRoster: CrewMember[] = [];

  INITIAL_CREW_ROSTER.forEach((baseMember, idx) => {
    const override = preset.crewOverrides[baseMember.id] ?? {};
    const phaseShift = Math.sin(tickCount * 0.8 + idx * 1.3);

    const heartRateBpm = Math.round(
      (override.heartRateBpm ?? baseMember.baseline.restingHeartRateBpm) + phaseShift * 1.8
    );
    const spO2Pct = Number(
      Math.min(
        100,
        (override.spO2Pct ?? baseMember.baseline.restingSpO2Pct) + phaseShift * 0.2
      ).toFixed(1)
    );
    const respirationRateBrPm = Math.round(
      (override.respirationRateBrPm ?? baseMember.baseline.restingRespirationBrPm) +
        Math.max(-1, Math.min(1, phaseShift))
    );
    const hrvRmssdMs = Math.max(
      14,
      Math.round(
        (override.hrvRmssdMs ?? baseMember.baseline.restingHrvRmssdMs) - phaseShift * 1.5
      )
    );
    const coreTempCelsius = Number(
      (
        (override.coreTempCelsius ?? baseMember.baseline.coreTempCelsius) +
        phaseShift * 0.04
      ).toFixed(1)
    );
    const personalRadiationRateMsvHr = Number(
      Math.max(
        0.03,
        (override.personalRadiationRateMsvHr ?? radiationDoseRateMsvHr) + phaseShift * 0.02
      ).toFixed(2)
    );

    const sleepDebt72HrHours = override.sleepDebt72HrHours ?? (idx === 3 ? 3.2 : 1.5);

    const cognitiveFatigue = calculateCognitiveFatigueIndex({
      sleepDebt72HrHours,
      hrvRmssdMs,
      baselineHrvMs: baseMember.baseline.restingHrvRmssdMs,
      ambientCo2Pct: cabinCo2Pct,
    });

    const sansEval = evaluateSansAndFluidShift({
      missionDaysInMicrogravity: baseMember.missionDaysInMicrogravity,
      venousEngorgementPct:
        override.venousEngorgementPct ?? baseMember.fluidShift.venousEngorgementPct,
      intraocularPressureMmHg:
        override.intraocularPressureMmHg ?? baseMember.fluidShift.intraocularPressureMmHg,
      opticNerveSheathMm:
        override.opticNerveSheathMm ?? baseMember.fluidShift.opticNerveSheathMm,
      ambientCo2Pct: cabinCo2Pct,
    });

    const latestVitals: BiometricVitals = {
      crewId: baseMember.id,
      timestampMs: nowMs,
      heartRateBpm,
      spO2Pct,
      respirationRateBrPm,
      hrvRmssdMs,
      coreTempCelsius,
      skinTempCelsius: Number((coreTempCelsius - 3.6).toFixed(1)),
      systolicBpMmHg: override.systolicBpMmHg ?? 118 + idx * 3,
      diastolicBpMmHg: override.diastolicBpMmHg ?? 76 + idx * 2,
      personalRadiationRateMsvHr,
      cumulativeMissionDoseMsv: Number(
        (baseMember.baseline.careerRadiationDoseMsv + tickCount * 0.002).toFixed(1)
      ),
      careerAlaraLimitMsv: baseMember.baseline.careerAlaraLimitMsv,
      fluidShift: sansEval.metrics,
      cognitiveFatigue,
    };

    const verdict = evaluateClinicalDiagnosis({
      vitals: latestVitals,
      eclss: environment,
      missionDaysInMicrogravity: baseMember.missionDaysInMicrogravity,
    });

    verdictsByCrewId[baseMember.id] = verdict;

    const prevWindow = previousStreams?.[baseMember.id]?.waveformWindow;
    const nextPoint = synthesizeEcgAndPpgPoint(
      tickCount + WAVEFORM_WINDOW_SIZE,
      heartRateBpm,
      spO2Pct,
      hrvRmssdMs
    );

    const waveformWindow = prevWindow
      ? [...prevWindow.slice(1), nextPoint]
      : buildInitialWaveformWindow(heartRateBpm, spO2Pct, hrvRmssdMs);

    streamsByCrewId[baseMember.id] = {
      crewId: baseMember.id,
      latestVitals,
      status: verdict.crewStatus,
      waveformWindow,
    };

    // Compute holistic vitals health score (0-100%)
    const scorePenalty =
      verdict.crewStatus === 'CRITICAL'
        ? 34
        : verdict.crewStatus === 'WARNING'
          ? 16
          : 0;

    updatedRoster.push({
      ...baseMember,
      status: verdict.crewStatus,
      vitalsHealthScorePct: Math.max(52, baseMember.vitalsHealthScorePct - scorePenalty),
      activeAlertSummary:
        verdict.primaryConditionId === 'NOMINAL_STATE' ? null : verdict.title,
      fluidShift: sansEval.metrics,
    });
  });

  return {
    tickCount,
    scenarioId,
    environment,
    crewRoster: updatedRoster,
    streamsByCrewId,
    verdictsByCrewId,
  };
}
