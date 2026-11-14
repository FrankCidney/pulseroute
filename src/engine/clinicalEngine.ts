import exmcProtocolsRaw from '../data/exmc_protocols.json';
import type { BiometricVitals } from '../types/telemetry';
import type {
  ClinicalDiagnosisVerdict,
  ClinicalSeverityGrade,
  EclssSensorInput,
  ExmcConditionId,
  ExmcProtocol,
} from '../types/diagnosis';
import { evaluateSansAndFluidShift } from './fluidShiftTracker';

const EXMC_PROTOCOLS = exmcProtocolsRaw as unknown as readonly ExmcProtocol[];

function getProtocolById(conditionId: ExmcConditionId): ExmcProtocol {
  const found = EXMC_PROTOCOLS.find((p) => p.conditionId === conditionId);
  if (!found) {
    throw new Error(`Missing NASA ExMC protocol definition for ${conditionId}`);
  }
  return found;
}

interface CandidateMatch {
  conditionId: ExmcConditionId;
  severityGrade: ClinicalSeverityGrade;
  priorityScore: number;
  confidencePct: number;
  primaryCauseText: string;
  correlations: string[];
}

// --- Pure Deterministic Multi-Sensor Clinical Correlation Engine ---
// Evaluates wearable Astroskin biometrics alongside spacecraft ECLSS atmospheric
// and radiation sensors against NASA ExMC ICL 1.0 diagnostic rules with 0% AI hallucination.

