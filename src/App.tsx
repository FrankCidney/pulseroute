import { useState } from 'react';
import { Shield } from 'lucide-react';
import { TopHudBar } from './components/layout/TopHudBar';
import { PageNav } from './components/layout/PageNav';
import { CrewRoster } from './components/crew/CrewRoster';
import { VitalsGrid } from './components/telemetry/VitalsGrid';
import { EclssPanel } from './components/environment/EclssPanel';
import { CabinAtmosphere } from './components/environment/CabinAtmosphere';
import {
  MolecularCountermeasurePanel,
  evaluateMolecularCountermeasures,
} from './components/environment/MolecularCountermeasurePanel';
import { FlightSurgeonPanel } from './components/doctor/FlightSurgeonPanel';
import { GuidedSelfAssessmentWizard } from './components/doctor/GuidedSelfAssessmentWizard';
import { OpticalScannerModal } from './components/doctor/OpticalScannerModal';
import { ScenarioBar } from './components/scenarios/ScenarioBar';
import { NasaAttributionModal } from './components/scenarios/NasaAttributionModal';
import { useAuraCockpit } from './hooks/useAuraCockpit';
import type { CrewMember, CrewId, OperationalMode } from './types/crew';
import type { CrewTelemetryStream } from './types/telemetry';
import type { ClinicalDiagnosisVerdict } from './types/diagnosis';
import type { EclssEnvironment, MolecularCountermeasureAssessment } from './types/environment';

type PageId = 'overview' | 'telemetry' | 'environment' | 'medical' | 'crew';

export function App() {
  const {
    operationalMode,
    setOperationalMode,
    activeScenarioId,
    handleSelectScenario,
    selectedCrewId,
    setSelectedCrewId,
    snapshot,
    missionElapsedSeconds,
    earthDistanceMillionMiles,
    oneWayCommsDelaySeconds,
    completedStepIds,
    handleToggleChecklistStep,
    recentLogs,
    queuedBursts,
    handleQueueBurstTransmission,
    handleClearBursts,
    lastBurstToast,
  } = useAuraCockpit();

  const [activePage, setActivePage] = useState<PageId>('overview');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isNasaModalOpen, setIsNasaModalOpen] = useState(false);

  const selectedCrew =
    snapshot.crewRoster.find((c) => c.id === selectedCrewId) ??
    snapshot.crewRoster[0];
  const selectedStream = snapshot.streamsByCrewId[selectedCrew.id];
  const selectedVerdict = snapshot.verdictsByCrewId[selectedCrew.id];

  const activeEmergencyCount = snapshot.crewRoster.filter(
    (c) => c.status === 'CRITICAL'
  ).length;

  const molecularAssessment = evaluateMolecularCountermeasures({
    radiationDoseRateMsvHr:
      selectedStream.latestVitals.personalRadiationRateMsvHr,
    cumulativeMissionDoseMsv:
      selectedStream.latestVitals.cumulativeMissionDoseMsv,
    ambientCo2Pct: snapshot.environment.cabinCo2Pct,
    hrvRmssdMs: selectedStream.latestVitals.hrvRmssdMs,
  });

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <PageNav
          activePage={activePage}
          onSelectPage={setActivePage}
          operationalMode={operationalMode}
          activeEmergencyCount={activeEmergencyCount}
          variant="top"
        />
        <TopHudBar
          operationalMode={operationalMode}
          onToggleOperationalMode={setOperationalMode}
          missionElapsedSeconds={missionElapsedSeconds}
          earthDistanceMillionMiles={earthDistanceMillionMiles}
          oneWayCommsDelaySeconds={oneWayCommsDelaySeconds}
          queuedBurstCount={queuedBursts.length}
          onQueueBurstTransmission={() => {
            void handleQueueBurstTransmission();
          }}
          onOpenNasaAttribution={() => setIsNasaModalOpen(true)}
          activeEmergencyCount={activeEmergencyCount}
        />

        <div className="border-b border-space-border bg-space-hull/60 px-4 py-2">
          <div className="max-w-[1600px] mx-auto">
            <ScenarioBar
              activeScenarioId={activeScenarioId}
              onSelectScenario={handleSelectScenario}
              operationalMode={operationalMode}
            />
          </div>
        </div>

        <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 flex flex-col gap-3">
          {activePage === 'overview' && (
            <OverviewPage
              crewMembers={snapshot.crewRoster}
              selectedCrew={selectedCrew}
              selectedStream={selectedStream}
              selectedVerdict={selectedVerdict}
              environment={snapshot.environment}
              molecularAssessment={molecularAssessment}
              operationalMode={operationalMode}
              activeScenarioId={activeScenarioId}
              activeEmergencyCount={activeEmergencyCount}
              onSelectCrew={setSelectedCrewId}
            />
          )}
          {activePage === 'telemetry' && (
            <VitalsGrid
              selectedCrew={selectedCrew}
              telemetryStream={selectedStream}
              ambientCo2Pct={snapshot.environment.cabinCo2Pct}
              operationalMode={operationalMode}
            />
          )}
          {activePage === 'environment' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <EclssPanel
                environment={snapshot.environment}
                operationalMode={operationalMode}
              />
              <MolecularCountermeasurePanel
                assessment={molecularAssessment}
                radiationRateMsvHr={
                  selectedStream.latestVitals.personalRadiationRateMsvHr
                }
                cumulativeDoseMsv={
                  selectedStream.latestVitals.cumulativeMissionDoseMsv
                }
              />
            </div>
          )}
          {activePage === 'medical' && (
            <FlightSurgeonPanel
              verdict={selectedVerdict}
              operationalMode={operationalMode}
              completedStepIds={completedStepIds}
              onToggleChecklistStep={handleToggleChecklistStep}
              onOpenSelfAssessmentWizard={() => setIsWizardOpen(true)}
            />
          )}
          {activePage === 'crew' && (
            <CrewRoster
              crewMembers={snapshot.crewRoster}
              selectedCrewId={selectedCrew.id}
              onSelectCrew={setSelectedCrewId}
              operationalMode={operationalMode}
            />
          )}
        </main>

        <footer className="border-t border-space-border bg-space-hull px-4 py-2.5 text-xs font-mono text-cockpit-muted">
          <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                AURA DETERMINISTIC CLINICAL CORE • NASA ExMC ICL 1.0 &amp; OSDR (OSD-574 / OSD-379)
              </span>
              {lastBurstToast && (
                <span className="text-accent-cyan">{lastBurstToast}</span>
              )}
            </div>
            <span className="text-status-nominal">
              INDEXEDDB (DEXIE) STORE-AND-FORWARD ACTIVE • 0% AI HALLUCINATION RISK
            </span>
          </div>
        </footer>
      </div>

      <GuidedSelfAssessmentWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        crewName={selectedCrew.name}
      />

      <NasaAttributionModal
        isOpen={isNasaModalOpen}
        onClose={() => setIsNasaModalOpen(false)}
        recentLogs={recentLogs}
        queuedBursts={queuedBursts}
        onClearBursts={() => {
          void handleClearBursts();
        }}
      />

      <OpticalScannerModal
        crewName={selectedCrew.name}
        fluidShift={selectedStream.latestVitals.fluidShift}
        radiationRateMsvHr={
          selectedStream.latestVitals.personalRadiationRateMsvHr
        }
      />
    </>
  );
}

