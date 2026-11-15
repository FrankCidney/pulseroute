import type { CrewId } from '../types/crew';

// --- Judge Scenario Switcher Presets ---

export type ScenarioId =
  | 'NORMAL_CRUISE'
  | 'SOLAR_STORM_SPE'
  | 'CABIN_CO2_LEAK'
  | 'ACUTE_HYPOXIA'
  | 'SANS_FLUID_SHIFT';

export interface ScenarioCrewOverride {
  heartRateBpm: number;
  spO2Pct: number;
  respirationRateBrPm: number;
  hrvRmssdMs: number;
  coreTempCelsius: number;
  systolicBpMmHg: number;
  diastolicBpMmHg: number;
  personalRadiationRateMsvHr: number;
  sleepDebt72HrHours: number;
  venousEngorgementPct: number;
  intraocularPressureMmHg: number;
  opticNerveSheathMm: number;
}

export interface ScenarioPreset {
  id: ScenarioId;
  numberLabel: number;
  shortTitle: string;
  earthClinicTitle: string;
  subtitle: string;
  primaryAffectedCrewId: CrewId;
  eclssTarget: {
    cabinPressurePsi: number;
    cabinCo2Pct: number;
    cabinO2Pct: number;
    radiationDoseRateMsvHr: number;
    ambientTempCelsius: number;
    relativeHumidityPct: number;
    solarProtonFluxPfu: number;
    cdraLiOhSaturationPct: number;
    stormShelterActive: boolean;
  };
  crewOverrides: Partial<Record<CrewId, Partial<ScenarioCrewOverride>>>;
}

export const JUDGE_SCENARIO_PRESETS: readonly ScenarioPreset[] = [
  {
    id: 'NORMAL_CRUISE',
    numberLabel: 1,
    shortTitle: 'Normal baseline',
    earthClinicTitle: 'Nominal Ward Baseline',
    subtitle: 'All sample readings are within their normal demo ranges.',
    primaryAffectedCrewId: 'chen',
    eclssTarget: {
      cabinPressurePsi: 14.7,
      cabinCo2Pct: 0.14,
      cabinO2Pct: 21.0,
      radiationDoseRateMsvHr: 0.04,
      ambientTempCelsius: 21.2,
      relativeHumidityPct: 44,
      solarProtonFluxPfu: 1.2,
      cdraLiOhSaturationPct: 18,
      stormShelterActive: false,
    },
    crewOverrides: {},
  },
  {
    id: 'SOLAR_STORM_SPE',
    numberLabel: 2,
    shortTitle: 'Solar storm',
    earthClinicTitle: 'Radiation / Hazmat Spike',
    subtitle: 'A simulated radiation increase prompts a shelter warning.',
    primaryAffectedCrewId: 'chen',
    eclssTarget: {
      cabinPressurePsi: 14.7,
      cabinCo2Pct: 0.18,
      cabinO2Pct: 20.9,
      radiationDoseRateMsvHr: 8.5,
      ambientTempCelsius: 21.6,
      relativeHumidityPct: 45,
      solarProtonFluxPfu: 480,
      cdraLiOhSaturationPct: 24,
      stormShelterActive: true,
    },
    crewOverrides: {
      chen: {
        heartRateBpm: 94,
        hrvRmssdMs: 34,
        personalRadiationRateMsvHr: 8.5,
      },
      rivera: {
        heartRateBpm: 98,
        hrvRmssdMs: 31,
        personalRadiationRateMsvHr: 8.2,
      },
      vance: {
        heartRateBpm: 88,
        personalRadiationRateMsvHr: 7.9,
      },
      rostov: {
        heartRateBpm: 92,
        personalRadiationRateMsvHr: 8.4,
      },
    },
  },
  {
    id: 'CABIN_CO2_LEAK',
    numberLabel: 3,
    shortTitle: 'High cabin CO2',
    earthClinicTitle: 'Hypercapnia / Scrubber Failure',
    subtitle: 'A simulated cabin-air problem raises carbon dioxide readings.',
    primaryAffectedCrewId: 'rostov',
    eclssTarget: {
      cabinPressurePsi: 14.6,
      cabinCo2Pct: 0.62,
      cabinO2Pct: 20.3,
      radiationDoseRateMsvHr: 0.05,
      ambientTempCelsius: 22.4,
      relativeHumidityPct: 54,
      solarProtonFluxPfu: 1.4,
      cdraLiOhSaturationPct: 94,
      stormShelterActive: false,
    },
    crewOverrides: {
      rostov: {
        heartRateBpm: 102,
        spO2Pct: 95.2,
        respirationRateBrPm: 25,
        hrvRmssdMs: 21,
        sleepDebt72HrHours: 7.4,
      },
      chen: {
        heartRateBpm: 89,
        respirationRateBrPm: 23,
        hrvRmssdMs: 29,
        sleepDebt72HrHours: 4.5,
      },
    },
  },
  {
    id: 'ACUTE_HYPOXIA',
    numberLabel: 4,
    shortTitle: 'Low cabin pressure',
    earthClinicTitle: 'Acute Hypoxemic Crisis',
    subtitle: 'A simulated pressure drop lowers a crew member’s blood-oxygen reading.',
    primaryAffectedCrewId: 'rivera',
    eclssTarget: {
      cabinPressurePsi: 10.8,
      cabinCo2Pct: 0.19,
      cabinO2Pct: 15.8,
      radiationDoseRateMsvHr: 0.04,
      ambientTempCelsius: 19.4,
      relativeHumidityPct: 36,
      solarProtonFluxPfu: 1.2,
      cdraLiOhSaturationPct: 28,
      stormShelterActive: false,
    },
    crewOverrides: {
      rivera: {
        heartRateBpm: 118,
        spO2Pct: 87.2,
        respirationRateBrPm: 26,
        hrvRmssdMs: 19,
        systolicBpMmHg: 142,
        diastolicBpMmHg: 92,
      },
      chen: {
        heartRateBpm: 96,
        spO2Pct: 91.8,
        respirationRateBrPm: 21,
      },
    },
  },
  {
    id: 'SANS_FLUID_SHIFT',
    numberLabel: 5,
    shortTitle: 'Fluid shift / eye risk',
    earthClinicTitle: 'Ocular Edema & ICP Spike',
    subtitle: 'A simulated fluid-shift scenario raises eye-health indicators.',
    primaryAffectedCrewId: 'vance',
    eclssTarget: {
      cabinPressurePsi: 14.7,
      cabinCo2Pct: 0.34,
      cabinO2Pct: 20.8,
      radiationDoseRateMsvHr: 0.05,
      ambientTempCelsius: 21.5,
      relativeHumidityPct: 46,
      solarProtonFluxPfu: 1.5,
      cdraLiOhSaturationPct: 42,
      stormShelterActive: false,
    },
    crewOverrides: {
      vance: {
        heartRateBpm: 76,
        spO2Pct: 98.1,
        venousEngorgementPct: 24,
        intraocularPressureMmHg: 20.4,
        opticNerveSheathMm: 6.15,
        systolicBpMmHg: 136,
        diastolicBpMmHg: 88,
      },
      rivera: {
        venousEngorgementPct: 21,
        intraocularPressureMmHg: 19.1,
        opticNerveSheathMm: 5.9,
      },
    },
  },
];

export function getScenarioPresetById(id: ScenarioId): ScenarioPreset {
  return (
    JUDGE_SCENARIO_PRESETS.find((s) => s.id === id) ?? JUDGE_SCENARIO_PRESETS[0]
  );
}
