import type { CrewHealthStatus, CrewId, FluidShiftMetrics } from './crew';

// --- Wearable Astroskin Biometric Telemetry & Canaria Fatigue Contracts ---

export interface EcgWaveformPoint {
  sampleIndex: number;
  timestampLabel: string;
  /** Lead II millivolt potential (-0.6 mV to +1.8 mV) */
  ecgMv: number;
  /** Photoplethysmogram (PPG) normalized oxygen pulse wave (0-100) */
  ppgWave: number;
  /** Instantaneous HRV RMSSD trend point in ms */
  hrvMs: number;
}

export interface CognitiveFatigueMetrics {
  /** Composite Canaria Fatigue Index (0 = peak alertness, 100 = severe impairment) */
  fatigueIndexPct: number;
  /** Projected fatigue index 4 hours ahead given current cabin CO2 and sleep debt */
  projected4HrIndexPct: number;
  /** Cumulative sleep deficit over the past 72 hours (in hours) */
  sleepDebt72HrHours: number;
  /** Estimated reaction time slowdown in milliseconds relative to astronaut baseline */
  reactionLatencyPenaltyMs: number;
  /** Circadian alignment phase status */
  circadianPhaseStatus: 'ALIGNED' | 'PHASE_DELAYED' | 'SEVERE_DESYNC';
  /** Whether the crew member is cleared for high-risk EVA or docking maneuvers */
  evaCleared: boolean;
}

export interface BiometricVitals {
  crewId: CrewId;
  timestampMs: number;
  heartRateBpm: number;
  spO2Pct: number;
  respirationRateBrPm: number;
  hrvRmssdMs: number;
  coreTempCelsius: number;
  skinTempCelsius: number;
  systolicBpMmHg: number;
  diastolicBpMmHg: number;
  personalRadiationRateMsvHr: number;
  cumulativeMissionDoseMsv: number;
  careerAlaraLimitMsv: number;
  fluidShift: FluidShiftMetrics;
  cognitiveFatigue: CognitiveFatigueMetrics;
}

export interface CrewTelemetryStream {
  crewId: CrewId;
  latestVitals: BiometricVitals;
  status: CrewHealthStatus;
  /** Fixed-length sliding window (36 points) for 60fps Recharts rendering without memory growth */
  waveformWindow: readonly EcgWaveformPoint[];
}
