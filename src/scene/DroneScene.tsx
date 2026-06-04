import { Suspense, useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { formatRadiansAsDegrees } from "../physics/vector"
import { useSimulationStore } from "../simulation/simulationStore"
import { Button } from "../components/ui/Button"
import { Environment } from "./Environment"
import { MissionObjects } from "./MissionObjects"
import { Quadrotor } from "./Quadrotor"
import { SetpointMarker } from "./SetpointMarker"
import { TrajectoryTrail } from "./TrajectoryTrail"

type CameraMode = "follow" | "top" | "side" | "free"

function CameraController({ mode }: { mode: CameraMode }) {
  const { camera } = useThree()
  const smoothedTargetRef = useRef(new THREE.Vector3())
  const previousModeRef = useRef<CameraMode | null>(null)

  useFrame(() => {
    if (mode === "free") return

    const { quadrotor } = useSimulationStore.getState()
    const target = new THREE.Vector3(quadrotor.position[0], quadrotor.position[2], quadrotor.position[1])
    const smoothedTarget = smoothedTargetRef.current

    if (previousModeRef.current !== mode) {
      smoothedTarget.copy(target)
      previousModeRef.current = mode
    } else {
      smoothedTarget.lerp(target, mode === "top" ? 0.018 : 0.055)
    }

    const desired =
      mode === "top"
        ? new THREE.Vector3(smoothedTarget.x + 0.01, Math.max(6.8, smoothedTarget.y + 6.4), smoothedTarget.z + 0.01)
        : mode === "side"
          ? smoothedTarget.clone().add(new THREE.Vector3(4.4, 1.35, 0.08))
          : smoothedTarget.clone().add(new THREE.Vector3(3.2, 1.65, 3.8))

    camera.position.lerp(desired, mode === "top" ? 0.035 : 0.055)
    camera.lookAt(smoothedTarget)
  })

  return null
}

export function DroneScene() {
  const [cameraMode, setCameraMode] = useState<CameraMode>("follow")
  const altitude = useSimulationStore((state) => state.quadrotor.position[2])
  const velocity = useSimulationStore((state) => state.quadrotor.velocity[2])
  const roll = useSimulationStore((state) => state.quadrotor.euler[0])
  const pitch = useSimulationStore((state) => state.quadrotor.euler[1])
  const yaw = useSimulationStore((state) => state.quadrotor.euler[2])

  return (
    <section className="scene-panel boot-reveal" style={{ animationDelay: "90ms" }}>
      <Canvas shadows camera={{ position: [3.2, 1.65, 3.8], fov: 42, near: 0.02, far: 120 }} dpr={[1, 1.7]}>
        <color attach="background" args={["#f8fafc"]} />
        <fog attach="fog" args={["#f8fafc", 14, 48]} />
        <Suspense fallback={null}>
          <Environment />
          <MissionObjects />
          <SetpointMarker />
          <TrajectoryTrail />
          <Quadrotor />
        </Suspense>
        <CameraController mode={cameraMode} />
        <OrbitControls
          enableDamping
          enabled={cameraMode === "free"}
          dampingFactor={0.08}
          minDistance={0.55}
          maxDistance={16}
          target={[0, 0.45, 0]}
          onStart={() => setCameraMode("free")}
        />
      </Canvas>

      <div className="scene-overlay">
        <div className="hud-readout">
          <span>Altitude</span>
          <strong>{altitude.toFixed(2)} m</strong>
        </div>
        <div className="hud-readout">
          <span>Vertical rate</span>
          <strong>{velocity.toFixed(2)} m/s</strong>
        </div>
        <div className="hud-readout">
          <span>Attitude</span>
          <strong>
            {formatRadiansAsDegrees(roll).toFixed(0)}/{formatRadiansAsDegrees(pitch).toFixed(0)}/
            {formatRadiansAsDegrees(yaw).toFixed(0)}
          </strong>
        </div>
      </div>

      <div className="camera-presets">
        {(["free", "follow", "top", "side"] as const).map((mode) => (
          <Button key={mode} className={cameraMode === mode ? "button-primary" : ""} onClick={() => setCameraMode(mode)}>
            {mode === "free" ? "inspect" : mode}
          </Button>
        ))}
      </div>
    </section>
  )
}
