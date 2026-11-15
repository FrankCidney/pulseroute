import {
  UserCheck,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import type { CrewHealthStatus, CrewId, CrewMember, OperationalMode } from '../../types/crew';

export interface CrewRosterProps {
  crewMembers: readonly CrewMember[];
  selectedCrewId: CrewId;
  onSelectCrew: (crewId: CrewId) => void;
  operationalMode: OperationalMode;
}

const STATUS_BADGE_STYLES: Record<
  CrewHealthStatus,
  { label: string; badgeClass: string; borderClass: string; dotClass: string }
> = {
  NOMINAL: {
    label: 'In range',
    badgeClass: 'bg-status-nominal/15 text-status-nominal border-status-nominal/40',
    borderClass: 'border-space-border hover:border-accent-cyan/50',
    dotClass: 'bg-status-nominal',
  },
  WARNING: {
    label: 'Review',
    badgeClass: 'bg-status-warning/15 text-status-warning border-status-warning/40',
    borderClass: 'border-status-warning/60',
    dotClass: 'bg-status-warning',
  },
  CRITICAL: {
    label: 'Alert',
    badgeClass: 'bg-status-critical/20 text-status-critical border-status-critical',
    borderClass: 'border-status-critical',
    dotClass: 'bg-status-critical',
  },
};

export function CrewRoster({
  crewMembers,
  selectedCrewId,
  onSelectCrew,
  operationalMode,
}: CrewRosterProps) {
  const isMarsMode = operationalMode === 'MARS_TRANSIT';

  return (
    <aside
      className="bg-space-hull border border-space-border rounded-xl p-4 flex flex-col gap-3"
      aria-label={isMarsMode ? 'Spacecraft Crew Roster' : 'Field Clinic Patient Roster'}
    >
      <div className="flex items-center justify-between border-b border-space-border pb-2.5">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-accent-cyan" />
          <h2 className="text-base font-semibold text-cockpit-primary">Crew status</h2>
        </div>
        <span className="text-xs text-cockpit-muted">{crewMembers.length} people</span>
      </div>

      <div className="flex flex-col gap-2">
        {crewMembers.map((member) => {
          const isSelected = member.id === selectedCrewId;
          const style = STATUS_BADGE_STYLES[member.status];

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelectCrew(member.id)}
              className={`w-full text-left rounded-lg p-3 border transition-colors flex flex-col gap-1.5 ${
                isSelected
                  ? 'bg-accent-cyan/5 border-accent-cyan ring-1 ring-accent-cyan/30'
                  : `bg-space-void/70 ${style.borderClass}`
              }`}
            >
              {/* Top Row: Name, Callsign & Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-cockpit-primary">
                      {member.name}
                    </span>
                    <span className="text-xs text-cockpit-muted">{member.callsign}</span>
                  </div>
                  <p className="text-xs text-cockpit-muted line-clamp-1">
                    {isMarsMode ? member.spaceRole : member.earthClinicRole}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-semibold ${style.badgeClass}`}
                >
                  <span className={`h-2 w-2 rounded-full ${style.dotClass}`} />
                  {style.label}
                </span>
              </div>

              {/* Active Clinical Alert Banner (when non-nominal) */}
              {member.activeAlertSummary ? (
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold ${
                    member.status === 'CRITICAL'
                      ? 'bg-status-critical/20 text-status-critical border border-status-critical/40'
                      : 'bg-status-warning/15 text-status-warning border border-status-warning/30'
                  }`}
                >
                  {member.status === 'CRITICAL' ? (
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="truncate">{member.activeAlertSummary}</span>
                </div>
              ) : null}

            </button>
          );
        })}
      </div>
    </aside>
  );
}
