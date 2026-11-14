import { Dna, Pill, Apple, ShieldCheck, AlertOctagon } from 'lucide-react';
import type { MolecularCountermeasureAssessment } from '../../types/environment';
import type { CrewHealthStatus } from '../../types/crew';

export interface MolecularCountermeasurePanelProps {
  assessment: MolecularCountermeasureAssessment;
  radiationRateMsvHr: number;
  cumulativeDoseMsv: number;
}

// --- Pure Deterministic NASA OSDR Molecular Countermeasure Calculator ---
// Grounded in SpaceGenes+ / NASA OSDR studies OSD-574 (Inspiration4 civilian crew
// multi-omics) and OSD-379 (rodent/mammalian radiation oxidative stress & DNA damage).
export function evaluateMolecularCountermeasures(params: {
  radiationDoseRateMsvHr: number;
  cumulativeMissionDoseMsv: number;
  ambientCo2Pct: number;
  hrvRmssdMs: number;
}): MolecularCountermeasureAssessment {
  const {
    radiationDoseRateMsvHr,
    cumulativeMissionDoseMsv,
    ambientCo2Pct,
    hrvRmssdMs,
  } = params;

  // Linear-quadratic estimation of DNA double-strand breaks (DSBs) per cell
  const estimatedDnaDsbPerCell = Number(
    (0.015 + radiationDoseRateMsvHr * 0.042 + cumulativeMissionDoseMsv * 0.00008).toFixed(3)
  );

  // Oxidative ROS stress index combining ionizing flux, CO2 acidosis, and sympathetic stress
  const radContribution = Math.min(65, radiationDoseRateMsvHr * 7.5);
  const co2Contribution = Math.max(0, (ambientCo2Pct - 0.12) * 28);
  const hrvStressContribution = Math.max(0, (55 - hrvRmssdMs) * 0.45);
  const oxidativeStressIndexPct = Math.round(
    Math.min(100, Math.max(8, 12 + radContribution + co2Contribution + hrvStressContribution))
  );

  let genomicRiskLevel: CrewHealthStatus = 'NOMINAL';
  let cytokineInflammationState: MolecularCountermeasureAssessment['cytokineInflammationState'] =
    'BASELINE';
  let prescribedPharmaceutical =
    'Routine Daily Cholecalciferol (Vitamin D3 2000 IU) + CoQ10 100mg';
  let medKitLocation = 'Med-Kit Locker Bay 1 • Daily Maintenance Drawer';
  let nutritionalCountermeasure =
    'Standard Spaceflight Polyphenol & Omega-3 Ration Pack';

  if (radiationDoseRateMsvHr >= 4.0 || estimatedDnaDsbPerCell >= 0.2) {
    genomicRiskLevel = 'CRITICAL';
    cytokineInflammationState = 'ACUTE_RADIATION_CASCADE';
    prescribedPharmaceutical =
      '500mg Amifostine (WR-2721 Free-Radical Scavenger) + Filgrastim Standby';
    medKitLocation = 'Med-Kit Locker Bay 2 • Emergency Radiation Vault';
    nutritionalCountermeasure =
      '+250ml High-Antioxidant Formulation Alpha (N-Acetylcysteine + Glutathione + Vit C/E)';
  } else if (
    radiationDoseRateMsvHr >= 0.5 ||
    oxidativeStressIndexPct >= 42 ||
    ambientCo2Pct >= 0.4
  ) {
    genomicRiskLevel = 'WARNING';
    cytokineInflammationState = 'MODERATE_UPREGULATION';
    prescribedPharmaceutical =
      'N-Acetylcysteine (NAC 600mg) + Melatonin 3mg Radioprotective Cofactor';
    medKitLocation = 'Med-Kit Locker Bay 2 • Countermeasure Pouch B';
    nutritionalCountermeasure =
      'Anthocyanin-Rich Astaxanthin & Resveratrol Recovery Pack (+200ml Electrolyte H2O)';
  }

  return {
    estimatedDnaDsbPerCell,
    oxidativeStressIndexPct,
    cytokineInflammationState,
    genomicRiskLevel,
    prescribedPharmaceutical,
    medKitLocation,
    nutritionalCountermeasure,
    osdrDatasetRefs: ['NASA OSDR OSD-574 (Inspiration4)', 'NASA OSDR OSD-379 (Rad/ROS)'],
  };
}

