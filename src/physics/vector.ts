import type { Mat3, QuaternionTuple, Vec3 } from "./types"

export const add3 = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]

export const sub3 = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]

export const scale3 = (a: Vec3, scalar: number): Vec3 => [a[0] * scalar, a[1] * scalar, a[2] * scalar]

export const clamp = (value: number, min: number, max: number): number => {
  if (value < min) return min
  if (value > max) return max
  return value
}

export const cross3 = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

export const multiplyMat3Vec3 = (matrix: Mat3, vector: Vec3): Vec3 => [
  matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
  matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
  matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2],
]

export const rotationMatrixFromEuler = ([roll, pitch, yaw]: Vec3): Mat3 => {
  const cr = Math.cos(roll)
  const sr = Math.sin(roll)
  const cp = Math.cos(pitch)
  const sp = Math.sin(pitch)
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)

  return [
    [cy * cp, cy * sp * sr - sy * cr, cy * sp * cr + sy * sr],
    [sy * cp, sy * sp * sr + cy * cr, sy * sp * cr - cy * sr],
    [-sp, cp * sr, cp * cr],
  ]
}

export const eulerRatesFromBodyRates = ([roll, pitch]: Vec3, [p, q, r]: Vec3): Vec3 => {
  const cosPitch = Math.max(0.08, Math.cos(pitch))
  const tanPitch = Math.sin(pitch) / cosPitch
  const sinRoll = Math.sin(roll)
  const cosRoll = Math.cos(roll)

  return [
    p + sinRoll * tanPitch * q + cosRoll * tanPitch * r,
    cosRoll * q - sinRoll * r,
    (sinRoll / cosPitch) * q + (cosRoll / cosPitch) * r,
  ]
}

export const eulerToQuaternion = ([roll, pitch, yaw]: Vec3): QuaternionTuple => {
  const cy = Math.cos(yaw * 0.5)
  const sy = Math.sin(yaw * 0.5)
  const cp = Math.cos(pitch * 0.5)
  const sp = Math.sin(pitch * 0.5)
  const cr = Math.cos(roll * 0.5)
  const sr = Math.sin(roll * 0.5)

  return [
    sr * cp * cy - cr * sp * sy,
    cr * sp * cy + sr * cp * sy,
    cr * cp * sy - sr * sp * cy,
    cr * cp * cy + sr * sp * sy,
  ]
}

export const wrapAngle = (angle: number): number => {
  let wrapped = angle
  while (wrapped > Math.PI) wrapped -= Math.PI * 2
  while (wrapped < -Math.PI) wrapped += Math.PI * 2
  return wrapped
}

export const formatRadiansAsDegrees = (radians: number): number => radians * (180 / Math.PI)

export const degreesToRadians = (degrees: number): number => degrees * (Math.PI / 180)