interface OverviewPageProps {
  crewMembers: readonly CrewMember[];
  selectedCrew: CrewMember;
  selectedStream: CrewTelemetryStream;
  selectedVerdict: ClinicalDiagnosisVerdict;
  environment: EclssEnvironment;
  molecularAssessment: MolecularCountermeasureAssessment;
  operationalMode: OperationalMode;
  activeScenarioId: string;
  activeEmergencyCount: number;
  onSelectCrew: (crewId: CrewId) => void;
}

function OverviewPage({
  crewMembers,
  selectedCrew,
  selectedStream,
  selectedVerdict,
  environment,
  molecularAssessment,
  operationalMode,
  activeScenarioId,
  activeEmergencyCount,
  onSelectCrew,
}: OverviewPageProps) {
  const { latestVitals } = selectedStream;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
      {/* Left column: crew roster + environment mini */}
      <div className="lg:col-span-4 flex flex-col gap-3">
        <CrewRoster
          crewMembers={crewMembers}
          selectedCrewId={selectedCrew.id}
          onSelectCrew={onSelectCrew}
          operationalMode={operationalMode}
        />
        <div className="bg-space-hull border border-space-border rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-space-border pb-1.5">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cockpit-primary">
              CABIN ENVIRONMENT
            </h2>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                environment.overallStatus === 'CRITICAL'
                  ? 'bg-status-critical/20 text-status-critical border-status-critical'
                  : environment.overallStatus === 'WARNING'
                    ? 'bg-status-warning/15 text-status-warning border-status-warning/40'
                    : 'bg-status-nominal/15 text-status-nominal border-status-nominal/30'
              }`}
            >
              {environment.overallStatus}
            </span>
          </div>
          <CabinAtmosphere environment={environment} operationalMode={operationalMode} />
        </div>
      </div>

      {/* Right column: vitals summary + status */}
      <div className="lg:col-span-8 flex flex-col gap-3">
        <div className="bg-space-hull border border-space-border rounded-xl p-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-space-border pb-2">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-lg flex items-center justify-center border border-accent-cyan/40 text-accent-cyan">
                  <Shield className="h-3 w-3" />
                </div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cockpit-primary">
                  MISSION STATUS
                </h2>
              </div>
              <span
                className={`text-[11px] font-mono text-cockpit-muted`}
              >
                SCENARIO {activeScenarioId.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div
              className={`bg-space-void/90 border rounded-lg p-2.5 flex flex-col justify-between gap-1.5 ${
                activeEmergencyCount > 0
                  ? 'border-status-critical'
                  : 'border-space-border'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-cockpit-muted">
                <span>ACTIVE EMERGENCIES</span>
                <span>{activeEmergencyCount}</span>
              </div>
              <div className="font-mono tabular-nums flex items-baseline gap-1">
                <span className={`text-xl font-bold ${
                  activeEmergencyCount > 0 ? 'text-status-critical' : 'text-status-nominal'
                }`}>
                  {activeEmergencyCount}
                </span>
              </div>
            </div>

            <div className="bg-space-void/90 border border-space-border rounded-lg p-2.5 flex flex-col justify-between gap-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-cockpit-muted">
                <span>GENOMIC RISK</span>
                <span>{molecularAssessment.genomicRiskLevel}</span>
              </div>
              <div className="font-mono tabular-nums flex items-baseline gap-1">
                <span className="text-xl font-bold text-cockpit-primary">
                  {molecularAssessment.oxidativeStressIndexPct}%
                </span>
                <span className="text-[11px] text-cockpit-muted">ROS STRESS</span>
              </div>
            </div>
          </div>

          <div className="bg-space-void/90 border border-space-border rounded-lg p-2.5 flex flex-col gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cockpit-muted block">
              PRIMARY DIAGNOSIS
            </span>
            <h3 className="text-sm font-bold text-cockpit-primary">
              {selectedVerdict.title}
            </h3>
            <p className="text-xs text-cockpit-muted">{selectedVerdict.primaryCauseText}</p>
            <div className="flex items-center gap-1.5 text-xs font-mono pt-1 border-t border-space-border/60">
              <span className="text-cockpit-muted">TIME TO IMPAIRMENT:</span>
              <span className="text-cockpit-primary font-semibold">
                {selectedVerdict.timeToImpairmentText}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-space-hull border border-space-border rounded-xl p-3 flex flex-col gap-3 h-full">
          <div className="flex items-center justify-between border-b border-space-border pb-2">
            <div className="flex items-center gap-2.5">
              <div className="h-4 w-4 rounded-lg flex items-center justify-center border border-accent-cyan/40 text-accent-cyan">
                <Shield className="h-3 w-3" />
              </div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cockpit-primary">
                KEY VITALS — {selectedCrew.name.toUpperCase()}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-space-void/90 border border-space-border rounded-lg p-2.5 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-cockpit-muted">
                <span>HEART RATE</span>
                <span>BPM</span>
              </div>
              <div className="font-mono tabular-nums flex items-baseline gap-1">
                <span className="text-xl font-bold text-cockpit-primary">
                  {latestVitals.heartRateBpm}
                </span>
              </div>
            </div>
            <div className="bg-space-void/90 border border-space-border rounded-lg p-2.5 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-cockpit-muted">
                <span>BLOOD OXYGEN</span>
                <span>%</span>
              </div>
              <div className="font-mono tabular-nums flex items-baseline gap-1">
                <span className="text-xl font-bold text-cockpit-primary">
                  {latestVitals.spO2Pct.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="bg-space-void/90 border border-space-border rounded-lg p-2.5 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-cockpit-muted">
                <span>HRV RMSSD</span>
                <span>ms</span>
              </div>
              <div className="font-mono tabular-nums flex items-baseline gap-1">
                <span className="text-xl font-bold text-cockpit-primary">
                  {latestVitals.hrvRmssdMs}
                </span>
              </div>
            </div>
            <div className="bg-space-void/90 border border-space-border rounded-lg p-2.5 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-cockpit-muted">
                <span>CORE TEMP</span>
                <span>°C</span>
              </div>
              <div className="font-mono tabular-nums flex items-baseline gap-1">
                <span className="text-xl font-bold text-cockpit-primary">
                  {latestVitals.coreTempCelsius.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
