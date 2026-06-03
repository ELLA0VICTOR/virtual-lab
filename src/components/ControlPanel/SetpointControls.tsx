import { degreesToRadians, formatRadiansAsDegrees } from "../../physics/vector"
import { useSimulationStore } from "../../simulation/simulationStore"
import { Panel } from "../ui/Panel"

const clampNumber = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

export function SetpointControls() {
  const setpoints = useSimulationStore((state) => state.setpoints)
  const setSetpoint = useSimulationStore((state) => state.setSetpoint)

  return (
    <Panel title="Setpoints" subtitle="Command altitude and attitude references for the PID loops.">
      <div className="number-grid">
        <label className="field">
          <span>Altitude</span>
          <input
            className="number-input"
            type="number"
            min={0.2}
            max={5}
            step={0.1}
            value={setpoints.altitude.toFixed(1)}
            onChange={(event) => setSetpoint("altitude", clampNumber(Number(event.currentTarget.value), 0.2, 5))}
          />
        </label>
        <label className="field">
          <span>Yaw deg</span>
          <input
            className="number-input"
            type="number"
            min={-180}
            max={180}
            step={5}
            value={formatRadiansAsDegrees(setpoints.yaw).toFixed(0)}
            onChange={(event) =>
              setSetpoint("yaw", degreesToRadians(clampNumber(Number(event.currentTarget.value), -180, 180)))
            }
          />
        </label>
        <label className="field">
          <span>Roll deg</span>
          <input
            className="number-input"
            type="number"
            min={-30}
            max={30}
            step={1}
            value={formatRadiansAsDegrees(setpoints.roll).toFixed(0)}
            onChange={(event) =>
              setSetpoint("roll", degreesToRadians(clampNumber(Number(event.currentTarget.value), -30, 30)))
            }
          />
        </label>
        <label className="field">
          <span>Pitch deg</span>
          <input
            className="number-input"
            type="number"
            min={-30}
            max={30}
            step={1}
            value={formatRadiansAsDegrees(setpoints.pitch).toFixed(0)}
            onChange={(event) =>
              setSetpoint("pitch", degreesToRadians(clampNumber(Number(event.currentTarget.value), -30, 30)))
            }
          />
        </label>
      </div>
    </Panel>
  )
}