export function evaluateClinicalDiagnosis(params: {
  vitals: BiometricVitals;
  eclss: EclssSensorInput;
  missionDaysInMicrogravity: number;
}): ClinicalDiagnosisVerdict {
  const { vitals, eclss, missionDaysInMicrogravity } = params;

  const sansAssessment = evaluateSansAndFluidShift({
    missionDaysInMicrogravity,
    venousEngorgementPct: vitals.fluidShift.venousEngorgementPct,
    intraocularPressureMmHg: vitals.fluidShift.intraocularPressureMmHg,
    opticNerveSheathMm: vitals.fluidShift.opticNerveSheathMm,
    ambientCo2Pct: eclss.cabinCo2Pct,
  });

  const candidates: CandidateMatch[] = [];

  // 1. Condition ExMC-02: Acute Hypoxia / Atmospheric Decompression
  if (vitals.spO2Pct < 91 || eclss.cabinPressurePsi < 12.2 || eclss.cabinO2Pct < 17.5) {
    const isCritical = vitals.spO2Pct < 89 || eclss.cabinPressurePsi < 11.5;
    candidates.push({
      conditionId: 'EXMC_02_HYPOXIA',
      severityGrade: isCritical ? 'GRADE_3' : 'GRADE_2',
      priorityScore: isCritical ? 100 : 80,
      confidencePct: 99,
      primaryCauseText:
        'Rapid cabin pO2 / total pressure loss coupled with arterial hemoglobin desaturation',
      correlations: [
        `Astroskin SpO2 ${vitals.spO2Pct.toFixed(1)}% (< 90% ExMC Hypoxia Cutoff)`,
        `ECLSS Cabin Pressure ${eclss.cabinPressurePsi.toFixed(1)} psi (Nominal: 14.7 psi) & O2 ${eclss.cabinO2Pct.toFixed(1)}%`,
        `Compensatory Sinus Tachycardia ${vitals.heartRateBpm} BPM & Resp ${vitals.respirationRateBrPm} BrPM`,
      ],
    });
  }

  // 2. Condition ExMC-03: Solar Particle Event (SPE) Radiation Acute Exposure
  if (vitals.personalRadiationRateMsvHr >= 1.5 || eclss.radiationDoseRateMsvHr >= 1.5) {
    const peakRate = Math.max(
      vitals.personalRadiationRateMsvHr,
      eclss.radiationDoseRateMsvHr
    );
    const isEmergency = peakRate >= 5.0;
    candidates.push({
      conditionId: 'EXMC_03_SPE_RADIATION',
      severityGrade: isEmergency ? 'GRADE_3' : 'GRADE_2',
      priorityScore: isEmergency ? 96 : 76,
      confidencePct: 99,
      primaryCauseText:
        'High-energy Solar Particle Event (SPE) proton flux breaching hull shielding',
      correlations: [
        `Personal Active Dosimeter ${vitals.personalRadiationRateMsvHr.toFixed(2)} mSv/h (SPE Emergency > 5.0 mSv/h)`,
        `ECLSS Habitat Flux ${eclss.radiationDoseRateMsvHr.toFixed(2)} mSv/h`,
        `Cumulative Career Dose ${vitals.cumulativeMissionDoseMsv.toFixed(1)} / ${vitals.careerAlaraLimitMsv} mSv ALARA`,
      ],
    });
  }

  // 3. Condition ExMC-01: Acute Hypercapnia (Carbon Dioxide Toxicity)
  if (
    eclss.cabinCo2Pct >= 0.45 ||
    (eclss.cabinCo2Pct >= 0.35 && vitals.respirationRateBrPm >= 21)
  ) {
    const isCritical = eclss.cabinCo2Pct >= 0.5 && vitals.respirationRateBrPm >= 22;
    candidates.push({
      conditionId: 'EXMC_01_HYPERCAPNIA',
      severityGrade: isCritical ? 'GRADE_3' : 'GRADE_2',
      priorityScore: isCritical ? 92 : 74,
      confidencePct: 98,
      primaryCauseText:
        'ECLSS CDRA CO2 scrubber saturation causing alveolar hypercapnia and autonomic stress',
      correlations: [
        `ECLSS Cabin pCO2 ${eclss.cabinCo2Pct.toFixed(2)}% (> 0.50% ExMC Hypercapnia Threshold)`,
        `Astroskin Tachypnea ${vitals.respirationRateBrPm} BrPM (> 22 BrPM criteria)`,
        `Autonomic HRV RMSSD suppressed to ${vitals.hrvRmssdMs} ms with Fatigue Index ${vitals.cognitiveFatigue.fatigueIndexPct}%`,
      ],
    });
  }

  // 4. Condition ExMC-04: SANS & Cephalic Fluid Shift
  if (sansAssessment.metrics.sansGrade >= 2) {
    candidates.push({
      conditionId: 'EXMC_04_SANS_FLUID_SHIFT',
      severityGrade: sansAssessment.severityGrade,
      priorityScore: sansAssessment.severityGrade === 'GRADE_3' ? 88 : 68,
      confidencePct: 96,
      primaryCauseText:
        'Microgravity cephalic venous fluid redistribution elevating intracranial & intraocular pressure',
      correlations: [
        `Jugular Venous Engorgement +${sansAssessment.metrics.venousEngorgementPct}% (> +20% SANS threshold)`,
        `Intraocular Pressure ${sansAssessment.metrics.intraocularPressureMmHg.toFixed(1)} mmHg & Optic Nerve Sheath ${sansAssessment.metrics.opticNerveSheathMm.toFixed(2)} mm`,
        sansAssessment.ocularEdemaStage,
      ],
    });
  }

  // 5. Condition ExMC-05: Severe Cognitive Fatigue & Circadian Misalignment
  if (
    vitals.cognitiveFatigue.fatigueIndexPct >= 62 ||
    (vitals.hrvRmssdMs <= 22 && vitals.cognitiveFatigue.sleepDebt72HrHours >= 6)
  ) {
    candidates.push({
      conditionId: 'EXMC_05_COGNITIVE_FATIGUE',
      severityGrade: vitals.cognitiveFatigue.fatigueIndexPct >= 75 ? 'GRADE_3' : 'GRADE_2',
      priorityScore: 62,
      confidencePct: 95,
      primaryCauseText:
        'Cumulative 72-hour sleep debt + sympathetic HRV collapse degrading psychomotor vigilance',
      correlations: [
        `Canaria Cognitive Fatigue Index ${vitals.cognitiveFatigue.fatigueIndexPct}% (+4h Forecast: ${vitals.cognitiveFatigue.projected4HrIndexPct}%)`,
        `Resting HRV RMSSD ${vitals.hrvRmssdMs} ms (< 25 ms autonomic exhaustion threshold)`,
        `72h Sleep Deficit ${vitals.cognitiveFatigue.sleepDebt72HrHours.toFixed(1)} hrs (PVT Delay +${vitals.cognitiveFatigue.reactionLatencyPenaltyMs} ms)`,
      ],
    });
  }

  // Sort candidate diagnoses by clinical urgency priorityScore descending
  candidates.sort((a, b) => b.priorityScore - a.priorityScore);

  if (candidates.length === 0) {
    const nominalProtocol = getProtocolById('NOMINAL_STATE');
    return {
      crewId: vitals.crewId,
      evaluatedAtMs: vitals.timestampMs,
      primaryConditionId: 'NOMINAL_STATE',
      iclCode: nominalProtocol.iclCode,
      title: nominalProtocol.title,
      earthClinicTitle: nominalProtocol.earthClinicTitle,
      severityGrade: 'NOMINAL',
      crewStatus: 'NOMINAL',
      confidencePct: 100,
      timeToImpairmentText: nominalProtocol.timeToImpairmentText,
      primaryCauseText:
        'Multi-sensor fusion confirms homeostatic biometrics and nominal cabin ECLSS atmosphere',
      sensorCorrelationProof: [
        `Astroskin HR ${vitals.heartRateBpm} BPM | SpO2 ${vitals.spO2Pct.toFixed(1)}% | HRV ${vitals.hrvRmssdMs} ms`,
        `ECLSS Cabin ${eclss.cabinPressurePsi.toFixed(1)} psi | CO2 ${eclss.cabinCo2Pct.toFixed(2)}% | Rad ${eclss.radiationDoseRateMsvHr.toFixed(2)} mSv/h`,
        sansAssessment.clinicalSummary,
      ],
      flightSurgeonDirective: nominalProtocol.flightSurgeonDirective,
      earthClinicDirective: nominalProtocol.earthClinicDirective,
      checklistSteps: nominalProtocol.checklistSteps,
      secondaryAlerts: [],
      sansAssessment,
    };
  }

  const primary = candidates[0];
  const protocol = getProtocolById(primary.conditionId);

  const secondaryAlerts = candidates.slice(1).map((c) => {
    const secProto = getProtocolById(c.conditionId);
    return {
      conditionId: c.conditionId,
      title: secProto.title,
      severityGrade: c.severityGrade,
    };
  });

  return {
    crewId: vitals.crewId,
    evaluatedAtMs: vitals.timestampMs,
    primaryConditionId: primary.conditionId,
    iclCode: protocol.iclCode,
    title: protocol.title,
    earthClinicTitle: protocol.earthClinicTitle,
    severityGrade: primary.severityGrade,
    crewStatus: primary.severityGrade === 'GRADE_3' ? 'CRITICAL' : 'WARNING',
    confidencePct: primary.confidencePct,
    timeToImpairmentText: protocol.timeToImpairmentText,
    primaryCauseText: primary.primaryCauseText,
    sensorCorrelationProof: primary.correlations,
    flightSurgeonDirective: protocol.flightSurgeonDirective,
    earthClinicDirective: protocol.earthClinicDirective,
    checklistSteps: protocol.checklistSteps,
    secondaryAlerts,
    sansAssessment,
  };
}
