import {
  LayoutDashboard,
  Activity,
  Cpu,
  ClipboardList,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import type { OperationalMode } from '../../types/crew';
import type { ReactNode } from 'react';

type PageId = 'overview' | 'telemetry' | 'environment' | 'medical' | 'crew';

const PAGES: { id: PageId; label: string; icon: ReactNode; hint: string }[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <LayoutDashboard className="h-4 w-4" />,
    hint: 'Crew status, vitals summary & active alerts',
  },
  {
    id: 'telemetry',
    label: 'Health details',
    icon: <Activity className="h-4 w-4" />,
    hint: 'Health readings and trends',
  },
  {
    id: 'environment',
    label: 'Spacecraft',
    icon: <Cpu className="h-4 w-4" />,
    hint: 'Cabin air and radiation readings',
  },
  {
    id: 'medical',
    label: 'Response steps',
    icon: <ClipboardList className="h-4 w-4" />,
    hint: 'Review the prototype response checklist',
  },
  {
    id: 'crew',
    label: 'Crew',
    icon: <UserCheck className="h-4 w-4" />,
    hint: 'Crew roster & individual vitals',
  },
];

interface PageNavProps {
  activePage: PageId;
  onSelectPage: (pageId: PageId) => void;
  operationalMode: OperationalMode;
  activeEmergencyCount: number;
  variant?: 'top' | 'side';
}

export function PageNav({
  activePage,
  onSelectPage,
  operationalMode,
  activeEmergencyCount,
  variant = 'side',
}: PageNavProps) {
  const isMarsMode = operationalMode === 'MARS_TRANSIT';

  if (variant === 'top') {
    return (
      <nav
        className="bg-space-hull border-b border-space-border px-4 py-2 select-none"
        aria-label="Main navigation"
      >
        <div className="max-w-[1600px] mx-auto flex items-center gap-4">
          <div
            className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-colors ${
              activeEmergencyCount > 0
                ? 'bg-status-critical/10 border-status-critical text-status-critical'
                : 'bg-accent-cyan/10 border-accent-cyan/40 text-accent-cyan'
            }`}
          >
            {activeEmergencyCount > 0 ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <LayoutDashboard className="h-3 w-3" />
            )}
          </div>
          <div className="text-sm font-bold tracking-wide text-cockpit-primary">
            {isMarsMode ? 'AURA' : 'AURA • Remote care'}
          </div>

          <div className="flex-1 flex items-center gap-1 px-3 py-1 rounded-lg bg-space-void/60 border border-space-border overflow-x-auto">
            {PAGES.map((page) => {
              const isActive = activePage === page.id;
              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => onSelectPage(page.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/40 shadow-sm'
                      : 'text-cockpit-muted hover:bg-space-elevated hover:text-cockpit-primary'
                  }`}
                  title={page.hint}
                  aria-pressed={isActive}
                >
                  {page.icon}
                  <span>{page.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-space-void/60 border border-space-border">
            <span className="text-[9px] font-mono uppercase tracking-wider text-cockpit-muted">
              {isMarsMode ? 'SPACEFLIGHT' : 'REMOTE CLINIC'}
            </span>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <aside
      className="hidden lg:flex flex-col w-20 border-r border-space-border bg-space-hull text-cockpit-muted select-none"
      aria-label="Main navigation"
    >
      <div className="flex flex-col items-center gap-1 pt-4 pb-6 px-2">
        <div
          className={`h-9 w-9 rounded-lg flex items-center justify-center border transition-colors ${
            activeEmergencyCount > 0
              ? 'bg-status-critical/10 border-status-critical text-status-critical'
              : 'bg-accent-cyan/10 border-accent-cyan/40 text-accent-cyan'
          }`}
        >
          {activeEmergencyCount > 0 ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <LayoutDashboard className="h-4 w-4" />
          )}
        </div>
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider leading-tight text-center">
          {isMarsMode ? 'AURA' : 'CLINIC'}
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-1 py-2">
        {PAGES.map((page) => {
          const isActive = activePage === page.id;
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => onSelectPage(page.id)}
              className={`w-full flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-lg text-xs font-mono transition-all ${
                isActive
                  ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40 shadow-sm'
                  : 'text-cockpit-muted hover:bg-space-elevated/50 hover:text-cockpit-primary hover:border-accent-cyan/20 border-transparent'
              }`}
              title={page.hint}
              aria-pressed={isActive}
            >
              {page.icon}
              <span className="leading-tight">{page.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-2 pb-4">
        <span className="block text-[9px] font-mono uppercase tracking-wider text-cockpit-muted mb-2">
          mode
        </span>
        <button
          type="button"
          className="w-full py-2 rounded-lg border text-xs font-mono flex items-center justify-between gap-2 px-2 transition-colors hover:bg-space-elevated"
        >
          <span>{isMarsMode ? 'SPACEFLIGHT' : 'REMOTE CLINIC'}</span>
        </button>
      </div>
    </aside>
  );
}
