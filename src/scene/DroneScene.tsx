import { Suspense, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { formatRadiansAsDegrees } from "../physics/vector"
import { useSimulationStore } from "../simulation/simulationStore"
import { Button } from "../components/ui/Button"
import { Environment } from "./Environment"
import { Quadrotor } from "./Quadrotor"
import { SetpointMarker } from "./SetpointMarker"
import { TrajectoryTrail } from "./TrajectoryTrail"

type CameraMode = "follow" | "top" | "side" | "free"

function CameraController({ mode }: { mode: CameraMode }) {
  const { camera } = useThree()

  useFrame(() => {
    if (mode === "free") return

    const { quadrotor } = useSimulationStore.getState()
    const target = new THREE.Vector3(quadrotor.position[0], quadrotor.position[2], quadrotor.position[1])
    const desired =
      mode === "top"
        ? target.clone().add(new THREE.Vector3(0.01, 3.8, 0.01))
        : mode === "side"
          ? target.clone().add(new THREE.Vector3(2.8, 0.95, 0.08))
          : target.clone().add(new THREE.Vector3(2.25, 1.22, 2.65))

    camera.position.lerp(desired, 0.055)
    camera.lookAt(target)
  })

  return null
}

export function DroneScene() {
  const [cameraMode, setCameraMode] = useState<CameraMode>("free")
  const altitude = useSimulationStore((state) => state.quadrotor.position[2])
  const velocity = useSimulationStore((state) => state.quadrotor.velocity[2])
  const roll = useSimulationStore((state) => state.quadrotor.euler[0])
  const pitch = useSimulationStore((state) => state.quadrotor.euler[1])
  const yaw = useSimulationStore((state) => state.quadrotor.euler[2])

  return (
    <section className="scene-panel boot-reveal" style={{ animationDelay: "90ms" }}>
      <Canvas shadows camera={{ position: [2.05, 1.18, 2.65], fov: 42, near: 0.02, far: 80 }} dpr={[1, 1.7]}>
        <color attach="background" args={["#f8fafc"]} />
        <fog attach="fog" args={["#f8fafc", 8, 22]} />
        <Suspense fallback={null}>
          <Environment />
          <SetpointMarker />
          <TrajectoryTrail />
          <Quadrotor />
        </Suspense>
        <CameraController mode={cameraMode} />
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={0.55}
          maxDistance={7}
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
