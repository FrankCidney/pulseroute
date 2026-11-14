// --- Crew Status & Mission Mode Classifications ---

export type CrewHealthStatus = 'NOMINAL' | 'WARNING' | 'CRITICAL';

export type OperationalMode = 'MARS_TRANSIT' | 'EARTH_DUAL_USE';

export type CrewId = 'chen' | 'rivera' | 'vance' | 'rostov';

export interface FluidShiftMetrics {
  /** Percentage increase in jugular/cephalic venous volume relative to 1G baseline */
  venousEngorgementPct: number;
  /** Estimated intraocular pressure in mmHg (Earth nominal: 12-16 mmHg) */
  intraocularPressureMmHg: number;
  /** Optic nerve sheath diameter in mm (threshold > 5.8 mm indicates SANS risk) */
  opticNerveSheathMm: number;
  /** SANS clinical grading from 0 (None) to 3 (Frank Papilledema + Visual Scotoma) */
  sansGrade: 0 | 1 | 2 | 3;
  /** Whether Lower Body Negative Pressure (LBNP) countermeasure is currently recommended */
  lbnpRecommended: boolean;
}

export interface CrewBaselineProfile {
  restingHeartRateBpm: number;
  restingSpO2Pct: number;
  restingHrvRmssdMs: number;
  restingRespirationBrPm: number;
  coreTempCelsius: number;
  careerRadiationDoseMsv: number;
  careerAlaraLimitMsv: number;
}

export interface CrewMember {
  id: CrewId;
  name: string;
  callsign: string;
  spaceRole: string;
  earthClinicRole: string;
  missionDaysInMicrogravity: number;
  age: number;
  bloodType: string;
  status: CrewHealthStatus;
  vitalsHealthScorePct: number;
  activeAlertSummary: string | null;
  baseline: CrewBaselineProfile;
  fluidShift: FluidShiftMetrics;
}

// --- Default Artemis-VI Mars Transit Crew Roster ---
// Grounded in NASA LSDA and Inspiration4 (OSD-574) physiological baselines.

export const INITIAL_CREW_ROSTER: readonly CrewMember[] = [
  {
    id: 'chen',
    name: 'Cdr. Sarah Chen',
    callsign: 'ARIES-1',
    spaceRole: 'Mission Commander',
    earthClinicRole: 'Triage Bay 1 • Acute Trauma Lead',
    missionDaysInMicrogravity: 142,
    age: 41,
    bloodType: 'O+',
    status: 'NOMINAL',
    vitalsHealthScorePct: 98,
    activeAlertSummary: null,
    baseline: {
      restingHeartRateBpm: 68,
      restingSpO2Pct: 98.4,
      restingHrvRmssdMs: 64,
      restingRespirationBrPm: 14,
      coreTempCelsius: 36.9,
      careerRadiationDoseMsv: 184.2,
      careerAlaraLimitMsv: 600,
    },
    fluidShift: {
      venousEngorgementPct: 12,
      intraocularPressureMmHg: 15.2,
      opticNerveSheathMm: 5.3,
      sansGrade: 0,
      lbnpRecommended: false,
    },
  },
  {
    id: 'rivera',
    name: 'Pilot Alex Rivera',
    callsign: 'ARIES-2',
    spaceRole: 'Spacecraft Pilot & Navigation',
    earthClinicRole: 'Triage Bay 2 • Respiratory / High-Altitude Patient',
    missionDaysInMicrogravity: 142,
    age: 36,
    bloodType: 'A-',
    status: 'NOMINAL',
    vitalsHealthScorePct: 95,
    activeAlertSummary: null,
    baseline: {
      restingHeartRateBpm: 72,
      restingSpO2Pct: 98.0,
      restingHrvRmssdMs: 58,
      restingRespirationBrPm: 15,
      coreTempCelsius: 37.0,
      careerRadiationDoseMsv: 162.8,
      careerAlaraLimitMsv: 600,
    },
    fluidShift: {
      venousEngorgementPct: 15,
      intraocularPressureMmHg: 16.4,
      opticNerveSheathMm: 5.6,
      sansGrade: 1,
      lbnpRecommended: false,
    },
  },
  {
    id: 'vance',
    name: 'Dr. Marcus Vance',
    callsign: 'ARIES-3',
    spaceRole: 'Crew Medical Officer & Payload Specialist',
    earthClinicRole: 'Triage Bay 3 • Field Paramedic',
    missionDaysInMicrogravity: 142,
    age: 44,
    bloodType: 'B+',
    status: 'NOMINAL',
    vitalsHealthScorePct: 97,
    activeAlertSummary: null,
    baseline: {
      restingHeartRateBpm: 65,
      restingSpO2Pct: 98.7,
      restingHrvRmssdMs: 69,
      restingRespirationBrPm: 13,
      coreTempCelsius: 36.8,
      careerRadiationDoseMsv: 210.5,
      careerAlaraLimitMsv: 600,
    },
    fluidShift: {
      venousEngorgementPct: 11,
      intraocularPressureMmHg: 14.8,
      opticNerveSheathMm: 5.1,
      sansGrade: 0,
      lbnpRecommended: false,
    },
  },
  {
    id: 'rostov',
    name: 'Eng. Elena Rostov',
    callsign: 'ARIES-4',
    spaceRole: 'ECLSS & Propulsion Flight Engineer',
    earthClinicRole: 'Triage Bay 4 • Shift Worker Fatigue Monitoring',
    missionDaysInMicrogravity: 142,
    age: 34,
    bloodType: 'AB+',
    status: 'NOMINAL',
    vitalsHealthScorePct: 94,
    activeAlertSummary: null,
    baseline: {
      restingHeartRateBpm: 70,
      restingSpO2Pct: 98.1,
      restingHrvRmssdMs: 54,
      restingRespirationBrPm: 15,
      coreTempCelsius: 37.1,
      careerRadiationDoseMsv: 148.9,
      careerAlaraLimitMsv: 600,
    },
    fluidShift: {
      venousEngorgementPct: 14,
      intraocularPressureMmHg: 15.9,
      opticNerveSheathMm: 5.4,
      sansGrade: 0,
      lbnpRecommended: false,
    },
  },
];
