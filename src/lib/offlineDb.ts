import Dexie, { type Table } from 'dexie';
import type { CrewHealthStatus, CrewId, OperationalMode } from '../types/crew';

// --- Offline Medical Log & Delayed Earth Burst Queue Records ---

export interface MedicalIncidentLog {
  id?: number;
  timestampIso: string;
  crewId: CrewId;
  crewName: string;
  conditionCode: string;
  conditionTitle: string;
  severity: CrewHealthStatus;
  summary: string;
  heartRateBpm: number;
  spO2Pct: number;
  cabinCo2Pct: number;
  radiationRateMsvHr: number;
  acknowledgedByCrew: boolean;
}

export interface EarthBurstPacket {
  id?: number;
  queuedAtIso: string;
  crewId: CrewId;
  crewName: string;
  operationalMode: OperationalMode;
  estimatedOneWayDelaySec: number;
  conditionCode: string;
  telemetrySnapshotJson: string;
  transmissionStatus: 'QUEUED_FOR_WINDOW' | 'TRANSMITTING' | 'ACKNOWLEDGED_MCC';
}

export interface CrewCheckInReport {
  id?: number;
  createdAtIso: string;
  crewId: CrewId;
  crewName: string;
  scenarioId: string;
  scenarioLabel: string;
  concernLevel: 'LOW' | 'MODERATE' | 'HIGH';
  reportedDuration: string;
  description: string;
  readings: {
    heartRateBpm: number;
    spO2Pct: number;
    respirationRateBrPm: number;
    cabinCo2Pct: number;
    personalRadiationRateMsvHr: number;
  };
  prototypeAlert: string;
}

// --- Dexie.js Browser-Native IndexedDB Instance ---
// Stores clinical events and store-and-forward telemetry bundles locally so zero data
// is lost during 44-minute Mars round-trip radio delays or 14-day solar conjunction blackouts.

class AuraOfflineDatabase extends Dexie {
  incidentLogs!: Table<MedicalIncidentLog, number>;
  earthBurstQueue!: Table<EarthBurstPacket, number>;
  crewCheckInReports!: Table<CrewCheckInReport, number>;

  constructor() {
    super('AuraFlightSurgeonDB');
    this.version(1).stores({
      incidentLogs: '++id, timestampIso, crewId, conditionCode, severity',
      earthBurstQueue: '++id, queuedAtIso, crewId, conditionCode, transmissionStatus',
    });
    this.version(2).stores({
      incidentLogs: '++id, timestampIso, crewId, conditionCode, severity',
      earthBurstQueue: '++id, queuedAtIso, crewId, conditionCode, transmissionStatus',
      crewCheckInReports: '++id, createdAtIso, crewId, scenarioId',
    });
  }
}

export const offlineDb = new AuraOfflineDatabase();

// In-memory deduplication map prevents 1Hz telemetry ticks from writing duplicate
// rows to IndexedDB every second while the same acute condition remains active.
const lastIncidentWriteByKey = new Map<string, number>();
const INCIDENT_DEDUP_WINDOW_MS = 30_000;

export async function logMedicalIncidentIdempotent(
  entry: Omit<MedicalIncidentLog, 'id' | 'timestampIso'>
): Promise<number | null> {
  const dedupKey = `${entry.crewId}:${entry.conditionCode}:${entry.severity}`;
  const now = Date.now();
  const lastLogged = lastIncidentWriteByKey.get(dedupKey);

  if (lastLogged !== undefined && now - lastLogged < INCIDENT_DEDUP_WINDOW_MS) {
    return null;
  }

  lastIncidentWriteByKey.set(dedupKey, now);

  try {
    const id = await offlineDb.incidentLogs.add({
      ...entry,
      timestampIso: new Date(now).toISOString(),
    });
    return id;
  } catch {
    // Gracefully degrade in restricted private-browsing contexts where IndexedDB may reject writes
    return null;
  }
}

export async function queueTelemetryBurstForEarth(
  packet: Omit<EarthBurstPacket, 'id' | 'queuedAtIso' | 'transmissionStatus'>
): Promise<number | null> {
  try {
    const id = await offlineDb.earthBurstQueue.add({
      ...packet,
      queuedAtIso: new Date().toISOString(),
      transmissionStatus: 'QUEUED_FOR_WINDOW',
    });
    return id;
  } catch {
    return null;
  }
}

export async function getRecentIncidentLogs(limit = 15): Promise<MedicalIncidentLog[]> {
  try {
    return await offlineDb.incidentLogs.orderBy('id').reverse().limit(limit).toArray();
  } catch {
    return [];
  }
}

export async function getQueuedEarthBursts(limit = 20): Promise<EarthBurstPacket[]> {
  try {
    return await offlineDb.earthBurstQueue.orderBy('id').reverse().limit(limit).toArray();
  } catch {
    return [];
  }
}

export async function saveCrewCheckInReport(
  report: Omit<CrewCheckInReport, 'id' | 'createdAtIso'>
): Promise<CrewCheckInReport> {
  const savedReport = {
    ...report,
    createdAtIso: new Date().toISOString(),
  };
  const id = await offlineDb.crewCheckInReports.add(savedReport);
  return { ...savedReport, id };
}

export async function getCrewCheckInReports(
  crewId: CrewId,
  limit = 5
): Promise<CrewCheckInReport[]> {
  return offlineDb.crewCheckInReports
    .where('crewId')
    .equals(crewId)
    .reverse()
    .limit(limit)
    .toArray();
}

export async function deleteCrewCheckInReport(id: number): Promise<void> {
  await offlineDb.crewCheckInReports.delete(id);
}

export async function clearTransmittedEarthBursts(): Promise<void> {
  try {
    await offlineDb.earthBurstQueue.clear();
  } catch {
    // Ignore storage errors in restricted environments
  }
}
