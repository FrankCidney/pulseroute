import type { CrewMember } from '../types/crew';
import type { BiometricVitals } from '../types/telemetry';
import type { ClinicalDiagnosisVerdict } from '../types/diagnosis';
import type {
  EclssEnvironment,
  MolecularCountermeasureAssessment,
} from '../types/environment';
import type { QuickPromptIntent } from '../types/aiSurgeon';

export interface NarratorContext {
  crew: CrewMember;
  vitals: BiometricVitals;
  environment: EclssEnvironment;
  verdict: ClinicalDiagnosisVerdict;
  molecular: MolecularCountermeasureAssessment;
}

export interface RuleBasedExplanation {
  title: string;
  content: string;
  symptomAlerts: string[];
}

// Builds the strict ground-truth system prompt injected into the on-device language model.
// Feeds the deterministic rule-based finding directly into the prompt so the small model
// simply translates the verified rule-based output into natural human language without inventing diagnoses.
export function buildGroundTruthSystemPrompt(
  ctx: NarratorContext,
  ruleBasedFinding?: RuleBasedExplanation
): string {
  const { crew, vitals, environment, verdict, molecular } = ctx;
  const nextStep =
    verdict.checklistSteps[0]?.instruction ?? 'Continue routine monitoring.';

  const baseLines = [
    'You are AURA, an offline Digital Flight Surgeon assistant aboard a spacecraft.',
    'Rewrite the RULE-BASED CLINICAL FINDING below into 2 to 3 clear, natural English sentences for the astronaut.',
    'Use only the numbers, active protocol status, and checklist actions provided below. Never invent diagnoses or repeat sentences.',
    '',
    `ASTRONAUT: ${crew.name} (${crew.callsign}) | Status: ${verdict.crewStatus}`,
    `ACTIVE PROTOCOL VERDICT: ${verdict.title} (${verdict.severityGrade}, ${verdict.iclCode})`,
    `VITALS: Heart Rate ${vitals.heartRateBpm} BPM, SpO2 ${vitals.spO2Pct.toFixed(1)}%, Breathing ${vitals.respirationRateBrPm} breaths/min, HRV ${vitals.hrvRmssdMs} ms, Fatigue ${vitals.cognitiveFatigue.fatigueIndexPct}%, Core Temp ${vitals.coreTempCelsius.toFixed(1)} C.`,
    `CABIN: Pressure ${environment.cabinPressurePsi.toFixed(1)} psi, CO2 ${environment.cabinCo2Pct.toFixed(2)}%, O2 ${environment.cabinO2Pct.toFixed(1)}%, Radiation ${environment.radiationDoseRateMsvHr.toFixed(2)} mSv/h.`,
    `COUNTERMEASURE: ${molecular.prescribedPharmaceutical} | Priority Step: ${nextStep}`,
  ];

  if (ruleBasedFinding) {
    baseLines.push(
      '',
      `RULE-BASED CLINICAL FINDING (${ruleBasedFinding.title}):`,
      ruleBasedFinding.content
    );
  }

  return baseLines.join('\n');
}

