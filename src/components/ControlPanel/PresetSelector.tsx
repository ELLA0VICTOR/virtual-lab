import { gainPresets } from "../../simulation/presets"
import { useSimulationStore } from "../../simulation/simulationStore"
import { Panel } from "../ui/Panel"

export function PresetSelector() {
  const activePresetId = useSimulationStore((state) => state.activePresetId)
  const loadPreset = useSimulationStore((state) => state.loadPreset)

  return (
    <Panel title="Tuning Presets" subtitle="Load known controller personalities, then adjust by hand.">
      <div className="preset-list">
        {gainPresets.map((preset) => (
          <button
            className={`preset-button ${activePresetId === preset.id ? "active" : ""}`.trim()}
            type="button"
            key={preset.id}
            onClick={() => loadPreset(preset.id)}
          >
            <strong>{preset.name}</strong>
            <span>{preset.description}</span>
          </button>
        ))}
      </div>
    </Panel>
  )
}
