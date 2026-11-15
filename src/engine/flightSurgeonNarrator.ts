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

// Builds context for the optional experimental on-device language model.
export function buildGroundTruthSystemPrompt(ctx: NarratorContext): string {
  const { crew, vitals, environment, verdict, molecular } = ctx;

  return [
    'You are an experimental explainer for a health-monitoring prototype.',
    'Explain the simulated readings in simple, plain English (3 to 4 short sentences).',
    'Do not diagnose, assess medical urgency, recommend treatment or medication, or make operational decisions.',
    'Do not claim these readings or rules are NASA-validated. State when something is a prototype estimate.',
    'Never invent numbers. For requests for advice, direct the user to approved mission procedures and qualified professionals.',
    '',
    `CREW MEMBER IN DEMO: ${crew.name} (${crew.callsign})`,
    `PROTOTYPE RULE STATUS (not a diagnosis): ${verdict.title} (${verdict.severityGrade})`,
    `SAMPLE BODY READINGS: Heart rate ${vitals.heartRateBpm} BPM, blood oxygen ${vitals.spO2Pct.toFixed(1)}%, breathing ${vitals.respirationRateBrPm} breaths/min, HRV ${vitals.hrvRmssdMs} ms, fatigue estimate ${vitals.cognitiveFatigue.fatigueIndexPct}% (4-hour estimate ${vitals.cognitiveFatigue.projected4HrIndexPct}%), core temperature ${vitals.coreTempCelsius.toFixed(1)} C.`,
    `EXPLORATORY FLUID-SHIFT ESTIMATES: ${vitals.fluidShift.venousEngorgementPct}% venous shift, eye pressure ${vitals.fluidShift.intraocularPressureMmHg.toFixed(1)} mmHg, optic nerve width ${vitals.fluidShift.opticNerveSheathMm.toFixed(2)} mm.`,
    `SAMPLE CABIN READINGS: Pressure ${environment.cabinPressurePsi.toFixed(1)} psi, CO2 ${environment.cabinCo2Pct.toFixed(2)}%, O2 ${environment.cabinO2Pct.toFixed(1)}%, radiation estimate ${environment.radiationDoseRateMsvHr.toFixed(2)} mSv/h.`,
    `EXPLORATORY MOLECULAR ESTIMATES: DNA breaks ${molecular.estimatedDnaDsbPerCell.toFixed(3)}/cell, oxidative-stress index ${molecular.oxidativeStressIndexPct}%.`,
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
      ? `${crew.name}'s sample readings are within this scenario's demo ranges.`
      : `The demo rules flagged ${verdict.title} (${verdict.severityGrade.replace('_', ' ')}) for ${crew.name}.`;

  const bodyExplanation =
    `Sample readings: heart rate ${vitals.heartRateBpm} BPM, blood oxygen ${vitals.spO2Pct.toFixed(1)}%, breathing ${vitals.respirationRateBrPm} breaths/min, HRV ${vitals.hrvRmssdMs} ms, fatigue estimate ${vitals.cognitiveFatigue.fatigueIndexPct}%, and exploratory fluid-shift estimate ${vitals.fluidShift.venousEngorgementPct}%.`;

  const roomExplanation =
    `Sample cabin readings: pressure ${environment.cabinPressurePsi.toFixed(1)} psi, CO2 ${environment.cabinCo2Pct.toFixed(2)}%, oxygen ${environment.cabinO2Pct.toFixed(1)}%, and radiation estimate ${environment.radiationDoseRateMsvHr.toFixed(2)} mSv/h.`;

  const actionExplanation =
    verdict.primaryConditionId === 'NOMINAL_STATE'
      ? 'This scenario has no active demo alert. The prototype cannot determine health or operational readiness.'
      : 'This is a prototype flag, not a diagnosis or instruction. Review approved mission procedures with qualified personnel.';

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
        title: `Why the demo rules flagged: ${verdict.title}`,
        content: [
          `This prototype compares simulated sample readings for ${crew.name} with fixed demo rules:`,
          ...verdict.sensorCorrelationProof.map((line) => `• ${line}`),
          `Prototype explanation: ${verdict.primaryCauseText}. This is not a clinical conclusion.`,
        ].join('\n'),
        symptomAlerts: [],
      };
    }

    case 'CAN_CREW_WAIT': {
      if (verdict.severityGrade === 'GRADE_3') {
        return {
          title: 'Prototype flag: high priority',
          content: `The demo rules marked ${crew.name}'s sample scenario as high priority (${verdict.title}). This prototype cannot determine whether it is safe to wait or direct mission actions. Consult approved mission procedures and qualified personnel.`,
          symptomAlerts: ['DEMO RULE FLAG — NOT A SAFETY CLEARANCE'],
        };
      }
      if (verdict.severityGrade === 'GRADE_2') {
        return {
          title: 'Prototype flag: review',
          content: `The demo rules flagged ${verdict.title} for ${crew.name}. This prototype cannot determine urgency, treatment, or mission readiness. Review the sample readings with approved procedures and qualified personnel.`,
          symptomAlerts: ['DEMO RULE FLAG — NOT A SAFETY CLEARANCE'],
        };
      }
      return {
        title: 'No alert from the current demo rules',
        content: `The current sample readings did not trigger a demo alert for ${crew.name}. This is not a health assessment or clearance to continue a task.`,
        symptomAlerts: [],
      };
    }

    case 'EXPLAIN_DNA_AND_MEDS': {
      return {
        title: 'About the exploratory radiation estimates',
        content: [
          `• Estimated DNA breaks: ${molecular.estimatedDnaDsbPerCell.toFixed(3)} per cell.`,
          `• Oxidative-stress index: ${molecular.oxidativeStressIndexPct}%.`,
          `• Sample radiation reading: ${environment.radiationDoseRateMsvHr.toFixed(2)} mSv/h.`,
          'These are exploratory demo estimates, not validated biological measurements or medical recommendations.',
        ].join('\n'),
        symptomAlerts: [],
      };
    }

    case 'EXPLAIN_SANS_AND_EYES': {
      return {
        title: 'About the fluid-shift estimates',
        content: [
          `• Venous-shift estimate: ${vitals.fluidShift.venousEngorgementPct}%.`,
          `• Eye-pressure estimate: ${vitals.fluidShift.intraocularPressureMmHg.toFixed(1)} mmHg.`,
          `• Optic-nerve-width estimate: ${vitals.fluidShift.opticNerveSheathMm.toFixed(2)} mm.`,
          `• Demo category: ${verdict.sansAssessment.ocularEdemaStage}. These estimates are not validated measurements or a diagnosis.`,
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
      symptomAlerts.push('CREW-REPORTED: HEADACHE / DIZZINESS');
      if (environment.cabinCo2Pct >= 0.35) {
        lines.push(
          `• The crew report includes headache or dizziness. The sample cabin CO2 reading is ${environment.cabinCo2Pct.toFixed(2)}%. This is a data comparison only; the prototype cannot determine the cause.`
        );
      } else if (vitals.spO2Pct < 92) {
        lines.push(
          `• The crew report includes dizziness. Sample blood oxygen is ${vitals.spO2Pct.toFixed(1)}% and cabin pressure is ${environment.cabinPressurePsi.toFixed(1)} psi. This is a data comparison only; the prototype cannot determine the cause.`
        );
      } else {
        lines.push(
          `• The crew report includes headache or dizziness. Sample CO2 is ${environment.cabinCo2Pct.toFixed(2)}%, estimated venous shift is ${vitals.fluidShift.venousEngorgementPct}%, and modeled sleep debt is ${vitals.cognitiveFatigue.sleepDebt72HrHours} hours. These values do not establish a cause.`
        );
      }
    }

    if (hasVisionSymptom) {
      symptomAlerts.push('CREW-REPORTED: VISION / EYE CONCERN');
      lines.push(
        `• The crew report includes a vision or eye concern. Sample estimates: venous shift ${vitals.fluidShift.venousEngorgementPct}%, eye pressure ${vitals.fluidShift.intraocularPressureMmHg.toFixed(1)} mmHg, optic nerve width ${vitals.fluidShift.opticNerveSheathMm.toFixed(2)} mm. These estimates do not establish a diagnosis.`
      );
    }

    if (hasBreathingSymptom) {
      symptomAlerts.push('CREW-REPORTED: BREATHING / CHEST CONCERN');
      lines.push(
        `• Breathing Check: ${crew.name} is breathing at ${vitals.respirationRateBrPm} breaths/min with blood oxygen at ${vitals.spO2Pct.toFixed(1)}% and cabin pressure at ${environment.cabinPressurePsi.toFixed(1)} psi. ${
          vitals.spO2Pct < 92 || environment.cabinCo2Pct >= 0.45
            ? 'The demo rules flagged one or more sample readings. The prototype cannot determine the cause or recommend an action.'
            : 'The sample readings did not trigger these specific demo rules. This does not rule out a health concern.'
        }`
      );
    }

    if (hasNauseaOrRash) {
      symptomAlerts.push('CREW-REPORTED: NAUSEA / SKIN CONCERN');
      lines.push(
        `• Nausea / Skin Check: Current radiation rate is ${environment.radiationDoseRateMsvHr.toFixed(2)} mSv/h with ${molecular.oxidativeStressIndexPct}% cellular ROS stress. ${
          environment.radiationDoseRateMsvHr >= 1.5
            ? 'The sample radiation rate triggered a demo rule. The prototype cannot determine the cause of nausea or recommend treatment.'
            : 'The current demo rules do not determine the cause of nausea or skin changes.'
        }`
      );
    }

    return {
      title: `Crew report and sample readings for ${crew.name}`,
      content: `${lines.join('\n')}\n\nThe symptom description is self-reported. These simulated readings do not establish a diagnosis. For real concerns, use approved procedures and consult qualified personnel.`,
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
      title: 'About the HRV sample reading',
      content: `HRV RMSSD describes variation in time between heartbeats. The generated HRV reading for ${crew.name} is ${vitals.hrvRmssdMs} ms. This prototype does not establish a health interpretation from that value.`,
      symptomAlerts: [],
    };
  }

  if (q.includes('fatigue') || q.includes('canaria') || q.includes('pvt') || q.includes('sleep')) {
    return {
      title: 'About the fatigue estimate',
      content: `${crew.name}'s generated fatigue index is ${vitals.cognitiveFatigue.fatigueIndexPct}% (4-hour estimate ${vitals.cognitiveFatigue.projected4HrIndexPct}%). The simulator also models ${vitals.cognitiveFatigue.sleepDebt72HrHours} hours of sleep debt and a ${vitals.cognitiveFatigue.reactionLatencyPenaltyMs} ms reaction-time change. These values are illustrative and do not determine work or EVA readiness.`,
      symptomAlerts: [],
    };
  }

  if (q.includes('dna') || q.includes('ros') || q.includes('amifostine') || q.includes('pill') || q.includes('med')) {
    return answerQuickPromptInPlainEnglish('EXPLAIN_DNA_AND_MEDS', ctx);
  }

  // 4. Default: Full plain-english interpretation of the current screen
  return answerQuickPromptInPlainEnglish('EXPLAIN_ALL_CARDS', ctx);
}
