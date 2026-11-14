import { useState } from 'react';
import { CockpitShell } from './components/layout/CockpitShell';
import { TopHudBar } from './components/layout/TopHudBar';
import { CrewRoster } from './components/crew/CrewRoster';
import { VitalsGrid } from './components/telemetry/VitalsGrid';
import { EclssPanel } from './components/environment/EclssPanel';
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
      <CockpitShell
        topHud={
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
        }
        scenarioBar={
          <ScenarioBar
            activeScenarioId={activeScenarioId}
            onSelectScenario={handleSelectScenario}
            operationalMode={operationalMode}
          />
        }
        crewRoster={
          <CrewRoster
            crewMembers={snapshot.crewRoster}
            selectedCrewId={selectedCrew.id}
            onSelectCrew={setSelectedCrewId}
            operationalMode={operationalMode}
          />
        }
        telemetryHud={
          <VitalsGrid
            selectedCrew={selectedCrew}
            telemetryStream={selectedStream}
            ambientCo2Pct={snapshot.environment.cabinCo2Pct}
            operationalMode={operationalMode}
          />
        }
        eclssPanel={
          <EclssPanel
            environment={snapshot.environment}
            operationalMode={operationalMode}
          />
        }
        flightSurgeonPanel={
          <FlightSurgeonPanel
            verdict={selectedVerdict}
            operationalMode={operationalMode}
            completedStepIds={completedStepIds}
            onToggleChecklistStep={handleToggleChecklistStep}
            onOpenSelfAssessmentWizard={() => setIsWizardOpen(true)}
          />
        }
        molecularPanel={
          <MolecularCountermeasurePanel
            assessment={molecularAssessment}
            radiationRateMsvHr={
              selectedStream.latestVitals.personalRadiationRateMsvHr
            }
            cumulativeDoseMsv={
              selectedStream.latestVitals.cumulativeMissionDoseMsv
            }
          />
        }
        opticalScannerTrigger={
          <OpticalScannerModal
            crewName={selectedCrew.name}
            fluidShift={selectedStream.latestVitals.fluidShift}
            radiationRateMsvHr={
              selectedStream.latestVitals.personalRadiationRateMsvHr
            }
          />
        }
        footerStatusSlot={
          <div className="flex flex-wrap items-center gap-3">
            {lastBurstToast ? (
              <span className="text-accent-cyan">{lastBurstToast}</span>
            ) : null}
            <span className="text-status-nominal">
              OFFLINE DEXIE DB: {recentLogs.length} INCIDENTS • {queuedBursts.length} BURSTS QUEUED
            </span>
          </div>
        }
      />

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

export default App;
