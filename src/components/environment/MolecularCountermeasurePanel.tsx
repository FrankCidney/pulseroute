import { Dna, ShieldCheck, AlertOctagon } from 'lucide-react';
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
      aria-label="Illustrative radiation-health estimates"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-space-border pb-2.5">
        <div className="flex items-center gap-2">
          <Dna className="h-4 w-4 text-accent-cyan" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cockpit-primary">
            Radiation-health estimates
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

      <p className="text-sm leading-relaxed text-cockpit-muted">
        These are exploratory prototype estimates, not a validated NASA model or medical assessment.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 tabular-nums">
        <div className="bg-space-void/90 border border-space-border rounded-lg p-2.5">
          <span className="text-[10px] text-cockpit-muted block">
            ESTIMATED DNA DAMAGE INDICATOR
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
            Radiation rate: {radiationRateMsvHr.toFixed(2)} mSv/h
          </span>
          <p className="text-[10px] font-sans text-cockpit-muted mt-1 leading-snug">
            Illustrative indicator based on simulated readings.
          </p>
        </div>

        <div className="bg-space-void/90 border border-space-border rounded-lg p-2.5">
          <span className="text-[10px] text-cockpit-muted block">
            ILLUSTRATIVE CELL-STRESS SCORE
          </span>
          <span className="text-lg font-bold text-cockpit-primary">
            {assessment.oxidativeStressIndexPct}%
          </span>
          <span className="text-[10px] text-cockpit-muted block">
            Cumulative sample dose: {cumulativeDoseMsv.toFixed(1)} mSv
          </span>
          <p className="text-[10px] font-sans text-cockpit-muted mt-1 leading-snug">
            Exploratory score using radiation, cabin CO₂, and HRV inputs.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-status-warning/40 bg-status-warning/5 p-3 text-sm text-cockpit-primary">
        This prototype does not provide medication or nutrition recommendations. NASA dataset references are available under Sources &amp; saved data.
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
              ? 'SIMULATED RADIATION LEVEL IS HIGH'
              : 'SIMULATED RADIATION LEVEL IS WITHIN RANGE'}
          </span>
        </span>
        <span>Demo estimate</span>
      </div>
    </section>
  );
}
