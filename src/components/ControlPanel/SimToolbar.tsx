import { FiPause, FiPlay, FiRotateCcw, FiSkipForward } from "react-icons/fi"
import { useSimulationStore } from "../../simulation/simulationStore"
import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { Panel } from "../ui/Panel"

const speeds = [0.25, 0.5, 1, 2, 4]

export function SimToolbar() {
  const running = useSimulationStore((state) => state.running)
  const speed = useSimulationStore((state) => state.speed)
  const elapsed = useSimulationStore((state) => state.elapsed)
  const toggleRunning = useSimulationStore((state) => state.toggleRunning)
  const resetSimulation = useSimulationStore((state) => state.resetSimulation)
  const singleStep = useSimulationStore((state) => state.singleStep)
  const setSpeed = useSimulationStore((state) => state.setSpeed)

  return (
    <Panel
      data-guide="run"
      title="Run Control"
      subtitle="Fixed-step RK4 physics at 500 Hz."
      action={<Badge tone={running ? "live" : "warn"}>{running ? "Running" : "Paused"}</Badge>}
    >
      <div className="toolbar-row">
        <Button icon={running ? FiPause : FiPlay} variant={running ? "default" : "primary"} onClick={toggleRunning}>
          {running ? "Pause" : "Run"}
        </Button>
        <Button icon={FiSkipForward} onClick={singleStep}>
          Step
        </Button>
        <Button icon={FiRotateCcw} variant="danger" onClick={resetSimulation}>
          Reset
        </Button>
      </div>
      <div className="number-grid" style={{ marginTop: 12 }}>
        <label className="field">
          <span>Speed</span>
          <select className="select-input" value={speed} onChange={(event) => setSpeed(Number(event.currentTarget.value))}>
            {speeds.map((item) => (
              <option key={item} value={item}>
                {item.toFixed(item < 1 ? 2 : 0)}x
              </option>
            ))}
          </select>
        </label>
        <div className="field">
          <span>Sim Time</span>
          <div className="number-input readout-number">{elapsed.toFixed(2)} s</div>
        </div>
      </div>
    </Panel>
  )
}
