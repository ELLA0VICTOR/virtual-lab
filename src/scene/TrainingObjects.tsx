import { useMemo } from "react"
import * as THREE from "three"
import { GROUND_ALTITUDE } from "../physics/constants"
import type { Vec3 } from "../physics/types"
import { useSimulationStore, type TrainingScenarioAccent } from "../simulation/simulationStore"

const toScenePosition = ([x, y, z]: Vec3): [number, number, number] => [x, z, y]

const palette: Record<TrainingScenarioAccent, { main: string; fill: string; beam: string }> = {
  blue: { main: "#0284c7", fill: "#e0f2fe", beam: "#38bdf8" },
  purple: { main: "#6b0472", fill: "#f3e8ff", beam: "#c084fc" },
  amber: { main: "#d97706", fill: "#fef3c7", beam: "#f59e0b" },
  green: { main: "#16a34a", fill: "#dcfce7", beam: "#4ade80" },
  red: { main: "#dc2626", fill: "#fee2e2", beam: "#f87171" },
}

export function TrainingObjects() {
  const scenario = useSimulationStore((state) => state.trainingScenario)
  const colors = palette[scenario.accent]
  const materials = useMemo(
    () => ({
      ring: new THREE.MeshBasicMaterial({ color: colors.main, transparent: true, opacity: 0.76 }),
      fill: new THREE.MeshBasicMaterial({ color: colors.fill, transparent: true, opacity: 0.56 }),
      beam: new THREE.MeshBasicMaterial({ color: colors.beam, transparent: true, opacity: 0.32 }),
      cap: new THREE.MeshBasicMaterial({ color: colors.main, transparent: true, opacity: 0.9 }),
    }),
    [colors],
  )

  if (scenario.kind === "none" || !scenario.targetPosition) return null

  const [x, altitude, z] = toScenePosition(scenario.targetPosition)
  const groundY = 0.018
  const radius = scenario.radius
  const targetAltitude = Math.max(altitude, GROUND_ALTITUDE)
  const yaw = scenario.targetYaw
  const band = scenario.altitudeBand

  return (
    <group>
      <group position={[x, groundY, z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} material={materials.fill}>
          <circleGeometry args={[radius, 80]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.ring} position={[0, 0.012, 0]}>
          <torusGeometry args={[radius, 0.022, 12, 96]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.ring} position={[0, 0.024, 0]}>
          <torusGeometry args={[Math.max(0.2, radius * 0.36), 0.01, 8, 54]} />
        </mesh>
      </group>

      {targetAltitude > GROUND_ALTITUDE + 0.12 ? (
        <>
          <mesh position={[x, targetAltitude / 2, z]} material={materials.beam}>
            <cylinderGeometry args={[0.012, 0.012, targetAltitude, 10]} />
          </mesh>
          <group position={[x, targetAltitude, z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.ring}>
              <torusGeometry args={[radius * 0.62, 0.012, 10, 80]} />
            </mesh>
            <mesh material={materials.cap}>
              <sphereGeometry args={[0.045, 16, 16]} />
            </mesh>
          </group>
        </>
      ) : null}

      {band ? (
        <>
          <group position={[x, band[0], z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.beam}>
              <torusGeometry args={[radius * 0.86, 0.007, 8, 72]} />
            </mesh>
          </group>
          <group position={[x, band[1], z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.beam}>
              <torusGeometry args={[radius * 0.86, 0.007, 8, 72]} />
            </mesh>
          </group>
        </>
      ) : null}

      {yaw !== null ? (
        <group position={[x, Math.max(targetAltitude, 0.32), z]} rotation={[0, Math.PI / 2 - yaw, 0]}>
          <mesh position={[0, 0, radius * 0.46]} rotation={[Math.PI / 2, 0, 0]} material={materials.cap}>
            <cylinderGeometry args={[0.022, 0.022, radius * 0.88, 12]} />
          </mesh>
          <mesh position={[0, 0, radius * 0.93]} rotation={[Math.PI / 2, 0, 0]} material={materials.cap}>
            <coneGeometry args={[0.08, 0.18, 18]} />
          </mesh>
        </group>
      ) : null}
    </group>
  )
}
