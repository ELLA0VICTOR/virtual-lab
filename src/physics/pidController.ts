import { clamp } from "./vector"
import type { AxisGains, PidRuntime } from "./types"

export interface PidOptions {
  integralLimit: number
  outputLimit: [number, number]
  derivativeFilter: number
}

export class PIDController {
  private gains: AxisGains

  private readonly options: PidOptions

  private runtime: PidRuntime = {
    integral: 0,
    previousMeasurement: null,
    derivative: 0,
  }

  constructor(gains: AxisGains, options: PidOptions) {
    this.gains = gains
    this.options = options
  }

  setGains(gains: AxisGains): void {
    this.gains = gains
  }

  reset(): void {
    this.runtime = {
      integral: 0,
      previousMeasurement: null,
      derivative: 0,
    }
  }

  update(setpoint: number, measurement: number, dt: number): number {
    const error = setpoint - measurement
    const rawDerivative =
      this.runtime.previousMeasurement === null ? 0 : -(measurement - this.runtime.previousMeasurement) / dt
    const alpha = clamp(this.options.derivativeFilter, 0, 1)
    this.runtime.derivative = alpha * this.runtime.derivative + (1 - alpha) * rawDerivative
    this.runtime.integral = clamp(
      this.runtime.integral + error * dt,
      -this.options.integralLimit,
      this.options.integralLimit,
    )
    this.runtime.previousMeasurement = measurement

    const unclamped =
      this.gains.kp * error + this.gains.ki * this.runtime.integral + this.gains.kd * this.runtime.derivative

    return clamp(unclamped, this.options.outputLimit[0], this.options.outputLimit[1])
  }
}
