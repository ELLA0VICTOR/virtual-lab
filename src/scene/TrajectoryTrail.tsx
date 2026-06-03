import { useMemo } from "react"
import * as THREE from "three"
import { useSimulationStore } from "../simulation/simulationStore"

export function TrajectoryTrail() {
  const history = useSimulationStore((state) => state.history)
  const line = useMemo(() => {
    const points = history.slice(-220).map((sample) => new THREE.Vector3(sample.x, sample.altitude, sample.y))
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ color: "#6b0472", transparent: true, opacity: 0.44 })
    return new THREE.Line(geometry, material)
  }, [history])

  return <primitive object={line} />
}
