import { useSimulationStore } from "../simulation/simulationStore"

export function SetpointMarker() {
  const altitude = useSimulationStore((state) => state.setpoints.altitude)

  return (
    <group position={[0, altitude, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.008, 10, 80]} />
        <meshBasicMaterial color="#6b0472" transparent opacity={0.28} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#6b0472" transparent opacity={0.72} />
      </mesh>
    </group>
  )
}
