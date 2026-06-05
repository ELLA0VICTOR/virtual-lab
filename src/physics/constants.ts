import type { QuadrotorState, Vec3, Vec4 } from "./types"

export const GRAVITY = 9.81
export const PHYSICS_DT = 0.002
export const HISTORY_SAMPLE_DT = 0.033
export const HISTORY_LIMIT = 900
// Center height where the visual guard ring/landing frame rests on the floor.
export const GROUND_ALTITUDE = 0.21

// Typical small research quadrotor parameters: 1.0-1.5 kg class, 200-250 mm arm length,
// diagonal inertia in the low 10^-2 kg m^2 range, and rotor constants scaled for 10 in props.
export const BASE_MASS = 1.22
export const ARM_LENGTH = 0.225
export const INERTIA: Vec3 = [0.019, 0.019, 0.036]
export const LINEAR_DRAG: Vec3 = [0.18, 0.18, 0.24]
export const ANGULAR_DRAG: Vec3 = [0.018, 0.018, 0.024]
export const THRUST_COEFFICIENT = 1.9e-5
export const MOMENT_COEFFICIENT = 2.6e-7
export const MIN_ROTOR_OMEGA = 0
export const MAX_ROTOR_OMEGA = 980
export const MAX_ROTOR_THRUST = THRUST_COEFFICIENT * MAX_ROTOR_OMEGA * MAX_ROTOR_OMEGA
export const MAX_TOTAL_THRUST = MAX_ROTOR_THRUST * 4
export const YAW_TORQUE_RATIO = MOMENT_COEFFICIENT / THRUST_COEFFICIENT

export const DEFAULT_MOTOR_FACTORS: Vec4 = [1, 1, 1, 1]

export const INITIAL_STATE: QuadrotorState = {
  position: [0, 0, GROUND_ALTITUDE],
  velocity: [0, 0, 0],
  euler: [0, 0, 0],
  quaternion: [0, 0, 0, 1],
  angularVelocity: [0, 0, 0],
}
