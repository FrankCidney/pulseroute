import { useEffect, useState } from 'react';
import { Download, FileText, Save, Trash2 } from 'lucide-react';
import type { CrewMember } from '../../types/crew';
import type { BiometricVitals } from '../../types/telemetry';
import type { ClinicalDiagnosisVerdict } from '../../types/diagnosis';
import type { EclssEnvironment } from '../../types/environment';
import {
  getCrewCheckInReports,
  deleteCrewCheckInReport,
  saveCrewCheckInReport,
  type CrewCheckInReport as CrewCheckInReportRecord,
} from '../../lib/offlineDb';
import type { ScenarioId } from '../../services/scenarioPresets';

interface CrewCheckInReportProps {
  crew: CrewMember;
  scenarioId: ScenarioId;
  scenarioLabel: string;
  vitals: BiometricVitals;
  environment: EclssEnvironment;
  verdict: ClinicalDiagnosisVerdict;
}

const CONCERN_LABELS = {
  LOW: 'A little concerning',
  MODERATE: 'Moderately concerning',
  HIGH: 'Very concerning',
} as const;
const CONCERN_LEVELS = ['LOW', 'MODERATE', 'HIGH'] as const;

function formatReport(report: CrewCheckInReportRecord): string {
  const timestamp = new Date(report.createdAtIso).toLocaleString();
  const { readings } = report;

  return [
    'AURA CREW CHECK-IN — PROTOTYPE REPORT',
    `Saved: ${timestamp}`,
    `Crew member: ${report.crewName}`,
    `Demo situation: ${report.scenarioLabel}`,
    '',
    'CREW-REPORTED INFORMATION',
    `Concern level (self-reported): ${CONCERN_LABELS[report.concernLevel]}`,
    `Reported duration: ${report.reportedDuration}`,
    `Description: ${report.description}`,
    '',
    'SIMULATED DEMO CONTEXT — NOT DEVICE DATA',
    `Heart rate: ${readings.heartRateBpm} beats/min`,
    `Blood oxygen: ${readings.spO2Pct.toFixed(1)}%`,
    `Breathing rate: ${readings.respirationRateBrPm} breaths/min`,
    `Cabin CO2: ${readings.cabinCo2Pct.toFixed(2)}%`,
    `Personal radiation estimate: ${readings.personalRadiationRateMsvHr.toFixed(2)} mSv/h`,
    `Rule-based demo status: ${report.prototypeAlert}`,
    '',
    'This report is saved only in this browser. It has not been transmitted.',
    'AURA is a prototype. Readings are simulated and this report is not medical advice.',
  ].join('\n');
}

