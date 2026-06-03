import { FiAlertTriangle, FiBox, FiRefreshCw, FiWind } from "react-icons/fi"
import { useSimulationStore } from "../../simulation/simulationStore"
import { Button } from "../ui/Button"
import { Panel } from "../ui/Panel"

export function DisturbancePanel() {
  const payloadEnabled = useSimulationStore((state) => state.payloadEnabled)
  const motorFaultIndex = useSimulationStore((state) => state.motorFaultIndex)
  const disturbances = useSimulationStore((state) => state.disturbances)
  const injectWind = useSimulationStore((state) => state.injectWind)
  const togglePayload = useSimulationStore((state) => state.togglePayload)
  const setMotorFault = useSimulationStore((state) => state.setMotorFault)
  const resetDisturbances = useSimulationStore((state) => state.resetDisturbances)

  return (
    <Panel title="Disturbances" subtitle="Force the controller to prove itself under real flight faults.">
      <div className="toolbar-row">
        <Button icon={FiWind} onClick={injectWind}>
          Wind Gust
        </Button>
        <Button icon={FiBox} className={payloadEnabled ? "button-primary" : ""} onClick={togglePayload}>
          Payload
        </Button>
        <Button icon={FiRefreshCw} onClick={resetDisturbances}>
          Clear
        </Button>
      </div>
      <div className="number-grid" style={{ marginTop: 12 }}>
        <label className="field">
          <span>Motor Fault</span>
          <select
            className="select-input"
            value={motorFaultIndex ?? "none"}
            onChange={(event) => {
              const value = event.currentTarget.value
              setMotorFault(value === "none" ? null : Number(value))
            }}
          >
            <option value="none">None</option>
            <option value={0}>M1 front</option>
            <option value={1}>M2 right</option>
            <option value={2}>M3 rear</option>
            <option value={3}>M4 left</option>
          </select>
        </label>
        <div className="field">
          <span>Payload</span>
          <div className="number-input readout-number">{disturbances.payloadMass.toFixed(2)} kg</div>
        </div>
      </div>
      {motorFaultIndex !== null ? (
        <div className="hint-box">
          <FiAlertTriangle aria-hidden="true" /> Motor {motorFaultIndex + 1} is degraded to 58% authority.
        </div>
      ) : null}
    </Panel>
  )
}
