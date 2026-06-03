import type { HistorySample, MetricChannel, ResponseMetrics } from "./types"

const valueFor = (sample: HistorySample, channel: MetricChannel): number => {
  if (channel === "altitude") return sample.altitude
  if (channel === "roll") return sample.roll
  if (channel === "pitch") return sample.pitch
  return sample.yaw
}

const setpointFor = (sample: HistorySample, channel: MetricChannel): number => {
  if (channel === "altitude") return sample.altitudeSetpoint
  if (channel === "roll") return sample.rollSetpoint
  if (channel === "pitch") return sample.pitchSetpoint
  return sample.yawSetpoint
}

export const EMPTY_METRICS: ResponseMetrics = {
  riseTime: null,
  overshoot: 0,
  settlingTime: null,
  steadyStateError: 0,
  peak: 0,
}

export const computeResponseMetrics = (
  history: HistorySample[],
  channel: MetricChannel,
  stepStartedAt: number,
): ResponseMetrics => {
  const samples = history.filter((sample) => sample.t >= stepStartedAt)
  if (samples.length < 4) {
    return EMPTY_METRICS
  }

  const first = samples[0]
  const initial = valueFor(first, channel)
  const target = setpointFor(samples[samples.length - 1], channel)
  const amplitude = target - initial
  const absAmplitude = Math.abs(amplitude)
  const latest = valueFor(samples[samples.length - 1], channel)
  const steadyStateError = target - latest
  const direction = Math.sign(amplitude) || 1
  const values = samples.map((sample) => valueFor(sample, channel))
  const peak =
    direction > 0
      ? values.reduce((max, value) => Math.max(max, value), values[0])
      : values.reduce((min, value) => Math.min(min, value), values[0])

  if (absAmplitude < 0.0001) {
    return {
      riseTime: null,
      overshoot: 0,
      settlingTime: null,
      steadyStateError,
      peak,
    }
  }

  const threshold10 = initial + amplitude * 0.1
  const threshold90 = initial + amplitude * 0.9
  const t10 = samples.find((sample) => direction * (valueFor(sample, channel) - threshold10) >= 0)?.t
  const t90 = samples.find((sample) => direction * (valueFor(sample, channel) - threshold90) >= 0)?.t
  const riseTime = t10 !== undefined && t90 !== undefined ? Math.max(0, t90 - t10) : null
  const overshoot = Math.max(0, (direction * (peak - target) / absAmplitude) * 100)
  const tolerance = Math.max(absAmplitude * 0.02, channel === "altitude" ? 0.02 : 0.01)
  let settlingTime: number | null = null

  for (let index = 0; index < samples.length; index += 1) {
    const slice = samples.slice(index)
    const settled = slice.every((sample) => Math.abs(valueFor(sample, channel) - target) <= tolerance)
    if (settled) {
      settlingTime = samples[index].t - stepStartedAt
      break
    }
  }

  return {
    riseTime,
    overshoot,
    settlingTime,
    steadyStateError,
    peak,
  }
}
