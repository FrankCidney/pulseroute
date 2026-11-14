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

// Builds the strict ground-truth system prompt injected into SmolLM2-360M-Instruct
// so the on-device neural model explains live numbers accurately with zero hallucination.
export function buildGroundTruthSystemPrompt(ctx: NarratorContext): string {
  const { crew, vitals, environment, verdict, molecular } = ctx;
  const nextStep = verdict.checklistSteps[0]?.instruction ?? 'Continue monitoring.';

  return [
    'You are AURA, an offline Digital Flight Surgeon aboard a Mars spacecraft.',
    'Explain the astronaut telemetry and room sensors in simple, plain English (3 to 4 short sentences).',
    'Never invent numbers or contradict the verified NASA ExMC diagnosis below.',
    '',
    `ASTRONAUT: ${crew.name} (${crew.callsign}) | Status: ${verdict.crewStatus}`,
    `VERIFIED DIAGNOSIS: ${verdict.title} (${verdict.severityGrade}, ${verdict.iclCode})`,
    `TIME TO IMPAIRMENT: ${verdict.timeToImpairmentText}`,
    `BODY VITALS: Heart Rate ${vitals.heartRateBpm} BPM, Blood Oxygen SpO2 ${vitals.spO2Pct.toFixed(1)}%, Breathing ${vitals.respirationRateBrPm} breaths/min, Stress HRV ${vitals.hrvRmssdMs} ms, Brain Fatigue ${vitals.cognitiveFatigue.fatigueIndexPct}% (+4h forecast ${vitals.cognitiveFatigue.projected4HrIndexPct}%), Core Temp ${vitals.coreTempCelsius.toFixed(1)} C.`,
    `HEAD FLUID & EYES (SANS): Neck vein shift +${vitals.fluidShift.venousEngorgementPct}%, Eye pressure IOP ${vitals.fluidShift.intraocularPressureMmHg.toFixed(1)} mmHg, Optic nerve width ${vitals.fluidShift.opticNerveSheathMm.toFixed(2)} mm (Grade ${vitals.fluidShift.sansGrade}).`,
    `CABIN ROOM AIR (ECLSS): Air Pressure ${environment.cabinPressurePsi.toFixed(1)} psi (Normal 14.7), Room CO2 ${environment.cabinCo2Pct.toFixed(2)}% (Danger >0.50%), Room O2 ${environment.cabinO2Pct.toFixed(1)}%, Radiation ${environment.radiationDoseRateMsvHr.toFixed(2)} mSv/h.`,
    `DNA & MEDS: Est DNA breaks ${molecular.estimatedDnaDsbPerCell.toFixed(3)}/cell, Cell ROS stress ${molecular.oxidativeStressIndexPct}%, Prescribed pill: ${molecular.prescribedPharmaceutical}.`,
    `PRIORITY ACTION: ${nextStep}`,
  ].join('\n');
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
      ? `${crew.name} is healthy and all spacecraft room sensors are normal.`
      : `ALERT: ${crew.name} has ${verdict.title} (${verdict.severityGrade.replace('_', ' ')}).`;

  const bodyExplanation =
    vitals.spO2Pct < 91
      ? `Body sensors show blood oxygen has dropped to a dangerous ${vitals.spO2Pct.toFixed(1)}% (normal is 95-100%) and the heart is racing at ${vitals.heartRateBpm} BPM to compensate.`
      : vitals.cognitiveFatigue.fatigueIndexPct >= 60
        ? `Body sensors show high exhaustion (${vitals.cognitiveFatigue.fatigueIndexPct}% Fatigue Index), fast breathing (${vitals.respirationRateBrPm} breaths/min), and stressed nervous system (HRV dropped to ${vitals.hrvRmssdMs} ms).`
        : vitals.fluidShift.sansGrade >= 2
          ? `Zero gravity has pushed +${vitals.fluidShift.venousEngorgementPct}% extra blood into the head, raising eye pressure to ${vitals.fluidShift.intraocularPressureMmHg.toFixed(1)} mmHg and swelling the optic nerve (${vitals.fluidShift.opticNerveSheathMm.toFixed(2)} mm).`
          : `Body sensors are calm: Heart rate is ${vitals.heartRateBpm} BPM, blood oxygen is ${vitals.spO2Pct.toFixed(1)}%, nervous-system recovery (HRV) is ${vitals.hrvRmssdMs} ms, and fatigue is low (${vitals.cognitiveFatigue.fatigueIndexPct}%).`;

  const roomExplanation =
    environment.cabinPressurePsi < 12.2
      ? `Spaceship room air pressure has dropped to ${environment.cabinPressurePsi.toFixed(1)} psi (normal is 14.7 psi) with room oxygen down to ${environment.cabinO2Pct.toFixed(1)}% due to a cabin leak.`
      : environment.cabinCo2Pct >= 0.45
        ? `The lab's CO2 air scrubber is ${environment.cdraLiOhSaturationPct}% full, letting toxic carbon dioxide build up to ${environment.cabinCo2Pct.toFixed(2)}% in the room air (over 4x normal).`
        : environment.radiationDoseRateMsvHr >= 1.5
          ? `A Solar Storm is hitting the ship! Radiation inside the cabin has spiked to ${environment.radiationDoseRateMsvHr.toFixed(2)} mSv/h (normal is 0.04 mSv/h).`
          : `Spaceship cabin air is clean and safe: Pressure is ${environment.cabinPressurePsi.toFixed(1)} psi, CO2 is ${environment.cabinCo2Pct.toFixed(2)}%, oxygen is ${environment.cabinO2Pct.toFixed(1)}%, and radiation is low (${environment.radiationDoseRateMsvHr.toFixed(2)} mSv/h).`;

  const firstStep = verdict.checklistSteps[0]?.instruction ?? 'Continue routine monitoring.';
  const actionExplanation =
    verdict.primaryConditionId === 'NOMINAL_STATE'
      ? `No medical treatment needed right now. Next routine check: ${firstStep}`
      : `Time before impairment: ${verdict.timeToImpairmentText}. Immediate Step 1: ${firstStep}`;

  return {
    headline,
    bodyExplanation,
    roomExplanation,
    actionExplanation,
  };
}

