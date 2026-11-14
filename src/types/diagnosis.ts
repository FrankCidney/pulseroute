import type { CrewHealthStatus, CrewId, FluidShiftMetrics } from './crew';

// --- NASA Exploration Medical Capabilities (ExMC) & IMPACT 1.0 (ICL) Contracts ---

export type ExmcConditionId =
  | 'NOMINAL_STATE'
  | 'EXMC_01_HYPERCAPNIA'
  | 'EXMC_02_HYPOXIA'
  | 'EXMC_03_SPE_RADIATION'
  | 'EXMC_04_SANS_FLUID_SHIFT'
  | 'EXMC_05_COGNITIVE_FATIGUE';

export type ClinicalSeverityGrade = 'NOMINAL' | 'GRADE_1' | 'GRADE_2' | 'GRADE_3';

// Structural interface for cabin atmospheric telemetry consumed by the clinical engine
// so the engine remains decoupled from UI environment components.
export interface EclssSensorInput {
  cabinPressurePsi: number;
  cabinCo2Pct: number;
  cabinO2Pct: number;
  radiationDoseRateMsvHr: number;
  ambientTempCelsius: number;
}

export interface ChecklistStep {
  id: string;
  stepNumber: number;
  instruction: string;
  earthClinicInstruction: string;
  targetSubsystem: string;
  critical: boolean;
}

export interface ExmcProtocol {
  conditionId: ExmcConditionId;
  iclCode: string;
  title: string;
  earthClinicTitle: string;
  defaultSeverityGrade: ClinicalSeverityGrade;
  crewStatus: CrewHealthStatus;
  timeToImpairmentText: string;
  diagnosticCriteriaSummary: string;
  flightSurgeonDirective: string;
  earthClinicDirective: string;
  checklistSteps: readonly ChecklistStep[];
}

export interface SansRiskAssessment {
  metrics: FluidShiftMetrics;
  severityGrade: ClinicalSeverityGrade;
  ocularEdemaStage: string;
  lbnpPrescription: string;
  clinicalSummary: string;
}

export interface ClinicalDiagnosisVerdict {
  crewId: CrewId;
  evaluatedAtMs: number;
  primaryConditionId: ExmcConditionId;
  iclCode: string;
  title: string;
  earthClinicTitle: string;
  severityGrade: ClinicalSeverityGrade;
  crewStatus: CrewHealthStatus;
  confidencePct: number;
  timeToImpairmentText: string;
  primaryCauseText: string;
  sensorCorrelationProof: readonly string[];
  flightSurgeonDirective: string;
  earthClinicDirective: string;
  checklistSteps: readonly ChecklistStep[];
  secondaryAlerts: readonly {
    conditionId: ExmcConditionId;
    title: string;
    severityGrade: ClinicalSeverityGrade;
  }[];
  sansAssessment: SansRiskAssessment;
}

export interface SelfAssessmentWizardStep {
  stepNumber: number;
  title: string;
  anatomicalTarget: string;
  instruction: string;
  verificationPrompt: string;
  nominalFinding: string;
  abnormalFinding: string;
}

export interface SelfAssessmentProcedure {
  id: 'ocular-ultrasound-sans' | 'astroskin-ecg-verification' | 'hypoxia-airway-triage';
  title: string;
  estimatedDurationMin: number;
  requiredKitItem: string;
  steps: readonly SelfAssessmentWizardStep[];
}
