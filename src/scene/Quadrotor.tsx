import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { ARM_LENGTH } from "../physics/constants"
import { rotationMatrixFromEuler } from "../physics/vector"
import { useSimulationStore } from "../simulation/simulationStore"

const VISUAL_ARM = ARM_LENGTH * 1.72
const VISUAL_SCALE = 1.58
const IDLE_RECORDING_OMEGA = 760

const motorPositions = [
  { label: "front", position: new THREE.Vector3(VISUAL_ARM, 0, 0), led: "#16a34a", spin: 1 },
  { label: "right", position: new THREE.Vector3(0, 0, VISUAL_ARM), led: "#dc2626", spin: -1 },
  { label: "rear", position: new THREE.Vector3(-VISUAL_ARM, 0, 0), led: "#dc2626", spin: 1 },
  { label: "left", position: new THREE.Vector3(0, 0, -VISUAL_ARM), led: "#16a34a", spin: -1 },
]

const cagePosts = Array.from({ length: 8 }, (_, index) => {
  const angle = (index / 8) * Math.PI * 2
  return [Math.cos(angle) * VISUAL_ARM * 1.62, Math.sin(angle) * VISUAL_ARM * 1.62] as const
})

export function Quadrotor() {
  const groupRef = useRef<THREE.Group>(null)
  const propRefs = useRef<Array<THREE.Group | null>>([])
  const sceneRotationRef = useRef(new THREE.Matrix4())
  const bodyMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#f1f5f9", roughness: 0.42, metalness: 0.18 }),
    [],
  )
  const darkMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1f2937", roughness: 0.5, metalness: 0.46 }),
    [],
  )
  const frameMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#374151", roughness: 0.38, metalness: 0.58 }),
    [],
  )
  const ringMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#64748b", roughness: 0.36, metalness: 0.55 }),
    [],
  )
  const propMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#475569",
        transparent: true,
        opacity: 0.62,
        roughness: 0.24,
        metalness: 0.12,
      }),
    [],
  )
  const propBlurMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#64748b",
        transparent: true,
        opacity: 0.14,
        roughness: 0.28,
        metalness: 0.08,
        depthWrite: false,
      }),
    [],
  )
  const noseMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#0284c7", emissive: "#0284c7", emissiveIntensity: 0.18, roughness: 0.34 }),
    [],
  )
  const headingMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#0284c7",
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      }),
    [],
  )

  useFrame((_, delta) => {
    const { quadrotor, motorOutput } = useSimulationStore.getState()
    const group = groupRef.current
    if (!group) return

    group.position.set(quadrotor.position[0], quadrotor.position[2] + 0.08, quadrotor.position[1])
    const rotation = rotationMatrixFromEuler(quadrotor.euler)
    sceneRotationRef.current.set(
      rotation[0][0],
      rotation[0][2],
      rotation[0][1],
      0,
      rotation[2][0],
      rotation[2][2],
      rotation[2][1],
      0,
      rotation[1][0],
      rotation[1][2],
      rotation[1][1],
      0,
      0,
      0,
      0,
      1,
    )
    group.setRotationFromMatrix(sceneRotationRef.current)

    propRefs.current.forEach((prop, index) => {
      if (prop) {
        const visualOmega = Math.max(motorOutput.omega[index], IDLE_RECORDING_OMEGA)
        prop.rotation.y += visualOmega * delta * 0.075 * motorPositions[index].spin
      }
    })
  })

  return (
    <group ref={groupRef} scale={VISUAL_SCALE} castShadow>
      <group>
        <mesh castShadow receiveShadow material={ringMaterial} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <torusGeometry args={[VISUAL_ARM * 1.62, 0.012, 12, 128]} />
        </mesh>
        <mesh castShadow receiveShadow material={ringMaterial} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.17, 0]}>
          <torusGeometry args={[VISUAL_ARM * 1.62, 0.01, 12, 128]} />
        </mesh>
        {cagePosts.map(([x, z]) => (
          <mesh key={`${x}-${z}`} castShadow material={ringMaterial} position={[x, -0.075, z]}>
            <cylinderGeometry args={[0.008, 0.008, 0.2, 12]} />
          </mesh>
        ))}
      </group>

      <mesh castShadow receiveShadow material={frameMaterial}>
        <boxGeometry args={[0.08, 0.04, VISUAL_ARM * 2.1]} />
      </mesh>
      <mesh castShadow receiveShadow material={frameMaterial}>
        <boxGeometry args={[VISUAL_ARM * 2.1, 0.04, 0.08]} />
      </mesh>
      <mesh castShadow receiveShadow material={frameMaterial} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[VISUAL_ARM * 1.92, 0.026, 0.026]} />
      </mesh>
      <mesh castShadow receiveShadow material={frameMaterial} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[VISUAL_ARM * 1.92, 0.026, 0.026]} />
      </mesh>

      <mesh castShadow receiveShadow material={bodyMaterial} position={[0, 0.045, 0]}>
        <boxGeometry args={[0.25, 0.13, 0.22]} />
      </mesh>
      <mesh castShadow receiveShadow material={darkMaterial} position={[0, 0.15, 0]}>
        <boxGeometry args={[0.18, 0.08, 0.16]} />
      </mesh>
      <mesh castShadow receiveShadow material={bodyMaterial} position={[0, 0.23, 0]}>
        <boxGeometry args={[0.12, 0.055, 0.1]} />
      </mesh>
      <group position={[VISUAL_ARM * 1.78, 0.08, 0]}>
        <mesh castShadow material={noseMaterial} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.06, 0.16, 3]} />
        </mesh>
        <mesh material={headingMaterial} position={[0.2, -0.12, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.055, 0.34, 3]} />
        </mesh>
      </group>

      {motorPositions.map((motor, index) => (
        <group key={motor.label} position={motor.position}>
          <mesh castShadow receiveShadow material={darkMaterial} position={[0, 0.045, 0]}>
            <cylinderGeometry args={[0.075, 0.082, 0.08, 40]} />
          </mesh>
          <mesh castShadow receiveShadow material={bodyMaterial} position={[0, 0.105, 0]}>
            <cylinderGeometry args={[0.048, 0.052, 0.055, 32]} />
          </mesh>
          <group
            ref={(node) => {
              propRefs.current[index] = node
            }}
            position={[0, 0.15, 0]}
          >
            <mesh material={propBlurMaterial}>
              <cylinderGeometry args={[0.245, 0.245, 0.006, 64]} />
            </mesh>
            <mesh material={propMaterial}>
              <boxGeometry args={[0.44, 0.014, 0.052]} />
            </mesh>
            <mesh material={propMaterial} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.44, 0.014, 0.052]} />
            </mesh>
            <mesh material={propMaterial} rotation={[0, Math.PI / 4, 0]}>
              <boxGeometry args={[0.38, 0.01, 0.032]} />
            </mesh>
          </group>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.018, 16, 16]} />
            <meshBasicMaterial color={motor.led} />
          </mesh>
          <pointLight position={[0, 0.22, 0]} color={motor.led} intensity={0.35} distance={0.8} />
        </group>
      ))}

      <group position={[0, -0.17, 0]}>
        <mesh castShadow material={frameMaterial} position={[0.16, -0.06, 0]}>
          <boxGeometry args={[0.026, 0.16, 0.026]} />
        </mesh>
        <mesh castShadow material={frameMaterial} position={[-0.16, -0.06, 0]}>
          <boxGeometry args={[0.026, 0.16, 0.026]} />
        </mesh>
        <mesh castShadow material={frameMaterial} position={[0, -0.14, 0.16]}>
          <boxGeometry args={[0.46, 0.024, 0.032]} />
        </mesh>
        <mesh castShadow material={frameMaterial} position={[0, -0.14, -0.16]}>
          <boxGeometry args={[0.46, 0.024, 0.032]} />
        </mesh>
      </group>
    </group>
  )
}
