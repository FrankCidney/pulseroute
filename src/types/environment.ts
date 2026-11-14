import type { CrewHealthStatus } from './crew';
import type { EclssSensorInput } from './diagnosis';

// --- Spacecraft ECLSS Life Support & NASA OSDR Molecular Countermeasure Types ---

export interface HabitatCompartmentStatus {
  moduleId: 'MOD_A_HAB' | 'MOD_B_LAB' | 'AIRLOCK_SHELTER';
  name: string;
  earthClinicZoneName: string;
  pressurePsi: number;
  cdraScrubberHealthPct: number;
  status: CrewHealthStatus;
  statusNote: string;
}

export interface EclssEnvironment extends EclssSensorInput {
  timestampMs: number;
  cabinCo2MmHg: number;
  relativeHumidityPct: number;
  solarProtonFluxPfu: number;
  cdraLiOhSaturationPct: number;
  stormShelterActive: boolean;
  overallStatus: CrewHealthStatus;
  compartments: readonly HabitatCompartmentStatus[];
}

export interface MolecularCountermeasureAssessment {
  /** Estimated DNA double-strand breaks (DSBs) per cell modeled from NASA OSDR OSD-379 */
  estimatedDnaDsbPerCell: number;
  /** Oxidative lipid peroxidation / ROS stress index (0-100) from OSD-379 & OSD-574 */
  oxidativeStressIndexPct: number;
  /** Inspiration4 (OSD-574) immune/skin inflammation biomarker shift */
  cytokineInflammationState: 'BASELINE' | 'MODERATE_UPREGULATION' | 'ACUTE_RADIATION_CASCADE';
  /** Risk classification */
  genomicRiskLevel: CrewHealthStatus;
  /** Primary prescribed prophylactic pharmaceutical countermeasure */
  prescribedPharmaceutical: string;
  /** Locker bay location for immediate crew retrieval */
  medKitLocation: string;
  /** Targeted nutritional & antioxidant countermeasure */
  nutritionalCountermeasure: string;
  /** Reference NASA Open Science Data Repository study IDs */
  osdrDatasetRefs: readonly string[];
}

export type OpticalScanMode = 'RETINAL_FUNDUS_SANS' | 'DERMATOLOGY_OSD574';

export interface OpticalScanFinding {
  mode: OpticalScanMode;
  title: string;
  gradeLabel: string;
  status: CrewHealthStatus;
  primaryObservation: string;
  biomarkerCorrelation: string;
  recommendedAction: string;
  confidencePct: number;
}