// Generates a 3-point plain-English summary card for the Mission Overview tab.
export function generatePlainEnglishOverviewBriefing(ctx: NarratorContext): {
  headline: string;
  bodyExplanation: string;
  roomExplanation: string;
  actionExplanation: string;
} {
  const { crew, vitals, environment, verdict } = ctx;

  const headline =
    verdict.primaryConditionId === 'NOMINAL_STATE'
      ? `${crew.name} is healthy and all spacecraft room sensors are within normal baselines.`
      : `ALERT: ${crew.name} triggered ${verdict.title} (${verdict.severityGrade.replace('_', ' ')}).`;

  const bodyExplanation =
    vitals.spO2Pct < 91
      ? `Body sensors show blood oxygen has dropped to ${vitals.spO2Pct.toFixed(1)}% (normal is 95-100%) and heart rate is elevated at ${vitals.heartRateBpm} BPM to compensate.`
      : vitals.cognitiveFatigue.fatigueIndexPct >= 60
        ? `Body sensors show elevated exhaustion (${vitals.cognitiveFatigue.fatigueIndexPct}% Fatigue Index), breathing at ${vitals.respirationRateBrPm} breaths/min, and autonomic stress (HRV dropped to ${vitals.hrvRmssdMs} ms).`
        : vitals.fluidShift.sansGrade >= 2
          ? `Microgravity has shifted +${vitals.fluidShift.venousEngorgementPct}% extra fluid toward the head, raising eye pressure to ${vitals.fluidShift.intraocularPressureMmHg.toFixed(1)} mmHg and optic nerve sheath width to ${vitals.fluidShift.opticNerveSheathMm.toFixed(2)} mm.`
          : `Body sensors are nominal: Heart rate is ${vitals.heartRateBpm} BPM, blood oxygen is ${vitals.spO2Pct.toFixed(1)}%, HRV recovery is ${vitals.hrvRmssdMs} ms, and fatigue is low (${vitals.cognitiveFatigue.fatigueIndexPct}%).`;

  const roomExplanation =
    environment.cabinPressurePsi < 12.2
      ? `Cabin air pressure has dropped to ${environment.cabinPressurePsi.toFixed(1)} psi (normal is 14.7 psi) with room oxygen down to ${environment.cabinO2Pct.toFixed(1)}%.`
      : environment.cabinCo2Pct >= 0.45
        ? `The cabin CO2 scrubber is ${environment.cdraLiOhSaturationPct}% saturated, allowing carbon dioxide to rise to ${environment.cabinCo2Pct.toFixed(2)}% in the room air.`
        : environment.radiationDoseRateMsvHr >= 1.5
          ? `A Solar Particle Event is active: cabin radiation has risen to ${environment.radiationDoseRateMsvHr.toFixed(2)} mSv/h (nominal is 0.04 mSv/h).`
          : `Spacecraft cabin air is clean and stable: Pressure is ${environment.cabinPressurePsi.toFixed(1)} psi, CO2 is ${environment.cabinCo2Pct.toFixed(2)}%, oxygen is ${environment.cabinO2Pct.toFixed(1)}%, and radiation is ${environment.radiationDoseRateMsvHr.toFixed(2)} mSv/h.`;

  const firstStep =
    verdict.checklistSteps[0]?.instruction ?? 'Continue routine monitoring.';
  const actionExplanation =
    verdict.primaryConditionId === 'NOMINAL_STATE'
      ? `No acute countermeasure needed right now. Next routine check: ${firstStep}`
      : `Time before impairment: ${verdict.timeToImpairmentText}. Immediate Step 1: ${firstStep}`;

  return {
    headline,
    bodyExplanation,
    roomExplanation,
    actionExplanation,
  };
}

