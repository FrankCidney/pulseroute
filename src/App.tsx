import { useState } from 'react';
import { ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
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
import { CrewCheckInReport } from './components/doctor/CrewCheckInReport';
import { AiFlightSurgeonChat } from './components/doctor/AiFlightSurgeonChat';
import { ScenarioBar } from './components/scenarios/ScenarioBar';
import { NasaAttributionModal } from './components/scenarios/NasaAttributionModal';
import { useAuraCockpit } from './hooks/useAuraCockpit';
import { getScenarioPresetById, type ScenarioId } from './services/scenarioPresets';
import type { CrewMember, CrewId, OperationalMode } from './types/crew';
import type { CrewTelemetryStream } from './types/telemetry';
import type { ClinicalDiagnosisVerdict } from './types/diagnosis';
import type { EclssEnvironment } from './types/environment';

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
    (c) => c.status !== 'NOMINAL'
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
          oneWayCommsDelaySeconds={oneWayCommsDelaySeconds}
          queuedBurstCount={queuedBursts.length}
          onQueueBurstTransmission={() => {
            void handleQueueBurstTransmission();
          }}
          onOpenNasaAttribution={() => setIsNasaModalOpen(true)}
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
          <div className="rounded-lg border border-status-warning/40 bg-status-warning/5 px-4 py-3 text-sm text-cockpit-primary">
            <strong>Prototype demo:</strong> All readings are simulated. This version does not connect to medical devices and is not clinical guidance.
          </div>
          {activePage === 'overview' && (
            <OverviewPage
              crewMembers={snapshot.crewRoster}
              selectedCrew={selectedCrew}
              selectedStream={selectedStream}
              selectedVerdict={selectedVerdict}
              environment={snapshot.environment}
              operationalMode={operationalMode}
              activeScenarioId={activeScenarioId}
              activeEmergencyCount={activeEmergencyCount}
              onSelectCrew={setSelectedCrewId}
              onOpenMedicalTab={() => setActivePage('medical')}
              scenarioId={activeScenarioId}
              molecular={molecularAssessment}
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
            <div className="flex flex-col gap-3">
              <FlightSurgeonPanel
                verdict={selectedVerdict}
                operationalMode={operationalMode}
                completedStepIds={completedStepIds}
                onToggleChecklistStep={handleToggleChecklistStep}
                onOpenSelfAssessmentWizard={() => setIsWizardOpen(true)}
              />
              <div className="rounded-lg border border-space-border bg-space-hull p-4 text-sm leading-relaxed text-cockpit-muted">
                <h2 className="font-semibold text-cockpit-primary">About this demonstration</h2>
                <p className="mt-1">
                  Alerts and assistant explanations use simulated readings and prototype rules. The optional on-device AI may be inaccurate. Neither the assistant nor checklist provides medical advice or replaces approved mission procedures.
                </p>
              </div>
            </div>
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
                AURA · Astronaut health monitoring prototype
              </span>
              {lastBurstToast && (
                <span className="text-accent-cyan">{lastBurstToast}</span>
              )}
            </div>
            <span className="text-cockpit-muted">
              Demonstration only · simulated readings · not medical advice
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
    </>
  );
}

interface OverviewPageProps {
  crewMembers: readonly CrewMember[];
  selectedCrew: CrewMember;
  selectedStream: CrewTelemetryStream;
  selectedVerdict: ClinicalDiagnosisVerdict;
  environment: EclssEnvironment;
  operationalMode: OperationalMode;
  activeScenarioId: ScenarioId;
  activeEmergencyCount: number;
  onSelectCrew: (crewId: CrewId) => void;
  onOpenMedicalTab: () => void;
  scenarioId: ScenarioId;
  molecular: ReturnType<typeof evaluateMolecularCountermeasures>;
}

function OverviewPage({
  crewMembers,
  selectedCrew,
  selectedStream,
  selectedVerdict,
  environment,
  operationalMode,
  activeScenarioId,
  activeEmergencyCount,
  onSelectCrew,
  onOpenMedicalTab,
  scenarioId,
  molecular,
}: OverviewPageProps) {
  const { latestVitals } = selectedStream;
  const activeScenario = getScenarioPresetById(activeScenarioId);
  const hasAlert = selectedVerdict.primaryConditionId !== 'NOMINAL_STATE';
  const environmentStatus =
    environment.overallStatus === 'CRITICAL'
      ? 'Attention'
      : environment.overallStatus === 'WARNING'
        ? 'Review'
        : 'In range';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
      <header className="lg:col-span-12">
        <p className="text-sm font-semibold text-accent-cyan">OVERVIEW</p>
        <h2 className="mt-1 text-2xl font-bold text-cockpit-primary">Crew health at a glance</h2>
        <p className="mt-1 text-sm text-cockpit-muted">
          Review the sample readings, alert, and response steps for this scenario.
        </p>
      </header>

      <div className="lg:col-span-4 flex flex-col gap-3">
        <CrewRoster
          crewMembers={crewMembers}
          selectedCrewId={selectedCrew.id}
          onSelectCrew={onSelectCrew}
          operationalMode={operationalMode}
        />
        <div className="bg-space-hull border border-space-border rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-space-border pb-2">
            <h2 className="text-base font-semibold text-cockpit-primary">
              Spacecraft environment
            </h2>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded border ${
                environment.overallStatus === 'CRITICAL'
                  ? 'bg-status-critical/20 text-status-critical border-status-critical'
                  : environment.overallStatus === 'WARNING'
                    ? 'bg-status-warning/15 text-status-warning border-status-warning/40'
                    : 'bg-status-nominal/15 text-status-nominal border-status-nominal/30'
              }`}
            >
              {environmentStatus}
            </span>
          </div>
          <CabinAtmosphere environment={environment} operationalMode={operationalMode} />
        </div>
      </div>

      <div className="lg:col-span-8 flex flex-col gap-3">
        <section className="bg-space-hull border border-space-border rounded-xl p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-space-border pb-3">
            <div>
              <p className="text-sm text-cockpit-muted">{activeEmergencyCount} of {crewMembers.length} crew members need attention in this demo</p>
              <h2 className="mt-1 text-xl font-bold text-cockpit-primary">{selectedCrew.name}</h2>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${
              hasAlert
                ? 'border-status-warning/40 bg-status-warning/10 text-status-warning'
                : 'border-status-nominal/30 bg-status-nominal/10 text-status-nominal'
            }`}>
              {hasAlert ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {hasAlert ? 'Review this alert' : 'No demo alert'}
            </span>
          </div>

          <div>
            <h3 className="text-base font-semibold text-cockpit-primary">
              {hasAlert ? selectedVerdict.title : 'Readings within the demo baseline'}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-cockpit-muted">
              {hasAlert
                ? activeScenario.subtitle
                : 'Sample crew readings and cabin conditions are within this scenario’s demo ranges.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              { label: 'Heart rate', value: `${latestVitals.heartRateBpm}`, unit: 'beats/min' },
              { label: 'Blood oxygen', value: latestVitals.spO2Pct.toFixed(1), unit: '%' },
              { label: 'Breathing rate', value: `${latestVitals.respirationRateBrPm}`, unit: 'breaths/min' },
              { label: 'Fatigue estimate', value: `${latestVitals.cognitiveFatigue.fatigueIndexPct}`, unit: '%' },
            ].map((reading) => (
              <div key={reading.label} className="rounded-lg border border-space-border bg-space-void p-3">
                <p className="text-sm text-cockpit-muted">{reading.label}</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-cockpit-primary">
                  {reading.value} <span className="text-xs font-medium text-cockpit-muted">{reading.unit}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-accent-cyan/30 bg-accent-cyan/5 p-4">
            <h3 className="text-sm font-semibold text-cockpit-primary">
              {hasAlert ? 'Explore the example response' : 'Try another demo situation'}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-cockpit-muted">
              {hasAlert
                ? 'Review the response checklist for this scenario. These example steps are not medical guidance.'
                : 'Choose a different situation above to see how the prototype presents an alert and response steps.'}
            </p>
            <button
              type="button"
              onClick={onOpenMedicalTab}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-accent-cyan px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-cyan/90"
            >
              Review response steps
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>

      <div className="lg:col-span-12 grid grid-cols-1 2xl:grid-cols-2 gap-3 items-start">
        <CrewCheckInReport
          crew={selectedCrew}
          scenarioId={scenarioId}
          scenarioLabel={activeScenario.shortTitle}
          vitals={latestVitals}
          environment={environment}
          verdict={selectedVerdict}
        />
        <AiFlightSurgeonChat
          crew={selectedCrew}
          vitals={latestVitals}
          environment={environment}
          verdict={selectedVerdict}
          molecular={molecular}
        />
      </div>
    </div>
  );
}

export default App;
