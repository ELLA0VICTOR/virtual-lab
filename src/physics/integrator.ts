import { makeState, quadrotorDerivative } from "./quadrotor"
import { wrapAngle } from "./vector"
import type { DynamicsContext, StateDerivative } from "./quadrotor"
import type { QuadrotorState, Vec3 } from "./types"

const addDerivative = (state: QuadrotorState, derivative: StateDerivative, dt: number): QuadrotorState =>
  makeState(
    [
      state.position[0] + derivative.position[0] * dt,
      state.position[1] + derivative.position[1] * dt,
      state.position[2] + derivative.position[2] * dt,
    ],
    [
      state.velocity[0] + derivative.velocity[0] * dt,
      state.velocity[1] + derivative.velocity[1] * dt,
      state.velocity[2] + derivative.velocity[2] * dt,
    ],
    [
      state.euler[0] + derivative.euler[0] * dt,
      state.euler[1] + derivative.euler[1] * dt,
      state.euler[2] + derivative.euler[2] * dt,
    ],
    [
      state.angularVelocity[0] + derivative.angularVelocity[0] * dt,
      state.angularVelocity[1] + derivative.angularVelocity[1] * dt,
      state.angularVelocity[2] + derivative.angularVelocity[2] * dt,
    ],
  )

const combineVec = (initial: Vec3, k1: Vec3, k2: Vec3, k3: Vec3, k4: Vec3, dt: number): Vec3 => [
  initial[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
  initial[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
  initial[2] + (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
]

export const integrateRK4 = (state: QuadrotorState, context: DynamicsContext, dt: number): QuadrotorState => {
  const k1 = quadrotorDerivative(state, context)
  const k2 = quadrotorDerivative(addDerivative(state, k1, dt * 0.5), context)
  const k3 = quadrotorDerivative(addDerivative(state, k2, dt * 0.5), context)
  const k4 = quadrotorDerivative(addDerivative(state, k3, dt), context)

  const next = makeState(
    combineVec(state.position, k1.position, k2.position, k3.position, k4.position, dt),
    combineVec(state.velocity, k1.velocity, k2.velocity, k3.velocity, k4.velocity, dt),
    [
      wrapAngle(combineVec(state.euler, k1.euler, k2.euler, k3.euler, k4.euler, dt)[0]),
      wrapAngle(combineVec(state.euler, k1.euler, k2.euler, k3.euler, k4.euler, dt)[1]),
      wrapAngle(combineVec(state.euler, k1.euler, k2.euler, k3.euler, k4.euler, dt)[2]),
    ],
    combineVec(
      state.angularVelocity,
      k1.angularVelocity,
      k2.angularVelocity,
      k3.angularVelocity,
      k4.angularVelocity,
      dt,
    ),
  )

  if (next.position[2] >= 0.04) {
    return next
  }

  return makeState(
    [next.position[0], next.position[1], 0.04],
    [next.velocity[0] * 0.45, next.velocity[1] * 0.45, Math.max(0, next.velocity[2])],
    [next.euler[0] * 0.96, next.euler[1] * 0.96, next.euler[2]],
    [next.angularVelocity[0] * 0.7, next.angularVelocity[1] * 0.7, next.angularVelocity[2] * 0.85],
  )
}
