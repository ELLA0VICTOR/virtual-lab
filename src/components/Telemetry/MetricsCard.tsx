import { formatRadiansAsDegrees } from "../../physics/vector"
import { useSimulationStore } from "../../simulation/simulationStore"
import { Panel } from "../ui/Panel"

const seconds = (value: number | null): string => (value === null ? "..." : `${value.toFixed(2)} s`)

export function MetricsCard() {
  const altitude = useSimulationStore((state) => state.metrics.altitude)
  const roll = useSimulationStore((state) => state.metrics.roll)
  const pitch = useSimulationStore((state) => state.metrics.pitch)
  const yaw = useSimulationStore((state) => state.metrics.yaw)

  return (
    <Panel title="Response Metrics" subtitle="Computed from the active step window.">
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Rise Time</span>
          <span className="metric-value">{seconds(altitude.riseTime)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Settling Time</span>
          <span className={`metric-value ${altitude.settlingTime !== null && altitude.settlingTime < 2 ? "good" : ""}`.trim()}>
            {seconds(altitude.settlingTime)}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Overshoot</span>
          <span className={`metric-value ${altitude.overshoot > 10 ? "warn" : "good"}`.trim()}>
            {altitude.overshoot.toFixed(1)}%
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Altitude SSE</span>
          <span className="metric-value">{Math.abs(altitude.steadyStateError).toFixed(2)} m</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Attitude SSE</span>
          <span className="metric-value">
            {formatRadiansAsDegrees(Math.abs(roll.steadyStateError) + Math.abs(pitch.steadyStateError)).toFixed(1)} deg
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Yaw SSE</span>
          <span className="metric-value">{formatRadiansAsDegrees(Math.abs(yaw.steadyStateError)).toFixed(1)} deg</span>
        </div>
      </div>
    </Panel>
  )
}
