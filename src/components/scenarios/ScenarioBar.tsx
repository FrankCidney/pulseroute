import {
  Sliders,
  CheckCircle2,
  Sun,
  Wind,
  AlertOctagon,
  Eye,
} from 'lucide-react';
import {
  JUDGE_SCENARIO_PRESETS,
  type ScenarioId,
} from '../../services/scenarioPresets';
import type { OperationalMode } from '../../types/crew';

export interface ScenarioBarProps {
  activeScenarioId: ScenarioId;
  onSelectScenario: (scenarioId: ScenarioId) => void;
  operationalMode: OperationalMode;
}

function getScenarioIcon(id: ScenarioId) {
  switch (id) {
    case 'NORMAL_CRUISE':
      return <CheckCircle2 className="h-4 w-4 text-status-nominal" />;
    case 'SOLAR_STORM_SPE':
      return <Sun className="h-4 w-4 text-status-critical" />;
    case 'CABIN_CO2_LEAK':
      return <Wind className="h-4 w-4 text-status-warning" />;
    case 'ACUTE_HYPOXIA':
      return <AlertOctagon className="h-4 w-4 text-status-critical" />;
    case 'SANS_FLUID_SHIFT':
      return <Eye className="h-4 w-4 text-accent-cyan" />;
  }
}

export function ScenarioBar({
  activeScenarioId,
  onSelectScenario,
  operationalMode,
}: ScenarioBarProps) {
  const isMarsMode = operationalMode === 'MARS_TRANSIT';

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-2"
      aria-label="Interactive Judge Scenario Switcher"
    >
      <div className="flex items-center gap-2 text-xs font-mono text-cockpit-muted">
        <Sliders className="h-4 w-4 text-accent-cyan" />
        <span className="font-bold uppercase tracking-wider text-cockpit-primary">
          SIMULATION SCENARIOS:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
        {JUDGE_SCENARIO_PRESETS.map((preset) => {
          const isActive = preset.id === activeScenarioId;
          const label = isMarsMode ? preset.shortTitle : preset.earthClinicTitle;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectScenario(preset.id)}
              title={preset.subtitle}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-lg border text-xs font-mono font-semibold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-accent-cyan/20 border-accent-cyan text-cockpit-primary ring-1 ring-accent-cyan/40'
                  : 'bg-space-void/80 border-space-border text-cockpit-muted hover:text-cockpit-primary hover:border-accent-cyan/40'
              }`}
            >
              {getScenarioIcon(preset.id)}
              <span>
                [{preset.numberLabel}. {label}]
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
