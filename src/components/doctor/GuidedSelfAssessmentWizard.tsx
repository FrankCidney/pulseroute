import { useState } from 'react';
import {
  X,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
} from 'lucide-react';
import type { SelfAssessmentProcedure } from '../../types/diagnosis';

export interface GuidedSelfAssessmentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  crewName: string;
}

const SELF_ASSESSMENT_PROCEDURES: readonly SelfAssessmentProcedure[] = [
  {
    id: 'ocular-ultrasound-sans',
    title: 'Ocular Ultrasound & Optic Nerve Sheath (SANS) Exam',
    estimatedDurationMin: 4,
    requiredKitItem: 'Butterfly iQ+ / High-Frequency Linear Probe (Drawer B-1)',
    steps: [
      {
        stepNumber: 1,
        title: 'Apply Closed-Eyelid Acoustic Coupling Gel',
        anatomicalTarget: 'Right & Left Upper Eyelid (Supine / Neutral Gaze)',
        instruction:
          'Instruct crew member to close both eyes gently and look straight ahead. Apply a sterile Tegaderm film over the closed eyelid and place a 5mm mound of water-soluble ultrasound gel so zero pressure is applied to the globe.',
        verificationPrompt: 'Is the sterile film smooth with zero air bubbles over the lid?',
        nominalFinding: 'Clear anechoic vitreous humor visualization on B-mode display.',
        abnormalFinding: 'Acoustic shadowing or globe deformation from excessive probe pressure.',
      },
      {
        stepNumber: 2,
        title: 'Locate Retrobulbar Optic Nerve Shadow',
        anatomicalTarget: 'Transverse Axial Plane through Globe',
        instruction:
          'Rest your dominant hand on the crew member’s supraorbital rim or nasal bridge to stabilize the probe in 0G. Rock the probe slightly until the hypoechoic stripe of the optic nerve appears posterior to the retina.',
        verificationPrompt: 'Is the optic disc and retrobulbar nerve tract centered vertically?',
        nominalFinding: 'Flat posterior sclera with crisp optic nerve margins.',
        abnormalFinding: 'Anterior bulging of the optic disc into the vitreous chamber (Papilledema).',
      },
      {
        stepNumber: 3,
        title: 'Measure Optic Nerve Sheath Diameter (ONSD) 3mm Posterior',
        anatomicalTarget: '3.0 mm Posterior to Retina-Vitreous Interface',
        instruction:
          'Freeze the frame. Place Caliper A 3.0 mm behind the retina along the nerve axis, then place Caliper B perpendicular across the outer hypoechoic dural sheath borders.',
        verificationPrompt: 'Does the perpendicular ONSD measurement exceed 5.8 mm?',
        nominalFinding: 'ONSD < 5.5 mm (Compensated cephalic fluid shift; Grade 0 SANS).',
        abnormalFinding:
          'ONSD >= 5.8 mm confirms elevated intracranial pressure / ExMC-04 SANS. Initiate LBNP -30 mmHg.',
      },
    ],
  },
  {
    id: 'astroskin-ecg-verification',
    title: '3-Lead Astroskin Thoracic ECG & Electrode Calibration',
    estimatedDurationMin: 3,
    requiredKitItem: 'Astroskin Smart Vest + Conductive Saline Spray (Locker A-2)',
    steps: [
      {
        stepNumber: 1,
        title: 'Inspect Thoracic Silver-Dry Textile Electrodes',
        anatomicalTarget: 'Right Infraclavicular, Left Infraclavicular & Left Lower Rib Cage',
        instruction:
          'Open the front zipper port slightly and verify that all three silver-coated textile ECG pads sit flush against the skin without folding during microgravity torso elongation.',
        verificationPrompt: 'Are all three textile pads positioned flat against the chest wall?',
        nominalFinding: 'Baseline impedance < 5 kOhm across Lead I, II, and III.',
        abnormalFinding: 'High-frequency baseline artifact from microgravity garment lift.',
      },
      {
        stepNumber: 2,
        title: 'Mist Electrodes with Conductive Saline & Tension Band',
        anatomicalTarget: 'Mid-Axillary Elastic Retention Straps',
        instruction:
          'Apply 1 spray of sterile conductive saline to each pad and cinch the thoracic respiration band by 1 notch so chest excursion tracks cleanly.',
        verificationPrompt: 'Has the Lead II R-wave amplitude stabilized above 0.8 mV?',
        nominalFinding: 'Crisp P-QRS-T morphology with < 2% packet loss.',
        abnormalFinding: 'Persistent ST-segment shift or tachyarrhythmia requiring 12-lead backup.',
      },
    ],
  },
  {
    id: 'hypoxia-airway-triage',
    title: 'Acute Hypoxia, Capillary Refill & Cuff BP Verification',
    estimatedDurationMin: 2,
    requiredKitItem: 'Manual Sphygmomanometer + Pulse Oximeter Reference Clip',
    steps: [
      {
        stepNumber: 1,
        title: 'Cross-Check Peripheral vs. Central Cyanosis & Capillary Refill',
        anatomicalTarget: 'Nailbed of Index Finger & Oral Mucosa',
        instruction:
          'Compress the distal nailbed for 5 seconds and release. Count seconds until pink perfusion returns to rule out cold-induced peripheral vasoconstriction artifact.',
        verificationPrompt: 'Does nailbed capillary refill complete in under 2.0 seconds?',
        nominalFinding: 'Capillary refill < 2 sec; warm extremities; true SpO2 >= 95%.',
        abnormalFinding: 'Refill > 3 sec or circumoral cyanosis confirms true arterial hypoxia.',
      },
      {
        stepNumber: 2,
        title: 'Verify Brachial Cuff Blood Pressure & Pulse Pressure',
        anatomicalTarget: 'Left Upper Arm (2 cm above Antecubital Fossa)',
        instruction:
          'Wrap manual cuff snug around the upper arm, inflate to 180 mmHg, and deflate at 2 mmHg/sec while monitoring radial pulse return.',
        verificationPrompt: 'Is Systolic BP between 95 and 135 mmHg?',
        nominalFinding: 'Normotensive perfusion with stable pulse pressure (35-45 mmHg).',
        abnormalFinding: 'Hypotension (< 90 mmHg systolic) or widened pulse pressure.',
      },
    ],
  },
];

