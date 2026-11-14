import type { FluidShiftMetrics } from '../types/crew';
import type { ClinicalSeverityGrade, SansRiskAssessment } from '../types/diagnosis';

// --- Pure Deterministic Cephalic Fluid Shift & SANS Calculator (Ani's Cuff Model) ---
// In microgravity, loss of the hydrostatic pressure gradient shifts ~1.5 to 2.0 liters
// of intravascular and interstitial fluid toward the head, engorging the internal jugular
// vein, elevating intraocular pressure (IOP), and distending the optic nerve sheath.

export function evaluateSansAndFluidShift(params: {
  missionDaysInMicrogravity: number;
  venousEngorgementPct: number;
  intraocularPressureMmHg: number;
  opticNerveSheathMm: number;
  ambientCo2Pct: number;
}): SansRiskAssessment {
  const {
    missionDaysInMicrogravity,
    venousEngorgementPct,
    intraocularPressureMmHg,
    opticNerveSheathMm,
    ambientCo2Pct,
  } = params;

  // Elevated ambient CO2 causes cerebral vasodilation, compounding cephalic venous congestion
  const co2VasodilationBonus = ambientCo2Pct > 0.4 ? 3.5 : 0;
  const effectiveVenousPct = Number((venousEngorgementPct + co2VasodilationBonus).toFixed(1));

  let sansGrade: 0 | 1 | 2 | 3 = 0;
  let severityGrade: ClinicalSeverityGrade = 'NOMINAL';
  let ocularEdemaStage = 'Grade 0 — Normal Optic Disc Contour';
  let lbnpPrescription = 'Routine 15-min passive thigh cuff prophylaxis';

  if (
    effectiveVenousPct >= 24 ||
    intraocularPressureMmHg >= 21 ||
    opticNerveSheathMm >= 6.2
  ) {
    sansGrade = 3;
    severityGrade = 'GRADE_3';
    ocularEdemaStage =
      'Grade 3 — Frank Frisen Papilledema, Choroidal Folds & Hyperopic Shift';
    lbnpPrescription =
      'URGENT: LBNP Chamber -35 mmHg for 45 min twice daily + Ani Venous Thigh Cuffs';
  } else if (
    effectiveVenousPct >= 20 ||
    intraocularPressureMmHg >= 18.5 ||
    opticNerveSheathMm >= 5.8
  ) {
    sansGrade = 2;
    severityGrade = 'GRADE_2';
    ocularEdemaStage =
      'Grade 2 — Peripapillary Optic Disc Edema & Cotton Wool Spot Risk';
    lbnpPrescription =
      'ACTIVE: LBNP Chamber -30 mmHg for 30 min + Venous Constriction Cuffs (50 mmHg)';
  } else if (
    effectiveVenousPct >= 15 ||
    intraocularPressureMmHg >= 16.5 ||
    opticNerveSheathMm >= 5.5 ||
    missionDaysInMicrogravity > 90
  ) {
    sansGrade = 1;
    severityGrade = 'GRADE_1';
    ocularEdemaStage = 'Grade 1 — Mild Retinal Nerve Fiber Layer Thickening';
    lbnpPrescription = 'PREVENTIVE: LBNP -25 mmHg for 20 min prior to sleep cycle';
  }

  const lbnpRecommended = sansGrade >= 2;

  const metrics: FluidShiftMetrics = {
    venousEngorgementPct: effectiveVenousPct,
    intraocularPressureMmHg: Number(intraocularPressureMmHg.toFixed(1)),
    opticNerveSheathMm: Number(opticNerveSheathMm.toFixed(2)),
    sansGrade,
    lbnpRecommended,
  };

  const clinicalSummary =
    sansGrade >= 2
      ? `Cephalic shift +${effectiveVenousPct}% with IOP ${intraocularPressureMmHg.toFixed(
          1
        )} mmHg & ONSD ${opticNerveSheathMm.toFixed(2)} mm exceeds NASA ExMC SANS threshold.`
      : `Microgravity day ${missionDaysInMicrogravity}: Cephalic shift +${effectiveVenousPct}% within compensated range.`;

  return {
    metrics,
    severityGrade,
    ocularEdemaStage,
    lbnpPrescription,
    clinicalSummary,
  };
}
