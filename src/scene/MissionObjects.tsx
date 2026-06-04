import { useMemo } from "react"
import * as THREE from "three"
import { useSimulationStore } from "../simulation/simulationStore"
import type { Vec3 } from "../physics/types"

const toScenePosition = ([x, y, z]: Vec3): [number, number, number] => [x, z, y]

export function MissionObjects() {
  const mission = useSimulationStore((state) => state.mission)
  const quadrotor = useSimulationStore((state) => state.quadrotor)
  const packageMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#d97706", roughness: 0.62, metalness: 0.05 }),
    [],
  )
  const strapMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#78350f", roughness: 0.5, metalness: 0.12 }),
    [],
  )

  const packagePosition =
    mission.status === "carrying"
      ? ([quadrotor.position[0], quadrotor.position[1], Math.max(0.13, quadrotor.position[2] - 0.24)] as Vec3)
      : mission.packagePosition

  return (
    <>
      <group position={toScenePosition(mission.dropZonePosition)}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <torusGeometry args={[0.82, 0.025, 12, 96]} />
          <meshBasicMaterial color="#0284c7" transparent opacity={0.7} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
          <circleGeometry args={[0.78, 64]} />
          <meshBasicMaterial color="#e0f2fe" transparent opacity={0.62} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <torusGeometry args={[0.28, 0.012, 8, 48]} />
          <meshBasicMaterial color="#0284c7" transparent opacity={0.8} />
        </mesh>
      </group>

      {mission.status === "ready" ? (
        <group position={toScenePosition(mission.packagePosition)}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
            <torusGeometry args={[0.58, 0.018, 10, 80]} />
            <meshBasicMaterial color="#d97706" transparent opacity={0.55} />
          </mesh>
        </group>
      ) : null}

      {mission.status === "carrying" ? (
        <mesh position={[packagePosition[0], packagePosition[2] + 0.28, packagePosition[1]]}>
          <cylinderGeometry args={[0.01, 0.01, 0.42, 10]} />
          <meshBasicMaterial color="#475569" transparent opacity={0.65} />
        </mesh>
      ) : null}

      {mission.status !== "delivered" || mission.packagePosition[2] > 0 ? (
        <group position={toScenePosition(packagePosition)}>
          <mesh castShadow receiveShadow material={packageMaterial}>
            <boxGeometry args={[0.34, 0.22, 0.34]} />
          </mesh>
          <mesh castShadow material={strapMaterial} position={[0, 0.005, 0]}>
            <boxGeometry args={[0.365, 0.025, 0.055]} />
          </mesh>
          <mesh castShadow material={strapMaterial} position={[0, 0.006, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[0.365, 0.025, 0.055]} />
          </mesh>
        </group>
      ) : null}
    </>
  )
}
