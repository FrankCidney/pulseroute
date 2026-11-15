import { useState, useEffect, useCallback } from 'react';
import type { CrewId, OperationalMode } from '../types/crew';
import {
  createSimulationTickSnapshot,
  type SimulationTickSnapshot,
} from '../services/telemetrySimulator';
import {
  getScenarioPresetById,
  type ScenarioId,
} from '../services/scenarioPresets';
import {
  clearTransmittedEarthBursts,
  getQueuedEarthBursts,
  getRecentIncidentLogs,
  logMedicalIncidentIdempotent,
  queueTelemetryBurstForEarth,
  type EarthBurstPacket,
  type MedicalIncidentLog,
} from '../lib/offlineDb';

// Base Mission Elapsed Time: 142 days, 14 hours, 28 minutes into Artemis-VI Mars Transit
const INITIAL_MET_SECONDS = 142 * 86400 + 14 * 3600 + 28 * 60;
const BASE_EARTH_DISTANCE_MILES = 142.8;
const BASE_ONE_WAY_COMMS_DELAY_SEC = 18 * 60 + 42; // 18m 42s one-way (~37m 24s RTT)

export function useAuraCockpit() {
  const [operationalMode, setOperationalMode] =
    useState<OperationalMode>('MARS_TRANSIT');
  const [activeScenarioId, setActiveScenarioId] =
    useState<ScenarioId>('NORMAL_CRUISE');
  const [selectedCrewId, setSelectedCrewId] = useState<CrewId>('chen');

  const [snapshot, setSnapshot] = useState<SimulationTickSnapshot>(() =>
    createSimulationTickSnapshot({
      tickCount: 0,
      scenarioId: 'NORMAL_CRUISE',
    })
  );

  const [completedStepIds, setCompletedStepIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [recentLogs, setRecentLogs] = useState<readonly MedicalIncidentLog[]>([]);
  const [queuedBursts, setQueuedBursts] = useState<readonly EarthBurstPacket[]>([]);
  const [lastBurstToast, setLastBurstToast] = useState<string | null>(null);

  const refreshOfflineTables = useCallback(async () => {
    const [logs, bursts] = await Promise.all([
      getRecentIncidentLogs(15),
      getQueuedEarthBursts(20),
    ]);
    setRecentLogs(logs);
    setQueuedBursts(bursts);
  }, []);

  // Load persisted IndexedDB incident logs and burst packets on mount
  useEffect(() => {
    void refreshOfflineTables();
  }, [refreshOfflineTables]);

  // 1Hz Telemetry Simulation Ticker with clean unmount disposal
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSnapshot((prev) =>
        createSimulationTickSnapshot({
          tickCount: prev.tickCount + 1,
          scenarioId: activeScenarioId,
          previousStreams: prev.streamsByCrewId,
        })
      );
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeScenarioId]);

  // Automatically log non-nominal clinical diagnoses idempotently to IndexedDB
  useEffect(() => {
    const activeVerdict = snapshot.verdictsByCrewId[selectedCrewId];
    const activeStream = snapshot.streamsByCrewId[selectedCrewId];
    const activeCrew = snapshot.crewRoster.find((c) => c.id === selectedCrewId);

    if (
      activeVerdict &&
      activeStream &&
      activeCrew &&
      activeVerdict.primaryConditionId !== 'NOMINAL_STATE'
    ) {
      void logMedicalIncidentIdempotent({
        crewId: selectedCrewId,
        crewName: activeCrew.name,
        conditionCode: activeVerdict.iclCode,
        conditionTitle: activeVerdict.title,
        severity: activeVerdict.crewStatus,
        summary: activeVerdict.primaryCauseText,
        heartRateBpm: activeStream.latestVitals.heartRateBpm,
        spO2Pct: activeStream.latestVitals.spO2Pct,
        cabinCo2Pct: snapshot.environment.cabinCo2Pct,
        radiationRateMsvHr: activeStream.latestVitals.personalRadiationRateMsvHr,
        acknowledgedByCrew: completedStepIds.size > 0,
      }).then((insertedId) => {
        if (insertedId !== null) {
          void refreshOfflineTables();
        }
      });
    }
  }, [
    snapshot,
    selectedCrewId,
    completedStepIds.size,
    refreshOfflineTables,
  ]);

  // Switch scenario immediately and focus the primary affected crew member
  const handleSelectScenario = useCallback((nextScenarioId: ScenarioId) => {
    const preset = getScenarioPresetById(nextScenarioId);
    setActiveScenarioId(nextScenarioId);
    setSelectedCrewId(preset.primaryAffectedCrewId);
    setCompletedStepIds(new Set());

    setSnapshot((prev) =>
      createSimulationTickSnapshot({
        tickCount: prev.tickCount + 1,
        scenarioId: nextScenarioId,
        previousStreams: prev.streamsByCrewId,
      })
    );
  }, []);

  const handleToggleChecklistStep = useCallback((stepId: string) => {
    setCompletedStepIds((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }, []);

  const handleQueueBurstTransmission = useCallback(async () => {
    const crew =
      snapshot.crewRoster.find((c) => c.id === selectedCrewId) ??
      snapshot.crewRoster[0];
    const stream = snapshot.streamsByCrewId[selectedCrewId];
    const verdict = snapshot.verdictsByCrewId[selectedCrewId];

    await queueTelemetryBurstForEarth({
      crewId: crew.id,
      crewName: crew.name,
      operationalMode,
      estimatedOneWayDelaySec: BASE_ONE_WAY_COMMS_DELAY_SEC,
      conditionCode: verdict.iclCode,
      telemetrySnapshotJson: JSON.stringify({
        vitals: stream.latestVitals,
        environment: snapshot.environment,
        verdict: {
          conditionId: verdict.primaryConditionId,
          severity: verdict.severityGrade,
          completedSteps: Array.from(completedStepIds),
        },
      }),
    });

    await refreshOfflineTables();
    setLastBurstToast(
      `Saved ${crew.callsign}'s demo snapshot locally`
    );
  }, [
    snapshot,
    selectedCrewId,
    operationalMode,
    completedStepIds,
    refreshOfflineTables,
  ]);

  const handleClearBursts = useCallback(async () => {
    await clearTransmittedEarthBursts();
    await refreshOfflineTables();
  }, [refreshOfflineTables]);

  return {
    operationalMode,
    setOperationalMode,
    activeScenarioId,
    handleSelectScenario,
    selectedCrewId,
    setSelectedCrewId,
    snapshot,
    missionElapsedSeconds: INITIAL_MET_SECONDS + snapshot.tickCount,
    earthDistanceMillionMiles: BASE_EARTH_DISTANCE_MILES,
    oneWayCommsDelaySeconds: BASE_ONE_WAY_COMMS_DELAY_SEC,
    completedStepIds,
    handleToggleChecklistStep,
    recentLogs,
    queuedBursts,
    handleQueueBurstTransmission,
    handleClearBursts,
    lastBurstToast,
  };
}