function downloadReport(report: CrewCheckInReportRecord) {
  const safeName = report.crewName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const blob = new Blob([formatReport(report)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `aura-check-in-${safeName}-${report.createdAtIso.slice(0, 10)}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export function CrewCheckInReport({
  crew,
  scenarioId,
  scenarioLabel,
  vitals,
  environment,
  verdict,
}: CrewCheckInReportProps) {
  const [description, setDescription] = useState('');
  const [concernLevel, setConcernLevel] =
    useState<CrewCheckInReportRecord['concernLevel']>('MODERATE');
  const [reportedDuration, setReportedDuration] = useState('Not sure');
  const [reports, setReports] = useState<readonly CrewCheckInReportRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCurrentCrew = true;
    setReports([]);
    setDescription('');
    setConcernLevel('MODERATE');
    setReportedDuration('Not sure');
    setSavedMessage(null);
    setStorageError(null);
    getCrewCheckInReports(crew.id)
      .then((savedReports) => {
        if (isCurrentCrew) setReports(savedReports);
      })
      .catch(() => {
        if (isCurrentCrew) {
          setStorageError('Saved reports could not be loaded from this browser.');
        }
      });

    return () => {
      isCurrentCrew = false;
    };
  }, [crew.id]);

  const currentReport: Omit<CrewCheckInReportRecord, 'id' | 'createdAtIso'> = {
    crewId: crew.id,
    crewName: crew.name,
    scenarioId,
    scenarioLabel,
    concernLevel,
    reportedDuration,
    description: description.trim(),
    readings: {
      heartRateBpm: vitals.heartRateBpm,
      spO2Pct: vitals.spO2Pct,
      respirationRateBrPm: vitals.respirationRateBrPm,
      cabinCo2Pct: environment.cabinCo2Pct,
      personalRadiationRateMsvHr: vitals.personalRadiationRateMsvHr,
    },
    prototypeAlert:
      verdict.primaryConditionId === 'NOMINAL_STATE'
        ? 'No alert from the demo rules'
        : `${verdict.severityGrade.replace('_', ' ')} — ${verdict.title}`,
  };

  const handleSave = async () => {
    if (!currentReport.description || isSaving) return;

    setIsSaving(true);
    setStorageError(null);
    setSavedMessage(null);
    try {
      const savedReport = await saveCrewCheckInReport(currentReport);
      setReports((previous) => [savedReport, ...previous].slice(0, 5));
      setDescription('');
      setSavedMessage('Report saved in this browser only.');
    } catch {
      setStorageError(
        'The report could not be saved in this browser. Your entry is still in the form; try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setStorageError(null);
    setSavedMessage(null);
    try {
      await deleteCrewCheckInReport(id);
      setReports((previous) => previous.filter((report) => report.id !== id));
    } catch {
      setStorageError('The report could not be deleted from this browser.');
    }
  };

  return (
    <section
      className="lg:col-span-12 rounded-xl border border-space-border bg-space-hull p-4"
      aria-labelledby="crew-check-in-title"
    >
      <div className="flex items-start gap-3 border-b border-space-border pb-3">
        <FileText className="mt-1 h-5 w-5 shrink-0 text-accent-cyan" />
        <div>
          <h2 id="crew-check-in-title" className="text-lg font-bold text-cockpit-primary">
            Crew check-in and report
          </h2>
          <p className="mt-1 text-sm text-cockpit-muted">
            Record what the crew member reports, then review it beside this demo’s sample readings.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-cockpit-primary" htmlFor="check-in-description">
            What are you experiencing?
          </label>
          <textarea
            id="check-in-description"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setSavedMessage(null);
            }}
            maxLength={1000}
            rows={4}
            required
            placeholder="Describe what you notice in your own words. Do not include real personal medical information in this demo."
            className="w-full rounded-md border border-space-border bg-space-void px-3 py-2 text-sm text-cockpit-primary placeholder:text-cockpit-muted focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/20"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-cockpit-primary" htmlFor="check-in-concern">
              How concerning does it feel to you?
              <select
                id="check-in-concern"
                value={concernLevel}
                onChange={(event) => {
                  const value = CONCERN_LEVELS.find(
                    (level) => level === event.target.value
                  );
                  if (value) setConcernLevel(value);
                }}
                className="mt-1 block min-h-11 w-full rounded-md border border-space-border bg-space-void px-3 py-2 font-normal"
              >
                {Object.entries(CONCERN_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-cockpit-primary" htmlFor="check-in-duration">
              When did it begin?
              <select
                id="check-in-duration"
                value={reportedDuration}
                onChange={(event) => setReportedDuration(event.target.value)}
                className="mt-1 block min-h-11 w-full rounded-md border border-space-border bg-space-void px-3 py-2 font-normal"
              >
                {['Just now', 'Less than 1 hour ago', '1–4 hours ago', 'More than 4 hours ago', 'Not sure'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-lg border border-space-border bg-space-void p-3">
            <h3 className="text-sm font-semibold text-cockpit-primary">Report preview</h3>
            {description.trim() ? (
              <div className="mt-2 space-y-2 text-sm text-cockpit-muted">
                <p><strong className="text-cockpit-primary">Crew report:</strong> “{description.trim()}”</p>
                <p>
                  <strong className="text-cockpit-primary">Self-rated concern:</strong>{' '}
                  {CONCERN_LABELS[concernLevel]} · {reportedDuration}
                </p>
                <p>
                  <strong className="text-cockpit-primary">Demo context:</strong>{' '}
                  {scenarioLabel}; HR {vitals.heartRateBpm} beats/min, blood oxygen {vitals.spO2Pct.toFixed(1)}%,
                  breathing {vitals.respirationRateBrPm} breaths/min, cabin CO2 {environment.cabinCo2Pct.toFixed(2)}%.
                </p>
                <p>
                  <strong className="text-cockpit-primary">Other sample estimates:</strong>{' '}
                  personal radiation {vitals.personalRadiationRateMsvHr.toFixed(2)} mSv/h.
                </p>
                <p>
                  <strong className="text-cockpit-primary">Rule-based demo status:</strong>{' '}
                  {currentReport.prototypeAlert}
                </p>
              </div>
            ) : (
              <p className="mt-1 text-sm text-cockpit-muted">
                Enter a description to preview the report before saving.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!description.trim() || isSaving}
              onClick={() => void handleSave()}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent-cyan px-4 py-2 text-sm font-semibold text-white hover:bg-accent-cyan/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving…' : 'Save report on this device'}
            </button>
            {savedMessage && <p role="status" className="text-sm text-status-nominal">{savedMessage}</p>}
            {storageError && <p role="alert" className="text-sm text-status-critical">{storageError}</p>}
          </div>
          <p className="text-xs text-cockpit-muted">
            The crew description is self-reported. All displayed readings are simulated, and saving does not send anything to Mission Control.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-cockpit-primary">
            Recent reports for {crew.name}
          </h3>
          {reports.length === 0 ? (
            <p className="mt-2 text-sm text-cockpit-muted">No saved reports for this crew member yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {reports.map((report) => (
                <li key={report.id ?? report.createdAtIso} className="rounded-lg border border-space-border bg-space-void p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-cockpit-primary">
                        {CONCERN_LABELS[report.concernLevel]} · {report.scenarioLabel}
                      </p>
                      <p className="mt-1 text-sm text-cockpit-muted">{report.description}</p>
                      <p className="mt-1 text-xs text-cockpit-muted">
                        {new Date(report.createdAtIso).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadReport(report)}
                      className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-md border border-space-border px-3 py-2 text-xs font-semibold text-cockpit-primary hover:border-accent-cyan"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                    {report.id !== undefined && (
                      <button
                        type="button"
                        onClick={() => report.id !== undefined && void handleDelete(report.id)}
                        className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-md border border-space-border px-3 py-2 text-xs font-semibold text-cockpit-muted hover:border-status-critical hover:text-status-critical"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
