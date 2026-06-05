import { Panel } from "../ui/Panel"
import { Slider } from "../ui/Slider"
import { useSimulationStore } from "../../simulation/simulationStore"
import type { GainSet } from "../../physics/types"

const axes: Array<{ id: keyof GainSet; label: string; unit: string; max: number }> = [
  { id: "altitude", label: "Altitude", unit: "m", max: 15 },
  { id: "roll", label: "Roll", unit: "rad", max: 18 },
  { id: "pitch", label: "Pitch", unit: "rad", max: 18 },
  { id: "yaw", label: "Yaw", unit: "rad", max: 8 },
]

export function GainSliders() {
  const gains = useSimulationStore((state) => state.gains)
  const setGain = useSimulationStore((state) => state.setGain)

  return (
    <Panel data-guide="tune" title="PID Gain Matrix" subtitle="Tune Kp, Ki, Kd and watch saturation, response, and stability change.">
      <div className="gain-grid">
        {axes.map((axis) => (
          <div className="axis-card" key={axis.id}>
            <div className="axis-header">
              <span className="axis-name">{axis.label}</span>
              <span className="axis-unit">{axis.unit}</span>
            </div>
            <div className="slider-stack">
              <Slider
                label="Kp"
                value={gains[axis.id].kp}
                min={0}
                max={axis.max}
                step={0.1}
                onChange={(value) => setGain(axis.id, "kp", value)}
              />
              <Slider
                label="Ki"
                value={gains[axis.id].ki}
                min={0}
                max={axis.id === "altitude" ? 6 : 2.5}
                step={0.05}
                onChange={(value) => setGain(axis.id, "ki", value)}
              />
              <Slider
                label="Kd"
                value={gains[axis.id].kd}
                min={0}
                max={axis.id === "altitude" ? 7 : 4}
                step={0.05}
                onChange={(value) => setGain(axis.id, "kd", value)}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