// Evaluates quick-prompt intents in plain English using only existing ExMC protocols.
export function answerQuickPromptInPlainEnglish(
  intent: QuickPromptIntent,
  ctx: NarratorContext
): RuleBasedExplanation {
  const { crew, vitals, environment, verdict, molecular } = ctx;

  switch (intent) {
    case 'EXPLAIN_ALL_CARDS': {
      const brief = generatePlainEnglishOverviewBriefing(ctx);
      return {
        title: `Plain-English Summary for ${crew.name}`,
        content: [
          `• Overall Status: ${brief.headline}`,
          `• Body Sensors: ${brief.bodyExplanation}`,
          `• Cabin Sensors: ${brief.roomExplanation}`,
          `• Next Protocol Step: ${brief.actionExplanation}`,
        ].join('\n'),
        symptomAlerts: [],
      };
    }

    case 'WHY_THIS_DIAGNOSIS': {
      return {
        title: `Why Protocol Flagged: ${verdict.title}`,
        content: [
          `AURA correlated ${crew.name}'s wearable Astroskin telemetry with spacecraft ECLSS sensors:`,
          ...verdict.sensorCorrelationProof.map((line) => `• ${line}`),
          `Root Cause Summary: ${verdict.primaryCauseText}.`,
        ].join('\n'),
        symptomAlerts: [],
      };
    }

    case 'CAN_CREW_WAIT': {
      if (verdict.severityGrade === 'GRADE_3') {
        return {
          title: 'Protocol Priority: GRADE 3 — Immediate Action Required',
          content: `No. ${crew.name} is in a Grade 3 condition (${verdict.title}). Estimated time to impairment is ${verdict.timeToImpairmentText}. Pause current tasks and execute Step 1 immediately: "${verdict.checklistSteps[0]?.instruction}".`,
          symptomAlerts: ['GRADE 3 STOP-WORK MANDATE'],
        };
      }
      if (verdict.severityGrade === 'GRADE_2') {
        return {
          title: 'Protocol Priority: GRADE 2 — Address Promptly',
          content: `${crew.name} has an active Grade 2 warning (${verdict.title}). Delaying countermeasures will worsen ${verdict.primaryCauseText}. Secure current station and begin Step 1: "${verdict.checklistSteps[0]?.instruction}".`,
          symptomAlerts: ['EVA & CRITICAL OPS RESTRICTED'],
        };
      }
      return {
        title: 'Protocol Priority: NOMINAL — All Baselines Within Range',
        content: `All current readings for ${crew.name} (SpO2 ${vitals.spO2Pct.toFixed(1)}%, HR ${vitals.heartRateBpm} BPM, Fatigue ${vitals.cognitiveFatigue.fatigueIndexPct}%) and cabin atmosphere match nominal ExMC-00 baselines.`,
        symptomAlerts: [],
      };
    }

    case 'EXPLAIN_DNA_AND_MEDS': {
      return {
        title: 'Plain-English Guide: Radiation, DNA Breaks & Countermeasures',
        content: [
          `• DNA Double-Strand Breaks (${molecular.estimatedDnaDsbPerCell.toFixed(3)} / cell): Tracks estimated cellular impact from ionizing radiation (current cabin rate: ${environment.radiationDoseRateMsvHr.toFixed(2)} mSv/h).`,
          `• Oxidative ROS Stress (${molecular.oxidativeStressIndexPct}%): Measures reactive oxygen species stress driven by radiation, CO2, and sleep debt.`,
          `• Protocol Countermeasure: ${molecular.prescribedPharmaceutical} (${molecular.medKitLocation}).`,
          `• Nutritional Support: ${molecular.nutritionalCountermeasure}.`,
        ].join('\n'),
        symptomAlerts: [],
      };
    }

    case 'EXPLAIN_SANS_AND_EYES': {
      return {
        title: 'Plain-English Guide: Cephalic Fluid Shift & SANS (ExMC-04)',
        content: [
          `• Headward Fluid Shift (+${vitals.fluidShift.venousEngorgementPct}%): In microgravity, blood and fluid shift toward the head, increasing jugular venous engorgement.`,
          `• Eye Pressure (IOP ${vitals.fluidShift.intraocularPressureMmHg.toFixed(1)} mmHg) & Optic Nerve Width (ONSD ${vitals.fluidShift.opticNerveSheathMm.toFixed(2)} mm): Thresholds above 18.0 mmHg or 5.80 mm trigger ExMC-04 SANS protocols.`,
          `• Current SANS Stage: ${verdict.sansAssessment.ocularEdemaStage}.`,
          `• Protocol Countermeasure: ${verdict.sansAssessment.lbnpPrescription}.`,
        ].join('\n'),
        symptomAlerts: [],
      };
    }
  }
}

