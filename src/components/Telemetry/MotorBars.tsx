import { useSimulationStore } from "../../simulation/simulationStore"
import { Panel } from "../ui/Panel"

const labels = ["M1 F", "M2 R", "M3 B", "M4 L"]

export function MotorBars() {
  const motorOutput = useSimulationStore((state) => state.motorOutput)

  return (
    <Panel title="Motor Authority" subtitle="Saturation is visible when a rotor hits its physical limit.">
      <div className="motor-grid">
        {labels.map((label, index) => {
          const percent = Math.round(motorOutput.normalized[index] * 100)
          const saturated = motorOutput.saturated[index]

          return (
            <div className="motor-bar" key={label}>
              <div className="motor-track">
                <div
                  className={`motor-fill ${saturated ? "saturated" : ""}`.trim()}
                  style={{ height: `${Math.min(100, percent)}%` }}
                />
              </div>
              <div className="motor-label">
                <span>{label}</span>
                <span className="motor-value">{percent}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
