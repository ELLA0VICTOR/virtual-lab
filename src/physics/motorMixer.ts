import {
  ARM_LENGTH,
  MAX_ROTOR_OMEGA,
  MAX_ROTOR_THRUST,
  MIN_ROTOR_OMEGA,
  THRUST_COEFFICIENT,
  YAW_TORQUE_RATIO,
} from "./constants"
import { clamp } from "./vector"
import type { ControlInputs, MotorOutput, Vec4 } from "./types"

const toOmega = (thrust: number): number => Math.sqrt(Math.max(0, thrust) / THRUST_COEFFICIENT)

export const mixPlusConfiguration = (inputs: ControlInputs, motorFactors: Vec4): MotorOutput => {
  const [tauRoll, tauPitch, tauYaw] = inputs.torques
  const base = inputs.totalThrust * 0.25
  const rollTerm = tauRoll / (2 * ARM_LENGTH)
  const pitchTerm = tauPitch / (2 * ARM_LENGTH)
  const yawTerm = tauYaw / (4 * YAW_TORQUE_RATIO)

  // Plus layout: M1 front, M2 right, M3 rear, M4 left. Front/rear spin opposite right/left.
  const requested: Vec4 = [
    base + pitchTerm + yawTerm,
    base - rollTerm - yawTerm,
    base - pitchTerm + yawTerm,
    base + rollTerm - yawTerm,
  ]

  const commandedThrusts = requested.map((thrust) => clamp(thrust, 0, MAX_ROTOR_THRUST)) as Vec4
  const omega = commandedThrusts.map((thrust) => clamp(toOmega(thrust), MIN_ROTOR_OMEGA, MAX_ROTOR_OMEGA)) as Vec4
  const actualThrusts = commandedThrusts.map((thrust, index) => thrust * clamp(motorFactors[index], 0, 1)) as Vec4
  const normalized = omega.map((value) => value / MAX_ROTOR_OMEGA) as Vec4
  const saturated = requested.map(
    (thrust, index) => thrust < 0 || thrust > MAX_ROTOR_THRUST || motorFactors[index] < 0.999,
  ) as [boolean, boolean, boolean, boolean]

  return {
    omega,
    commandedThrusts,
    actualThrusts,
    normalized,
    saturated,
  }
}

export const motorOutputToControl = (output: MotorOutput): ControlInputs => {
  const [front, right, rear, left] = output.actualThrusts
  const totalThrust = front + right + rear + left
  const tauRoll = ARM_LENGTH * (left - right)
  const tauPitch = ARM_LENGTH * (front - rear)
  const tauYaw = YAW_TORQUE_RATIO * (front - right + rear - left)

  return {
    totalThrust,
    torques: [tauRoll, tauPitch, tauYaw],
  }
}
