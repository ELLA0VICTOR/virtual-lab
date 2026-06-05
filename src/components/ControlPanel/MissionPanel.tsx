import { FiBox, FiDownload, FiMapPin, FiRefreshCw } from "react-icons/fi"
import { useSimulationStore } from "../../simulation/simulationStore"
import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { Panel } from "../ui/Panel"

const statusLabel = {
  ready: "Pickup",
  carrying: "Deliver",
  delivered: "Complete",
  dropped: "Missed",
}

export function MissionPanel() {
  const mission = useSimulationStore((state) => state.mission)
  const quadrotor = useSimulationStore((state) => state.quadrotor)
  const pickupPackage = useSimulationStore((state) => state.pickupPackage)
  const dropPackage = useSimulationStore((state) => state.dropPackage)
  const resetMission = useSimulationStore((state) => state.resetMission)
  const packageDistance = Math.hypot(quadrotor.position[0] - mission.packagePosition[0], quadrotor.position[1] - mission.packagePosition[1])
  const dropDistance = Math.hypot(
    quadrotor.position[0] - mission.dropZonePosition[0],
    quadrotor.position[1] - mission.dropZonePosition[1],
  )
  const canPickup = mission.status === "ready" && mission.pickupAvailable
  const canDrop = mission.status === "carrying" && mission.dropAvailable

  return (
    <Panel
      data-guide="mission"
      title="Payload Mission"
      action={<Badge tone={mission.status === "delivered" ? "live" : "warn"}>{statusLabel[mission.status]}</Badge>}
    >
      <div className="mission-map">
        <div>
          <span>Package</span>
          <strong>{packageDistance.toFixed(1)} m</strong>
        </div>
        <div>
          <span>Drop Zone</span>
          <strong>{dropDistance.toFixed(1)} m</strong>
        </div>
        <div>
          <span>Cargo</span>
          <strong>{mission.status === "carrying" ? mission.packageMass.toFixed(2) : "0.00"} kg</strong>
        </div>
      </div>

      <div className="toolbar-row" style={{ marginTop: 12 }}>
        <Button icon={FiBox} variant={canPickup ? "primary" : "default"} disabled={!canPickup} onClick={pickupPackage}>
          Pick Up
        </Button>
        <Button icon={FiDownload} variant={canDrop ? "primary" : "default"} disabled={!canDrop} onClick={dropPackage}>
          Drop
        </Button>
        <Button icon={FiRefreshCw} onClick={resetMission}>
          Reset
        </Button>
      </div>

      <div className="hint-box mission-hint">
        <FiMapPin aria-hidden="true" /> {mission.message}
        {mission.lastDropError !== null ? ` Drop error: ${mission.lastDropError.toFixed(2)} m.` : ""}
      </div>
    </Panel>
  )
}
