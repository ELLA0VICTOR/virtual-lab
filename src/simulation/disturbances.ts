import type { DisturbanceState, Vec3, Vec4 } from "../physics/types"

export const createIdleDisturbance = (): DisturbanceState => ({
  windForce: [0, 0, 0],
  windEndsAt: 0,
  payloadMass: 0,
  motorFactors: [1, 1, 1, 1],
})

export const createWindGust = (elapsed: number): Pick<DisturbanceState, "windForce" | "windEndsAt"> => ({
  windForce: [2.8, -1.4, 0] satisfies Vec3,
  windEndsAt: elapsed + 1.35,
})

export const payloadMassForMode = (enabled: boolean): number => (enabled ? 0.42 : 0)

export const motorFaultFactors = (motorIndex: number, severity: number): Vec4 => {
  const factors: Vec4 = [1, 1, 1, 1]
  factors[motorIndex] = Math.max(0.18, 1 - severity)
  return factors
}
