import { Sliders } from 'lucide-react';
import {
  JUDGE_SCENARIO_PRESETS,
  getScenarioPresetById,
  type ScenarioId,
} from '../../services/scenarioPresets';
import type { OperationalMode } from '../../types/crew';

export interface ScenarioBarProps {
  activeScenarioId: ScenarioId;
  onSelectScenario: (scenarioId: ScenarioId) => void;
  operationalMode: OperationalMode;
}

export function ScenarioBar({
  activeScenarioId,
  onSelectScenario,
  operationalMode,
}: ScenarioBarProps) {
  const activeScenario = getScenarioPresetById(activeScenarioId);

  return (
    <div className="flex flex-wrap items-center gap-3" aria-label="Demo scenario selector">
      <label htmlFor="demo-scenario" className="flex items-center gap-2 text-sm font-semibold text-cockpit-primary">
        <Sliders className="h-4 w-4 text-accent-cyan" />
        Choose a demo situation
      </label>
      <select
        id="demo-scenario"
        value={activeScenarioId}
        onChange={(event) => onSelectScenario(event.target.value as ScenarioId)}
        className="min-h-11 min-w-56 rounded-md border border-space-border bg-space-hull px-3 py-2 text-sm font-medium text-cockpit-primary focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/20"
      >
        {JUDGE_SCENARIO_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.shortTitle}
          </option>
        ))}
      </select>
      <p className="text-sm text-cockpit-muted">{activeScenario.subtitle}</p>
      <span className="text-xs font-semibold text-cockpit-muted">
        {operationalMode === 'MARS_TRANSIT' ? 'Spaceflight demo' : 'Remote-care demo'}
      </span>
    </div>
  );
}