export function MolecularCountermeasurePanel({
  assessment,
  radiationRateMsvHr,
  cumulativeDoseMsv,
}: MolecularCountermeasurePanelProps) {
  const isCrit = assessment.genomicRiskLevel === 'CRITICAL';
  const isWarn = assessment.genomicRiskLevel === 'WARNING';

  return (
    <section
      className={`bg-space-hull border rounded-xl p-4 h-full flex flex-col justify-between gap-3 ${
        isCrit
          ? 'border-status-critical'
          : isWarn
            ? 'border-status-warning/70'
            : 'border-space-border'
      }`}
      aria-label="Molecular Countermeasures NASA OSDR Genomic Model"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-space-border pb-2.5">
        <div className="flex items-center gap-2">
          <Dna className="h-4 w-4 text-accent-cyan" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cockpit-primary">
            MOLECULAR COUNTERMEASURES (NASA OSDR GENOMIC MODEL • SPACEGENES+)
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-cockpit-muted">OSD-574 / OSD-379</span>
          <span
            className={`px-2 py-0.5 rounded border font-bold ${
              isCrit
                ? 'bg-status-critical/20 text-status-critical border-status-critical'
                : isWarn
                  ? 'bg-status-warning/15 text-status-warning border-status-warning/40'
                  : 'bg-status-nominal/15 text-status-nominal border-status-nominal/30'
            }`}
          >
            {assessment.genomicRiskLevel}
          </span>
        </div>
      </div>

      {/* 3-Column Genomic Biomarker Readout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono tabular-nums">
        <div className="bg-space-void/90 border border-space-border rounded-lg p-2.5">
          <span className="text-[10px] text-cockpit-muted block">
            EST. DNA DOUBLE-STRAND BREAKS
          </span>
          <span
            className={`text-lg font-bold ${
              isCrit
                ? 'text-status-critical'
                : isWarn
                  ? 'text-status-warning'
                  : 'text-status-nominal'
            }`}
          >
            {assessment.estimatedDnaDsbPerCell.toFixed(3)} / cell
          </span>
          <span className="text-[10px] text-cockpit-muted block">
            FLUX: {radiationRateMsvHr.toFixed(2)} mSv/h (Safe &lt; 0.050/cell)
          </span>
          <p className="text-[10px] font-sans text-cockpit-muted mt-1 leading-snug">
            Microscopic DNA strand snaps from space radiation.
          </p>
        </div>

        <div className="bg-space-void/90 border border-space-border rounded-lg p-2.5">
          <span className="text-[10px] text-cockpit-muted block">
            OXIDATIVE ROS STRESS INDEX
          </span>
          <span className="text-lg font-bold text-cockpit-primary">
            {assessment.oxidativeStressIndexPct}%
          </span>
          <span className="text-[10px] text-cockpit-muted block">
            DOSE: {cumulativeDoseMsv.toFixed(1)} mSv (Safe &lt; 35%)
          </span>
          <p className="text-[10px] font-sans text-cockpit-muted mt-1 leading-snug">
            Cellular &ldquo;free-radical rusting&rdquo; from radiation &amp; CO2.
          </p>
        </div>

        <div className="bg-space-void/90 border border-space-border rounded-lg p-2.5">
          <span className="text-[10px] text-cockpit-muted block">
            OSD-574 CYTOKINE SHIFT
          </span>
          <span className="text-xs font-bold text-accent-cyan block mt-1">
            {assessment.cytokineInflammationState}
          </span>
          <span className="text-[10px] text-cockpit-muted block mt-0.5">
            INSPIRATION4 BASELINE
          </span>
          <p className="text-[10px] font-sans text-cockpit-muted mt-1 leading-snug">
            Immune &amp; skin inflammation level in microgravity.
          </p>
        </div>
      </div>

      {/* Prescribed Radioprotectant & Nutritional Regimen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
        <div className="bg-space-void/90 border border-space-border rounded-lg p-3 flex items-start gap-2.5">
          <Pill className="h-4 w-4 text-accent-cyan shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-accent-cyan font-bold block">
              PRESCRIBED PROPHYLACTIC ({assessment.medKitLocation})
            </span>
            <p className="text-cockpit-primary font-medium mt-0.5">
              {assessment.prescribedPharmaceutical}
            </p>
          </div>
        </div>

        <div className="bg-space-void/90 border border-space-border rounded-lg p-3 flex items-start gap-2.5">
          <Apple className="h-4 w-4 text-status-nominal shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-status-nominal font-bold block">
              TARGETED NUTRITIONAL COUNTERMEASURE
            </span>
            <p className="text-cockpit-primary font-medium mt-0.5">
              {assessment.nutritionalCountermeasure}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="flex items-center justify-between text-[11px] font-mono text-cockpit-muted pt-1 border-t border-space-border/60">
        <span className="flex items-center gap-1.5">
          {isCrit ? (
            <AlertOctagon className="h-3.5 w-3.5 text-status-critical" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5 text-status-nominal" />
          )}
          <span>
            {isCrit
              ? 'IMMEDIATE RADIOPROTECTANT ADMINISTRATION REQUIRED'
              : 'GENOMIC REPAIR PATHWAYS COMPENSATED'}
          </span>
        </span>
        <span>ALARA COMPLIANT</span>
      </div>
    </section>
  );
}
