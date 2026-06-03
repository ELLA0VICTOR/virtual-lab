import { ANGULAR_DRAG, BASE_MASS, GRAVITY, INERTIA, LINEAR_DRAG } from "./constants"
import { cross3, eulerRatesFromBodyRates, eulerToQuaternion, multiplyMat3Vec3, rotationMatrixFromEuler } from "./vector"
import type { ControlInputs, QuadrotorState, Vec3 } from "./types"

export interface DynamicsContext {
  control: ControlInputs
  windForce: Vec3
  payloadMass: number
}

export interface StateDerivative {
  position: Vec3
  velocity: Vec3
  euler: Vec3
  angularVelocity: Vec3
}

export const makeState = (
  position: Vec3,
  velocity: Vec3,
  euler: Vec3,
  angularVelocity: Vec3,
): QuadrotorState => ({
  position,
  velocity,
  euler,
  quaternion: eulerToQuaternion(euler),
  angularVelocity,
})

export const quadrotorDerivative = (state: QuadrotorState, context: DynamicsContext): StateDerivative => {
  const mass = BASE_MASS + context.payloadMass
  const rotation = rotationMatrixFromEuler(state.euler)
  const thrustWorld = multiplyMat3Vec3(rotation, [0, 0, context.control.totalThrust])
  const dragForce: Vec3 = [
    LINEAR_DRAG[0] * state.velocity[0],
    LINEAR_DRAG[1] * state.velocity[1],
    LINEAR_DRAG[2] * state.velocity[2],
  ]
  const acceleration: Vec3 = [
    (thrustWorld[0] + context.windForce[0] - dragForce[0]) / mass,
    (thrustWorld[1] + context.windForce[1] - dragForce[1]) / mass,
    (thrustWorld[2] + context.windForce[2] - mass * GRAVITY - dragForce[2]) / mass,
  ]

  const inertiaOmega: Vec3 = [
    INERTIA[0] * state.angularVelocity[0],
    INERTIA[1] * state.angularVelocity[1],
    INERTIA[2] * state.angularVelocity[2],
  ]
  const gyroscopic = cross3(state.angularVelocity, inertiaOmega)
  const angularAcceleration: Vec3 = [
    (context.control.torques[0] - gyroscopic[0] - ANGULAR_DRAG[0] * state.angularVelocity[0]) / INERTIA[0],
    (context.control.torques[1] - gyroscopic[1] - ANGULAR_DRAG[1] * state.angularVelocity[1]) / INERTIA[1],
    (context.control.torques[2] - gyroscopic[2] - ANGULAR_DRAG[2] * state.angularVelocity[2]) / INERTIA[2],
  ]

  return {
    position: state.velocity,
    velocity: acceleration,
    euler: eulerRatesFromBodyRates(state.euler, state.angularVelocity),
    angularVelocity: angularAcceleration,
  }
}
