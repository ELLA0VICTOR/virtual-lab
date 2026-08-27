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
  let startIndex = history.findIndex((sample) => sample.t >= stepStartedAt)
  if (startIndex < 0) {
    return EMPTY_METRICS
  }

  const sampleCount = history.length - startIndex
  if (sampleCount < 4) {
    return EMPTY_METRICS
  }

  const first = history[startIndex]
  const initial = valueFor(first, channel)
  const latestSample = history[history.length - 1]
  const target = setpointFor(latestSample, channel)
  const amplitude = target - initial
  const absAmplitude = Math.abs(amplitude)
  const latest = valueFor(latestSample, channel)
  const steadyStateError = target - latest
  const direction = Math.sign(amplitude) || 1
  let peak = valueFor(first, channel)

  for (let index = startIndex + 1; index < history.length; index += 1) {
    const value = valueFor(history[index], channel)
    peak = direction > 0 ? Math.max(peak, value) : Math.min(peak, value)
  }

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
  const tolerance = Math.max(absAmplitude * 0.02, channel === "altitude" ? 0.02 : 0.01)
  let t10: number | undefined
  let t90: number | undefined
  let lastUnsettledIndex = startIndex - 1

  for (let index = startIndex; index < history.length; index += 1) {
    const sample = history[index]
    const value = valueFor(sample, channel)

    if (t10 === undefined && direction * (value - threshold10) >= 0) {
      t10 = sample.t
    }

    if (t90 === undefined && direction * (value - threshold90) >= 0) {
      t90 = sample.t
    }

    if (Math.abs(value - target) > tolerance) {
      lastUnsettledIndex = index
    }
  }

  const riseTime = t10 !== undefined && t90 !== undefined ? Math.max(0, t90 - t10) : null
  const overshoot = Math.max(0, (direction * (peak - target) / absAmplitude) * 100)
  startIndex = Math.max(startIndex, lastUnsettledIndex + 1)
  const settlingTime = startIndex < history.length ? history[startIndex].t - stepStartedAt : null

  return {
    riseTime,
    overshoot,
    settlingTime,
    steadyStateError,
    peak,
  }
}
