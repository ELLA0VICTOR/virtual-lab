export type Vec3 = [number, number, number]
export type Vec4 = [number, number, number, number]
export type Mat3 = [Vec3, Vec3, Vec3]
export type QuaternionTuple = [number, number, number, number]

export interface QuadrotorState {
  position: Vec3
  velocity: Vec3
  euler: Vec3
  quaternion: QuaternionTuple
  angularVelocity: Vec3
}

export interface AxisGains {
  kp: number
  ki: number
  kd: number
}

export interface GainSet {
  altitude: AxisGains
  roll: AxisGains
  pitch: AxisGains
  yaw: AxisGains
}

export interface Setpoints {
  altitude: number
  roll: number
  pitch: number
  yaw: number
}

export interface ControlInputs {
  totalThrust: number
  torques: Vec3
}

export interface MotorOutput {
  omega: Vec4
  commandedThrusts: Vec4
  actualThrusts: Vec4
  normalized: Vec4
  saturated: [boolean, boolean, boolean, boolean]
}

export interface DisturbanceState {
  windForce: Vec3
  windEndsAt: number
  payloadMass: number
  motorFactors: Vec4
}

export interface HistorySample {
  t: number
  x: number
  y: number
  altitude: number
  altitudeSetpoint: number
  roll: number
  rollSetpoint: number
  pitch: number
  pitchSetpoint: number
  yaw: number
  yawSetpoint: number
  altitudeError: number
  rollError: number
  pitchError: number
  yawError: number
  motors: Vec4
}

export interface ResponseMetrics {
  riseTime: number | null
  overshoot: number
  settlingTime: number | null
  steadyStateError: number
  peak: number
}

export type MetricChannel = "altitude" | "roll" | "pitch" | "yaw"

export interface PidRuntime {
  integral: number
  previousMeasurement: number | null
  derivative: number
}