// Parses free-text astronaut symptoms or questions and correlates them strictly against
// the existing 6 ExMC conditions (Nominal, Hypercapnia, Hypoxia, SPE Radiation, SANS Fluid Shift, Cognitive Fatigue).
export function interpretFreeTextSymptomOrQuestion(
  rawInput: string,
  ctx: NarratorContext
): RuleBasedExplanation {
  const q = rawInput.toLowerCase();
  const { crew, vitals, environment, verdict, molecular } = ctx;
  const symptomAlerts: string[] = [];

  // 1. Map subjective human symptom words to our existing ExMC sensor correlation checks
  const hasHeadacheOrDizzy =
    q.includes('headache') ||
    q.includes('head') ||
    q.includes('temple') ||
    q.includes('pounding') ||
    q.includes('dizzy') ||
    q.includes('lightheaded') ||
    q.includes('confused') ||
    q.includes('fog');
  const hasVisionSymptom =
    q.includes('blur') ||
    q.includes('vision') ||
    q.includes('eye') ||
    q.includes('see') ||
    q.includes('spot') ||
    q.includes('focus');
  const hasBreathingOrChestSymptom =
    q.includes('breath') ||
    q.includes('air') ||
    q.includes('gasp') ||
    q.includes('suffocat') ||
    q.includes('chest') ||
    q.includes('heart') ||
    q.includes('cough');
  const hasGiNauseaOrSkinSymptom =
    q.includes('stomach') ||
    q.includes('belly') ||
    q.includes('abdom') ||
    q.includes('gut') ||
    q.includes('cramp') ||
    q.includes('ache') ||
    q.includes('pain') ||
    q.includes('nausea') ||
    q.includes('vomit') ||
    q.includes('sick') ||
    q.includes('rash') ||
    q.includes('skin') ||
    q.includes('itch');
  const hasFatigueSymptom =
    q.includes('tired') ||
    q.includes('exhaust') ||
    q.includes('sleepy') ||
    q.includes('drowsy') ||
    q.includes('weak');

  if (
    hasHeadacheOrDizzy ||
    hasVisionSymptom ||
    hasBreathingOrChestSymptom ||
    hasGiNauseaOrSkinSymptom ||
    hasFatigueSymptom
  ) {
    const lines: string[] = [];

    if (hasHeadacheOrDizzy) {
      symptomAlerts.push('SYMPTOM CHECK: HEADACHE / DIZZINESS');
      if (environment.cabinCo2Pct >= 0.35) {
        lines.push(
          `• ExMC-01 Hypercapnia Check (Cabin CO2 ${environment.cabinCo2Pct.toFixed(2)}%): Elevated room CO2 matches your headache/dizziness report. Follow ExMC-01 Step 1: "${verdict.checklistSteps[0]?.instruction ?? 'Don portable 100% O2 mask and inspect CDRA scrubber B-02'}".`
        );
      } else if (vitals.spO2Pct < 92) {
        lines.push(
          `• ExMC-02 Hypoxia Check (SpO2 ${vitals.spO2Pct.toFixed(1)}%, Pressure ${environment.cabinPressurePsi.toFixed(1)} psi): Dizziness correlates with low blood oxygen and cabin pressure loss. Don your Quick-Don O2 mask immediately.`
        );
      } else {
        lines.push(
          `• ExMC-04 / ExMC-05 Check: Cabin CO2 (${environment.cabinCo2Pct.toFixed(2)}%) and SpO2 (${vitals.spO2Pct.toFixed(1)}%) are normal, so headache/dizziness correlates with microgravity headward fluid shift (+${vitals.fluidShift.venousEngorgementPct}% venous shift, IOP ${vitals.fluidShift.intraocularPressureMmHg.toFixed(1)} mmHg) or cumulative sleep debt (${vitals.cognitiveFatigue.sleepDebt72HrHours} hrs).`
        );
      }
    }

    if (hasVisionSymptom) {
      symptomAlerts.push('SYMPTOM CHECK: SANS OCULAR (ExMC-04)');
      lines.push(
        `• ExMC-04 SANS Check: ${crew.name}'s headward fluid shift is +${vitals.fluidShift.venousEngorgementPct}% with eye pressure at ${vitals.fluidShift.intraocularPressureMmHg.toFixed(1)} mmHg and optic nerve sheath width at ${vitals.fluidShift.opticNerveSheathMm.toFixed(2)} mm (${verdict.sansAssessment.ocularEdemaStage}). Recommended ExMC-04 protocol: ${verdict.sansAssessment.lbnpPrescription} and Optical Scanner retinal check.`
      );
    }

    if (hasBreathingOrChestSymptom) {
      symptomAlerts.push('SYMPTOM CHECK: RESPIRATORY / CARDIAC');
      lines.push(
        `• ExMC-01 / ExMC-02 Check: Respiration is ${vitals.respirationRateBrPm} breaths/min, Heart Rate is ${vitals.heartRateBpm} BPM, SpO2 is ${vitals.spO2Pct.toFixed(1)}%, and cabin pressure is ${environment.cabinPressurePsi.toFixed(1)} psi (CO2 ${environment.cabinCo2Pct.toFixed(2)}%). ${
          vitals.spO2Pct < 92 || environment.cabinCo2Pct >= 0.45
            ? `Active alert (${verdict.title}): ${verdict.checklistSteps[0]?.instruction}`
            : 'Oxygen and cabin pressure are within ExMC-00 nominal limits; run the Guided Self-Check (3-Lead Astroskin ECG & Hypoxia Airway Triage) on the Medical tab to verify sensor contact.'
        }`
      );
    }

    if (hasGiNauseaOrSkinSymptom) {
      symptomAlerts.push('SYMPTOM CHECK: GI / RADIATION / OSD-574');
      lines.push(
        `• ExMC-03 Radiation & Vitals Correlation: Cabin radiation is ${environment.radiationDoseRateMsvHr.toFixed(2)} mSv/h, cellular ROS stress is ${molecular.oxidativeStressIndexPct}%, Core Temp is ${vitals.coreTempCelsius.toFixed(1)}°C, and Heart Rate is ${vitals.heartRateBpm} BPM. ${
          environment.radiationDoseRateMsvHr >= 1.5
            ? `Stomach upset/nausea during a radiation spike matches ExMC-03 acute radiation prodrome—follow ExMC-03 protocol (retreat to Storm Shelter, ${molecular.prescribedPharmaceutical}, Ondansetron 8mg, and ${molecular.nutritionalCountermeasure}).`
            : `Radiation (${environment.radiationDoseRateMsvHr.toFixed(2)} mSv/h) and Core Temp (${vitals.coreTempCelsius.toFixed(1)}°C) are within ExMC-00 nominal baselines (no acute radiation prodrome or fever detected). Maintain hydration (${molecular.nutritionalCountermeasure}), log this symptom in the Crew Check-In form, and use the OSD-574 Optical Scanner if skin irritation is present.`
        }`
      );
    }

    if (hasFatigueSymptom) {
      symptomAlerts.push('SYMPTOM CHECK: COGNITIVE FATIGUE (ExMC-05)');
      lines.push(
        `• ExMC-05 Fatigue Check: ${crew.name}'s Canaria Fatigue Index is ${vitals.cognitiveFatigue.fatigueIndexPct}% (4-hour forecast ${vitals.cognitiveFatigue.projected4HrIndexPct}%), HRV is ${vitals.hrvRmssdMs} ms, and 72h sleep debt is ${vitals.cognitiveFatigue.sleepDebt72HrHours} hours. ${
          vitals.cognitiveFatigue.fatigueIndexPct >= 62
            ? 'ExMC-05 Cognitive Fatigue threshold exceeded: restrict EVA/critical tasks, set 480nm lighting phase reset, and schedule an 8-hour sleep block with 3mg melatonin.'
            : 'Fatigue index is currently below the 65% ExMC-05 cutoff; maintain scheduled rest and hydration.'
        }`
      );
    }

    return {
      title: `Symptom & Telemetry Correlation for ${crew.name} (${verdict.iclCode})`,
      content: lines.join('\n'),
      symptomAlerts,
    };
  }

  // 2. Check for "Can I wait / finish repair?" questions
  if (
    q.includes('wait') ||
    q.includes('finish') ||
    q.includes('later') ||
    q.includes('minute') ||
    q.includes('safe')
  ) {
    return answerQuickPromptInPlainEnglish('CAN_CREW_WAIT', ctx);
  }

  // 3. Check for specific metric explanations (HRV, PVT, Canaria, ALARA, DSB, ROS, ECLSS)
  if (q.includes('hrv') || q.includes('rmssd') || q.includes('stress')) {
    return {
      title: 'What HRV RMSSD (Autonomic Stress) Means Right Now',
      content: `HRV RMSSD measures millisecond beat-to-beat heart variation. Under ExMC-05 criteria, values below 25 ms indicate autonomic exhaustion. Right now, ${crew.name}'s HRV is ${vitals.hrvRmssdMs} ms (${
        vitals.hrvRmssdMs < 25
          ? 'LOW — below the 25 ms ExMC-05 autonomic stress threshold'
          : 'NOMINAL — above the 25 ms recovery baseline'
      }).`,
      symptomAlerts: [],
    };
  }

  if (
    q.includes('fatigue') ||
    q.includes('canaria') ||
    q.includes('pvt') ||
    q.includes('sleep')
  ) {
    return {
      title: 'What the Predictive Fatigue Index (ExMC-05) Means',
      content: `${crew.name}'s Fatigue Index is ${vitals.cognitiveFatigue.fatigueIndexPct}% (forecasted to hit ${vitals.cognitiveFatigue.projected4HrIndexPct}% in 4 hours), with ${vitals.cognitiveFatigue.sleepDebt72HrHours} hours of 72h sleep debt and +${vitals.cognitiveFatigue.reactionLatencyPenaltyMs} ms PVT reaction delay. ${
        vitals.cognitiveFatigue.evaCleared
          ? 'Status: Cleared for EVA operations (< 65% ExMC-05 cutoff).'
          : 'Status: Restricted from EVA and manual docking under ExMC-05 protocol.'
      }`,
      symptomAlerts: [],
    };
  }

  if (
    q.includes('dna') ||
    q.includes('ros') ||
    q.includes('amifostine') ||
    q.includes('pill') ||
    q.includes('med') ||
    q.includes('radiation')
  ) {
    return answerQuickPromptInPlainEnglish('EXPLAIN_DNA_AND_MEDS', ctx);
  }

  if (
    q.includes('sans') ||
    q.includes('fluid') ||
    q.includes('iop') ||
    q.includes('onsd') ||
    q.includes('lbnp')
  ) {
    return answerQuickPromptInPlainEnglish('EXPLAIN_SANS_AND_EYES', ctx);
  }

  // 4. Default: Full plain-english interpretation of the current screen
  return answerQuickPromptInPlainEnglish('EXPLAIN_ALL_CARDS', ctx);
}
