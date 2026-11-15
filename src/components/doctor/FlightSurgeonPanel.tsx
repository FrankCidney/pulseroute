import {
  Stethoscope,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Square,
  ClipboardList,
  Eye,
} from 'lucide-react';
import type { OperationalMode } from '../../types/crew';
import type { ClinicalDiagnosisVerdict, ClinicalSeverityGrade } from '../../types/diagnosis';

export interface FlightSurgeonPanelProps {
  verdict: ClinicalDiagnosisVerdict;
  operationalMode: OperationalMode;
  completedStepIds: ReadonlySet<string>;
  onToggleChecklistStep: (stepId: string) => void;
  onOpenSelfAssessmentWizard: () => void;
}

const SEVERITY_BADGE_MAP: Record<
  ClinicalSeverityGrade,
  { label: string; badgeClass: string; panelBorderClass: string }
> = {
  NOMINAL: {
    label: 'In demo range',
    badgeClass: 'bg-status-nominal/15 text-status-nominal border-status-nominal/40',
    panelBorderClass: 'border-space-border',
  },
  GRADE_1: {
    label: 'Monitor',
    badgeClass: 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40',
    panelBorderClass: 'border-accent-cyan/50',
  },
  GRADE_2: {
    label: 'Needs review',
    badgeClass: 'bg-status-warning/15 text-status-warning border-status-warning/40',
    panelBorderClass: 'border-status-warning/70',
  },
  GRADE_3: {
    label: 'Urgent alert',
    badgeClass: 'bg-status-critical/20 text-status-critical border-status-critical',
    panelBorderClass: 'border-status-critical ring-1 ring-status-critical/40',
  },
};

export function FlightSurgeonPanel({
  verdict,
  operationalMode,
  completedStepIds,
  onToggleChecklistStep,
  onOpenSelfAssessmentWizard,
}: FlightSurgeonPanelProps) {
  const isMarsMode = operationalMode === 'MARS_TRANSIT';
  const severityStyle = SEVERITY_BADGE_MAP[verdict.severityGrade];
  const displayTitle = isMarsMode ? verdict.title : verdict.earthClinicTitle;

  const completedCount = verdict.checklistSteps.filter((s) =>
    completedStepIds.has(s.id)
  ).length;
  const checklistDescriptions = [
    'Review the sample readings linked to this alert.',
    'Compare the readings with the selected demo scenario.',
    'Refer to approved mission medical and operations procedures.',
    'Save a snapshot for follow-up with the mission team.',
  ];

  return (
    <section
      className={`bg-space-hull border ${severityStyle.panelBorderClass} rounded-xl p-4 flex flex-col gap-3.5 transition-colors`}
      aria-label="Prototype health assessment and response steps"
    >
      {/* Top Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-space-border pb-2.5">
        <div className="flex items-center gap-2.5">
          <Stethoscope className="h-4 w-4 text-accent-cyan" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cockpit-primary">
            {isMarsMode
              ? 'HEALTH ASSESSMENT & NEXT STEPS'
              : 'HEALTH REVIEW & NEXT STEPS'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded border text-[11px] font-mono font-bold ${severityStyle.badgeClass}`}
          >
            {severityStyle.label}
          </span>
          <button
            type="button"
            onClick={onOpenSelfAssessmentWizard}
            className="min-h-[40px] px-3 py-1.5 rounded-lg bg-accent-cyan/15 hover:bg-accent-cyan/25 border border-accent-cyan/40 text-xs font-mono font-semibold text-accent-cyan flex items-center gap-1.5 transition-colors"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Guided self-check</span>
          </button>
        </div>
      </div>

      {/* Two-Column Split: Left Diagnostic Engine Verdict | Right Interactive Action Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 6 Cols: Deterministic Verdict & Multi-Sensor Correlation Proof */}
        <div className="lg:col-span-6 bg-space-void/90 border border-space-border rounded-lg p-3.5 flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cockpit-muted block">
                  PROTOTYPE ASSESSMENT
                </span>
                <h3 className="text-base font-bold text-cockpit-primary mt-0.5">
                  {displayTitle}
                </h3>
              </div>
              {verdict.severityGrade === 'GRADE_3' ? (
                <ShieldAlert className="h-6 w-6 text-status-critical shrink-0" />
              ) : verdict.severityGrade === 'NOMINAL' ? (
                <CheckCircle2 className="h-5 w-5 text-status-nominal shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-status-warning shrink-0" />
              )}
            </div>

            <p className="text-xs text-cockpit-muted">{verdict.primaryCauseText}</p>

            {/* Multi-Sensor Correlation Proof List */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-accent-cyan block">
                INDICATORS BEHIND THIS ALERT:
              </span>
              <ul className="space-y-1 text-xs font-mono text-cockpit-primary/90">
                {verdict.sensorCorrelationProof.map((line, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-accent-cyan">▸</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* SANS & Cephalic Fluid Shift Sub-Box */}
          <div className="pt-2 border-t border-space-border/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-cockpit-muted">
              <Eye className="h-3.5 w-3.5 text-accent-cyan" />
              FLUID SHIFT &amp; EYE INDICATORS: <strong className="text-cockpit-primary">{verdict.sansAssessment.ocularEdemaStage}</strong>
            </span>
            <span className="text-accent-cyan">
              {verdict.sansAssessment.metrics.lbnpRecommended
                ? 'Prototype suggests further review.'
                : 'No elevated prototype indicator.'}
            </span>
          </div>
        </div>

        {/* Right 6 Cols: Interactive Step-by-Step Emergency Checklist */}
        <div className="lg:col-span-6 bg-space-void/90 border border-space-border rounded-lg p-3.5 flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cockpit-primary">
              DEMO CHECKLIST — REVIEW EXAMPLES ONLY
            </span>
            <span className="text-xs font-mono text-accent-cyan tabular-nums">
              {completedCount} / {verdict.checklistSteps.length} COMPLETED
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {verdict.checklistSteps.map((step) => {
              const isDone = completedStepIds.has(step.id);
              const text =
                checklistDescriptions[step.stepNumber - 1] ??
                'Review the selected scenario and its sample readings.';

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => onToggleChecklistStep(step.id)}
                  className={`w-full min-h-[48px] text-left px-3 py-2 rounded-lg border transition-all flex items-start gap-2.5 ${
                    isDone
                      ? 'bg-status-nominal/10 border-status-nominal/40 text-cockpit-muted line-through'
                      : 'bg-space-void border-space-border hover:border-accent-cyan/50 text-cockpit-primary'
                  }`}
                >
                  {isDone ? (
                    <CheckSquare className="h-4 w-4 text-status-nominal shrink-0 mt-0.5" />
                  ) : (
                    <Square className="h-4 w-4 text-accent-cyan shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-accent-cyan">
                        STEP {step.stepNumber}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 leading-snug">{text}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

    </section>
  );
}