export function GuidedSelfAssessmentWizard({
  isOpen,
  onClose,
  crewName,
}: GuidedSelfAssessmentWizardProps) {
  const [selectedProcId, setSelectedProcId] = useState<SelfAssessmentProcedure['id']>(
    'ocular-ultrasound-sans'
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [recordedFinding, setRecordedFinding] = useState<'NOMINAL' | 'ABNORMAL' | null>(
    null
  );

  if (!isOpen) return null;

  const activeProc =
    SELF_ASSESSMENT_PROCEDURES.find((p) => p.id === selectedProcId) ??
    SELF_ASSESSMENT_PROCEDURES[0];
  const currentStep = activeProc.steps[stepIndex] ?? activeProc.steps[0];

  const handleSelectProcedure = (id: SelfAssessmentProcedure['id']) => {
    setSelectedProcId(id);
    setStepIndex(0);
    setRecordedFinding(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-space-void/85 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Guided Clinical Self-Assessment Wizard"
    >
      <div className="bg-space-hull border border-accent-cyan/50 rounded-xl max-w-3xl w-full p-5 shadow-2xl flex flex-col gap-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-space-border pb-3">
          <div className="flex items-center gap-2.5">
            <Stethoscope className="h-5 w-5 text-accent-cyan" />
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-cockpit-primary">
                GUIDED SELF-ASSESSMENT WIZARD (NON-PHYSICIAN CMO PROTOCOL)
              </h2>
              <p className="text-xs font-mono text-cockpit-muted">
                SUBJECT: {crewName.toUpperCase()} • STEP-BY-STEP VISUAL DIAGNOSTIC GUIDE
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-lg bg-space-elevated hover:bg-space-border border border-space-border flex items-center justify-center text-cockpit-muted hover:text-cockpit-primary"
            aria-label="Close Guided Wizard"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Procedure Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SELF_ASSESSMENT_PROCEDURES.map((proc) => {
            const active = proc.id === selectedProcId;
            return (
              <button
                key={proc.id}
                type="button"
                onClick={() => handleSelectProcedure(proc.id)}
                className={`min-h-[48px] p-2.5 rounded-lg border text-left text-xs font-mono transition-all ${
                  active
                    ? 'bg-accent-cyan/15 border-accent-cyan text-cockpit-primary font-bold'
                    : 'bg-space-void border-space-border text-cockpit-muted hover:text-cockpit-primary'
                }`}
              >
                <span className="block truncate">{proc.title}</span>
                <span className="text-[10px] text-accent-cyan">~{proc.estimatedDurationMin} MIN</span>
              </button>
            );
          })}
        </div>

        {/* Required Medical Kit Banner */}
        <div className="bg-space-void border border-space-border rounded-lg px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <span className="text-cockpit-muted">
            REQUIRED MED-KIT HARDWARE:{' '}
            <strong className="text-cockpit-primary">{activeProc.requiredKitItem}</strong>
          </span>
          <span className="text-accent-cyan">
            STEP {stepIndex + 1} OF {activeProc.steps.length}
          </span>
        </div>

        {/* Active Step Card */}
        <div className="bg-space-void/90 border border-space-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-accent-cyan font-bold">
              STEP {currentStep.stepNumber}: {currentStep.title}
            </span>
            <span className="text-xs font-mono text-cockpit-muted">
              TARGET: {currentStep.anatomicalTarget}
            </span>
          </div>

          <p className="text-sm text-cockpit-primary leading-relaxed">
            {currentStep.instruction}
          </p>

          <div className="p-3 rounded-lg bg-space-elevated border border-space-border space-y-2">
            <p className="text-xs font-mono font-bold text-cockpit-primary">
              VERIFICATION CHECK: {currentStep.verificationPrompt}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setRecordedFinding('NOMINAL')}
                className={`min-h-[56px] p-2.5 rounded-lg border text-left text-xs transition-all flex items-start gap-2 ${
                  recordedFinding === 'NOMINAL'
                    ? 'bg-status-nominal/20 border-status-nominal text-cockpit-primary'
                    : 'bg-space-void border-space-border text-cockpit-muted hover:text-cockpit-primary'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 text-status-nominal shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono font-bold text-status-nominal block">
                    NOMINAL FINDING
                  </span>
                  <span>{currentStep.nominalFinding}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRecordedFinding('ABNORMAL')}
                className={`min-h-[56px] p-2.5 rounded-lg border text-left text-xs transition-all flex items-start gap-2 ${
                  recordedFinding === 'ABNORMAL'
                    ? 'bg-status-warning/20 border-status-warning text-cockpit-primary'
                    : 'bg-space-void border-space-border text-cockpit-muted hover:text-cockpit-primary'
                }`}
              >
                <AlertTriangle className="h-4 w-4 text-status-warning shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono font-bold text-status-warning block">
                    ABNORMAL / PATHOLOGICAL
                  </span>
                  <span>{currentStep.abnormalFinding}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Wizard Stepper Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-space-border">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => {
              setStepIndex((i) => Math.max(0, i - 1));
              setRecordedFinding(null);
            }}
            className="min-h-[48px] px-4 py-2 rounded-lg bg-space-elevated disabled:opacity-40 border border-space-border text-xs font-mono text-cockpit-primary flex items-center gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>PREVIOUS STEP</span>
          </button>

          {stepIndex < activeProc.steps.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                setStepIndex((i) => Math.min(activeProc.steps.length - 1, i + 1));
                setRecordedFinding(null);
              }}
              className="min-h-[48px] px-4 py-2 rounded-lg bg-accent-cyan text-space-void font-mono font-bold text-xs flex items-center gap-1.5"
            >
              <span>NEXT STEP</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-4 py-2 rounded-lg bg-status-nominal text-space-void font-mono font-bold text-xs flex items-center gap-1.5"
            >
              <ClipboardCheck className="h-4 w-4" />
              <span>COMPLETE SELF-ASSESSMENT</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