// Evaluates quick-prompt intents in plain English.
export function answerQuickPromptInPlainEnglish(
  intent: QuickPromptIntent,
  ctx: NarratorContext
): { title: string; content: string; symptomAlerts: string[] } {
  const { crew, vitals, environment, verdict, molecular } = ctx;

  switch (intent) {
    case 'EXPLAIN_ALL_CARDS': {
      const brief = generatePlainEnglishOverviewBriefing(ctx);
      return {
        title: `Plain-English Summary for ${crew.name}`,
        content: [
          `• What's happening overall: ${brief.headline}`,
          `• What the Body Cards mean: ${brief.bodyExplanation}`,
          `• What the Room Cards mean: ${brief.roomExplanation}`,
          `• What to do right now: ${brief.actionExplanation}`,
        ].join('\n'),
        symptomAlerts: [],
      };
    }

    case 'WHY_THIS_DIAGNOSIS': {
      return {
        title: `Why AURA Diagnosed: ${verdict.title}`,
        content: [
          `AURA never guesses from a single number. It combined ${crew.name}'s wearable vest sensors with the spaceship's room sensors:`,
          ...verdict.sensorCorrelationProof.map((line) => `• ${line}`),
          `Plain-English takeaway: ${verdict.primaryCauseText}.`,
        ].join('\n'),
        symptomAlerts: [],
      };
    }

    case 'CAN_CREW_WAIT': {
      if (verdict.severityGrade === 'GRADE_3') {
        return {
          title: 'Safety Verdict: NEGATIVE — Do Not Wait',
          content: `NO. ${crew.name} is in a Grade 3 Emergency (${verdict.title}). Time to severe impairment or blackout is ${verdict.timeToImpairmentText}. Stop all repair or mission tasks and execute Checklist Step 1 immediately: "${verdict.checklistSteps[0]?.instruction}".`,
          symptomAlerts: ['GRADE 3 STOP-WORK MANDATE'],
        };
      }
      if (verdict.severityGrade === 'GRADE_2') {
        return {
          title: 'Safety Verdict: CAUTION — Complete Within 15 Minutes',
          content: `${crew.name} has a Grade 2 Warning (${verdict.title}). While not an instant blackout risk, delaying treatment will worsen ${verdict.primaryCauseText}. Secure current tools and begin Step 1 within 10–15 minutes.`,
          symptomAlerts: ['EVA & CRITICAL OPS RESTRICTED'],
        };
      }
      return {
        title: 'Safety Verdict: CLEARED — Crew Can Continue Tasks',
        content: `Yes. All vitals for ${crew.name} (SpO2 ${vitals.spO2Pct.toFixed(1)}%, HR ${vitals.heartRateBpm} BPM, Fatigue ${vitals.cognitiveFatigue.fatigueIndexPct}%) and cabin sensors are within safe NASA baselines.`,
        symptomAlerts: [],
      };
    }

    case 'EXPLAIN_DNA_AND_MEDS': {
      return {
        title: 'Plain-English Guide: DNA Breaks, ROS Stress & Medicine Card',
        content: [
          `• DNA Double-Strand Breaks (${molecular.estimatedDnaDsbPerCell.toFixed(3)} / cell): Space radiation acts like microscopic bullets hitting DNA. Under 0.050/cell is normal; right now radiation is ${environment.radiationDoseRateMsvHr.toFixed(2)} mSv/h.`,
          `• Oxidative ROS Stress (${molecular.oxidativeStressIndexPct}%): Measures cellular "free radical" stress caused by radiation, CO2, and lack of sleep.`,
          `• Prescribed Pill: ${molecular.prescribedPharmaceutical} (located in ${molecular.medKitLocation}).`,
          `• Nutrition Pack: ${molecular.nutritionalCountermeasure}.`,
        ].join('\n'),
        symptomAlerts: [],
      };
    }

    case 'EXPLAIN_SANS_AND_EYES': {
      return {
        title: 'Plain-English Guide: Cephalic Fluid Shift & Eye Swelling (SANS)',
        content: [
          `• Why fluid shifts in space: On Earth, gravity pulls blood into your legs. In zero gravity, ~2 liters of fluid float up into the head ("Cephalic Fluid Shift"), swelling neck veins by +${vitals.fluidShift.venousEngorgementPct}%.`,
          `• Eye Pressure (IOP ${vitals.fluidShift.intraocularPressureMmHg.toFixed(1)} mmHg) & Optic Nerve Width (ONSD ${vitals.fluidShift.opticNerveSheathMm.toFixed(2)} mm): Extra head fluid presses on the back of the eyeball. Above 18.5 mmHg or 5.80 mm causes blurred vision and optic disc swelling (SANS).`,
          `• Current Status: ${verdict.sansAssessment.ocularEdemaStage}.`,
          `• Recommended Fix: ${verdict.sansAssessment.lbnpPrescription} (gentle vacuum cylinder around the legs that pulls blood back down out of the head).`,
        ].join('\n'),
        symptomAlerts: [],
      };
    }
  }
}

