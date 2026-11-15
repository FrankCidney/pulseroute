import { useState } from 'react';
import { Camera, Eye, Scan, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { FluidShiftMetrics } from '../../types/crew';
import type { OpticalScanFinding, OpticalScanMode } from '../../types/environment';

export interface OpticalScannerModalProps {
  crewName: string;
  fluidShift: FluidShiftMetrics;
  radiationRateMsvHr: number;
}

export function deriveOpticalScanFindings(params: {
  fluidShift: FluidShiftMetrics;
  radiationRateMsvHr: number;
}): Record<OpticalScanMode, OpticalScanFinding> {
  const { fluidShift, radiationRateMsvHr } = params;

  const retinalFinding: OpticalScanFinding =
    fluidShift.sansGrade >= 2
      ? {
          mode: 'RETINAL_FUNDUS_SANS',
          title: 'Retinal Fundus & Optic Disc Scan (SANS)',
          gradeLabel: `Frisen Grade ${fluidShift.sansGrade} Papilledema`,
          status: fluidShift.sansGrade === 3 ? 'CRITICAL' : 'WARNING',
          primaryObservation: `Peripapillary retinal nerve fiber layer edema with optic nerve sheath distension (${fluidShift.opticNerveSheathMm.toFixed(
            2
          )} mm) and IOP ${fluidShift.intraocularPressureMmHg.toFixed(1)} mmHg.`,
          biomarkerCorrelation: `Positive Cephalic Fluid Shift (+${fluidShift.venousEngorgementPct}% jugular venous volume).`,
          recommendedAction:
            'Initiate Lower Body Negative Pressure (LBNP -30 mmHg for 30 min) and log fundus frame to offline DB.',
          confidencePct: 97,
        }
      : {
          mode: 'RETINAL_FUNDUS_SANS',
          title: 'Retinal Fundus & Optic Disc Scan (SANS)',
          gradeLabel:
            fluidShift.sansGrade === 1
              ? 'Grade 1 Mild RNFL Thickening'
              : 'Grade 0 Crisp Optic Disc Margins',
          status: 'NOMINAL',
          primaryObservation: `Cup-to-disc ratio 0.3 with absence of cotton wool spots or choroidal folds (ONSD ${fluidShift.opticNerveSheathMm.toFixed(
            2
          )} mm).`,
          biomarkerCorrelation: `Cephalic fluid shift (+${fluidShift.venousEngorgementPct}%) compensated within normal microgravity envelope.`,
          recommendedAction: 'Continue scheduled weekly retinal surveillance scan.',
          confidencePct: 98,
        };

  const dermFinding: OpticalScanFinding =
    radiationRateMsvHr >= 2.0
      ? {
          mode: 'DERMATOLOGY_OSD574',
          title: 'Dermatological & Epithelial Barrier Scan (OSD-574)',
          gradeLabel: 'Grade 2 Microgravity Erythema & Barrier Stress',
          status: 'WARNING',
          primaryObservation:
            'Focal malar/forearm erythema with transepidermal water loss and radiation-induced oxidative stress markers.',
          biomarkerCorrelation:
            'Correlates with NASA OSDR OSD-574 (Inspiration4) skin microbiome & IL-6/IL-10 cytokine shift.',
          recommendedAction:
            'Apply topical barrier ceramide + hydrocortisone 1% cream from Locker Bay 1 and increase hydration.',
          confidencePct: 95,
        }
      : {
          mode: 'DERMATOLOGY_OSD574',
          title: 'Dermatological & Epithelial Barrier Scan (OSD-574)',
          gradeLabel: 'Grade 0 Intact Epidermal Barrier',
          status: 'NOMINAL',
          primaryObservation:
            'No acute contact dermatitis, petechiae, or radiation erythema detected across target skin region.',
          biomarkerCorrelation:
            'Matches nominal NASA OSDR OSD-574 flight dermatological baseline.',
          recommendedAction: 'No topical intervention required.',
          confidencePct: 99,
        };

  return {
    RETINAL_FUNDUS_SANS: retinalFinding,
    DERMATOLOGY_OSD574: dermFinding,
  };
}

export function OpticalScannerModal({
  crewName,
  fluidShift,
  radiationRateMsvHr,
}: OpticalScannerModalProps) {
  const [scanMode, setScanMode] = useState<OpticalScanMode>('RETINAL_FUNDUS_SANS');
  const [isModalExpanded, setIsModalExpanded] = useState(false);

  const findings = deriveOpticalScanFindings({ fluidShift, radiationRateMsvHr });
  const current = findings[scanMode];

  return (
    <>
      {/* Inline Lower-Right Cockpit HUD Card */}
      <section
        className="bg-space-hull border border-space-border rounded-xl p-4 h-full flex flex-col justify-between gap-3"
        aria-label="Multi-Modal Optical Scanner"
      >
        <div className="flex items-center justify-between border-b border-space-border pb-2.5">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-accent-cyan" />
            <h2 className="text-sm font-semibold text-cockpit-primary">
              Eye and skin scan examples
            </h2>
          </div>

          <div className="inline-flex rounded-md bg-space-void p-0.5 border border-space-border text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setScanMode('RETINAL_FUNDUS_SANS')}
              className={`px-2 py-1 rounded transition-colors ${
                scanMode === 'RETINAL_FUNDUS_SANS'
                  ? 'bg-accent-cyan text-space-void font-bold'
                  : 'text-cockpit-muted hover:text-cockpit-primary'
              }`}
            >
              EYE HEALTH
            </button>
            <button
              type="button"
              onClick={() => setScanMode('DERMATOLOGY_OSD574')}
              className={`px-2 py-1 rounded transition-colors ${
                scanMode === 'DERMATOLOGY_OSD574'
                  ? 'bg-accent-cyan text-space-void font-bold'
                  : 'text-cockpit-muted hover:text-cockpit-primary'
              }`}
            >
              SKIN HEALTH
            </button>
          </div>
        </div>

        {/* Simulated Retinal / Dermatological Optical Reticle */}
        <div className="bg-space-void/90 border border-space-border rounded-lg p-3 flex items-center gap-3">
          <div className="h-20 w-20 rounded-lg bg-space-elevated border border-accent-cyan/40 flex flex-col items-center justify-center relative shrink-0 overflow-hidden">
            <Eye className="h-8 w-8 text-accent-cyan" />
            <span className="text-[9px] font-mono text-cockpit-muted mt-1">
              {scanMode === 'RETINAL_FUNDUS_SANS' ? 'EYE SCAN DEMO' : 'SKIN SCAN DEMO'}
            </span>
          </div>

          <div className="space-y-1 text-xs min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  current.status === 'CRITICAL'
                    ? 'bg-status-critical/20 text-status-critical border-status-critical'
                    : current.status === 'WARNING'
                      ? 'bg-status-warning/15 text-status-warning border-status-warning/40'
                      : 'bg-status-nominal/15 text-status-nominal border-status-nominal/30'
                }`}
              >
                {current.gradeLabel}
              </span>
              <span className="text-[10px] font-mono text-cockpit-muted">DEMO ONLY</span>
            </div>
            <p className="text-cockpit-primary line-clamp-2 text-xs">
              {current.primaryObservation}
            </p>
            <p className="text-[11px] font-mono text-accent-cyan truncate">
              {current.biomarkerCorrelation}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalExpanded(true)}
          className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-space-elevated hover:bg-space-border border border-accent-cyan/40 text-xs font-mono font-semibold text-accent-cyan flex items-center justify-center gap-2 transition-colors"
        >
          <Scan className="h-4 w-4" />
          <span>View eye and skin scan examples</span>
        </button>
      </section>

      {/* Expanded Optical Scanner Modal */}
      {isModalExpanded ? (
        <div
          className="fixed inset-0 z-50 bg-space-void/85 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Multi-Modal Optical Triage Scanner"
        >
          <div className="bg-space-hull border border-accent-cyan/50 rounded-xl max-w-2xl w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-space-border pb-3">
              <div className="flex items-center gap-2.5">
                <Camera className="h-5 w-5 text-accent-cyan" />
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-cockpit-primary">
                    MULTI-MODAL OPTICAL SCANNER — {crewName.toUpperCase()}
                  </h3>
                  <p className="text-xs font-mono text-cockpit-muted">
                    Example eye and skin scan findings
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalExpanded(false)}
                className="min-h-[44px] min-w-[44px] rounded-lg bg-space-elevated hover:bg-space-border border border-space-border flex items-center justify-center text-cockpit-muted hover:text-cockpit-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setScanMode('RETINAL_FUNDUS_SANS')}
                className={`min-h-[48px] p-3 rounded-lg border text-left text-xs font-mono ${
                  scanMode === 'RETINAL_FUNDUS_SANS'
                    ? 'bg-accent-cyan/15 border-accent-cyan text-cockpit-primary font-bold'
                    : 'bg-space-void border-space-border text-cockpit-muted'
                }`}
              >
                Eye health
              </button>
              <button
                type="button"
                onClick={() => setScanMode('DERMATOLOGY_OSD574')}
                className={`min-h-[48px] p-3 rounded-lg border text-left text-xs font-mono ${
                  scanMode === 'DERMATOLOGY_OSD574'
                    ? 'bg-accent-cyan/15 border-accent-cyan text-cockpit-primary font-bold'
                    : 'bg-space-void border-space-border text-cockpit-muted'
                }`}
              >
                Skin health
              </button>
            </div>

            <div className="bg-space-void border border-space-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-accent-cyan">
                  {current.title}
                </span>
                <span className="text-xs font-mono font-bold text-cockpit-primary">
                  {current.gradeLabel}
                </span>
              </div>

              <p className="text-sm text-cockpit-primary">{current.primaryObservation}</p>

              <div className="p-3 rounded-lg bg-space-elevated border border-space-border space-y-1.5 text-xs font-mono">
                <div className="flex items-center gap-2 text-accent-cyan">
                  {current.status === 'NOMINAL' ? (
                    <CheckCircle2 className="h-4 w-4 text-status-nominal" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-status-warning" />
                  )}
                  <span>CORRELATION: {current.biomarkerCorrelation}</span>
                </div>
                <p className="text-cockpit-primary">
                  PROTOCOL ACTION: {current.recommendedAction}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalExpanded(false)}
                className="min-h-[48px] px-5 py-2 rounded-lg bg-accent-cyan text-space-void font-mono font-bold text-xs"
              >
                CLOSE OPTICAL SCANNER
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