// Parses free-text astronaut symptoms or questions about metrics in plain English.
export function interpretFreeTextSymptomOrQuestion(
  rawInput: string,
  ctx: NarratorContext
): { title: string; content: string; symptomAlerts: string[] } {
  const q = rawInput.toLowerCase();
  const { crew, vitals, environment, molecular } = ctx;
  const symptomAlerts: string[] = [];

  // 1. Check for subjective human symptoms reported by the astronaut
  const hasHeadacheOrDizzy =
    q.includes('headache') ||
    q.includes('temple') ||
    q.includes('pounding') ||
    q.includes('dizzy') ||
    q.includes('lightheaded') ||
    q.includes('confused');
  const hasVisionSymptom =
    q.includes('blur') ||
    q.includes('vision') ||
    q.includes('eye') ||
    q.includes('spot') ||
    q.includes('focus');
  const hasBreathingSymptom =
    q.includes('breath') ||
    q.includes('air') ||
    q.includes('gasp') ||
    q.includes('suffocat') ||
    q.includes('chest');
  const hasNauseaOrRash =
    q.includes('nausea') ||
    q.includes('vomit') ||
    q.includes('sick') ||
    q.includes('rash') ||
    q.includes('skin') ||
    q.includes('itch');

  if (hasHeadacheOrDizzy || hasVisionSymptom || hasBreathingSymptom || hasNauseaOrRash) {
    const lines: string[] = [];

    if (hasHeadacheOrDizzy) {
      symptomAlerts.push('SYMPTOM: CEPHALALGIA / DIZZINESS');
      if (environment.cabinCo2Pct >= 0.35) {
        lines.push(
          `• Headache/Dizziness + High Room CO2 (${environment.cabinCo2Pct.toFixed(2)}%): Your pounding headache is a classic sign of Carbon Dioxide toxicity (Hypercapnia). High CO2 dilates blood vessels in the brain. Put on supplemental O2 and check Scrubber B-02.`
        );
      } else if (vitals.spO2Pct < 92) {
        lines.push(
          `• Dizziness + Low Blood Oxygen (${vitals.spO2Pct.toFixed(1)}%): Your brain is starving for oxygen due to low cabin pressure (${environment.cabinPressurePsi.toFixed(1)} psi). Don your Quick-Don O2 mask immediately!`
        );
      } else {
        lines.push(
          `• Headache/Dizziness Correlation: Room CO2 is normal (${environment.cabinCo2Pct.toFixed(2)}%), so this headache is likely from zero-gravity fluid pooling in your head (+${vitals.fluidShift.venousEngorgementPct}% venous shift) or sleep debt (${vitals.cognitiveFatigue.sleepDebt72HrHours} hrs).`
        );
      }
    }

    if (hasVisionSymptom) {
      symptomAlerts.push('SYMPTOM: VISUAL ACUITY SHIFT (SANS)');
      lines.push(
        `• Blurry Vision / Eye Check: ${crew.name}'s headward fluid shift is +${vitals.fluidShift.venousEngorgementPct}% with eye pressure at ${vitals.fluidShift.intraocularPressureMmHg.toFixed(1)} mmHg and optic nerve sheath width at ${vitals.fluidShift.opticNerveSheathMm.toFixed(2)} mm. Use the Optical Scanner on the Medical tab and start LBNP (-30 mmHg) therapy.`
      );
    }

    if (hasBreathingSymptom) {
      symptomAlerts.push('SYMPTOM: DYSPNEA / AIRWAY ALERT');
      lines.push(
        `• Breathing Check: ${crew.name} is breathing at ${vitals.respirationRateBrPm} breaths/min with blood oxygen at ${vitals.spO2Pct.toFixed(1)}% and cabin pressure at ${environment.cabinPressurePsi.toFixed(1)} psi. ${
          vitals.spO2Pct < 92 || environment.cabinCo2Pct >= 0.45
            ? 'Put on the emergency oxygen mask from Bay 3 immediately!'
            : 'Oxygen and pressure are currently stable; sit upright and monitor ECG.'
        }`
      );
    }

    if (hasNauseaOrRash) {
      symptomAlerts.push('SYMPTOM: RADIATION PRODROMAL / DERM');
      lines.push(
        `• Nausea / Skin Check: Current radiation rate is ${environment.radiationDoseRateMsvHr.toFixed(2)} mSv/h with ${molecular.oxidativeStressIndexPct}% cellular ROS stress. ${
          environment.radiationDoseRateMsvHr >= 1.5
            ? 'Nausea during a radiation spike can indicate acute radiation prodrome—take 500mg Amifostine + Ondansetron in the Storm Shelter.'
            : 'Use the Skin (OSD-574) Optical Scanner to check for microgravity contact dermatitis.'
        }`
      );
    }

    return {
      title: `Symptom Correlation Analysis for ${crew.name}`,
      content: lines.join('\n'),
      symptomAlerts,
    };
  }

  // 2. Check for "Can I wait / finish repair?" questions
  if (q.includes('wait') || q.includes('finish') || q.includes('later') || q.includes('minute')) {
    return answerQuickPromptInPlainEnglish('CAN_CREW_WAIT', ctx);
  }

  // 3. Check for specific metric explanations (HRV, PVT, Canaria, ALARA, DSB, ROS, ECLSS)
  if (q.includes('hrv') || q.includes('rmssd') || q.includes('stress')) {
    return {
      title: 'What HRV RMSSD (Stress) Means Right Now',
      content: `HRV RMSSD measures the natural millisecond variation between heartbeats. A calm, well-rested astronaut has an HRV above 40 ms. Right now, ${crew.name}'s HRV is ${vitals.hrvRmssdMs} ms (${
        vitals.hrvRmssdMs < 25
          ? 'LOW — meaning their body is under high adrenaline stress or exhaustion'
          : 'NORMAL — meaning their nervous system is balanced and recovering well'
      }).`,
      symptomAlerts: [],
    };
  }

  if (q.includes('fatigue') || q.includes('canaria') || q.includes('pvt') || q.includes('sleep')) {
    return {
      title: 'What the Predictive Fatigue Index (Canaria) Means',
      content: `${crew.name}'s Fatigue Index is ${vitals.cognitiveFatigue.fatigueIndexPct}% (forecasted to hit ${vitals.cognitiveFatigue.projected4HrIndexPct}% in 4 hours). They have missed ${vitals.cognitiveFatigue.sleepDebt72HrHours} hours of sleep over the last 3 days, slowing their reaction time (PVT Delay) by +${vitals.cognitiveFatigue.reactionLatencyPenaltyMs} ms. ${
        vitals.cognitiveFatigue.evaCleared
          ? 'They are still cleared for spacewalks (EVA).'
          : 'They are RESTRICTED from spacewalks (EVA) due to high error risk.'
      }`,
      symptomAlerts: [],
    };
  }

  if (q.includes('dna') || q.includes('ros') || q.includes('amifostine') || q.includes('pill') || q.includes('med')) {
    return answerQuickPromptInPlainEnglish('EXPLAIN_DNA_AND_MEDS', ctx);
  }

  // 4. Default: Full plain-english interpretation of the current screen
  return answerQuickPromptInPlainEnglish('EXPLAIN_ALL_CARDS', ctx);
}
