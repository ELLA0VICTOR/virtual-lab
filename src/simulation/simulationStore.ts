import { create } from "zustand"
import { BASE_MASS, DEFAULT_MOTOR_FACTORS, GRAVITY, HISTORY_LIMIT, HISTORY_SAMPLE_DT, INITIAL_STATE, PHYSICS_DT } from "../physics/constants"
import { integrateRK4 } from "../physics/integrator"
import { mixPlusConfiguration, motorOutputToControl } from "../physics/motorMixer"
import { PIDController } from "../physics/pidController"
import { computeResponseMetrics, EMPTY_METRICS } from "../physics/metrics"
import { clamp, wrapAngle } from "../physics/vector"
import { createIdleDisturbance, createWindGust, motorFaultFactors, payloadMassForMode } from "./disturbances"
import { defaultPreset, gainPresets } from "./presets"
import type {
  AxisGains,
  GainSet,
  HistorySample,
  MetricChannel,
  MotorOutput,
  QuadrotorState,
  ResponseMetrics,
  Setpoints,
  Vec3,
  Vec4,
} from "../physics/types"

type GainAxis = keyof GainSet
type GainTerm = keyof AxisGains
type SetpointAxis = keyof Setpoints

interface ControllerBank {
  altitude: PIDController
  roll: PIDController
  pitch: PIDController
  yaw: PIDController
}

export interface SimulationStore {
  quadrotor: QuadrotorState
  elapsed: number
  running: boolean
  speed: number
  gains: GainSet
  setpoints: Setpoints
  motorOutput: MotorOutput
  history: HistorySample[]
  metrics: Record<MetricChannel, ResponseMetrics>
  disturbances: ReturnType<typeof createIdleDisturbance>
  payloadEnabled: boolean
  motorFaultIndex: number | null
  activePresetId: string
  stepStartedAt: number
  lastHistoryAt: number
  learnOpen: boolean
  activeLessonId: string
  activeChallengeId: string
  activeLearnTab: "lessons" | "challenges"
  setRunning: (running: boolean) => void
  toggleRunning: () => void
  setSpeed: (speed: number) => void
  setGain: (axis: GainAxis, term: GainTerm, value: number) => void
  setSetpoint: (axis: SetpointAxis, value: number) => void
  loadPreset: (presetId: string) => void
  resetSimulation: () => void
  singleStep: () => void
  advanceSimulation: (steps: number) => void
  injectWind: () => void
  togglePayload: () => void
  setMotorFault: (motorIndex: number | null) => void
  resetDisturbances: () => void
  setLearnOpen: (open: boolean) => void
  setActiveLesson: (lessonId: string) => void
  setActiveChallenge: (challengeId: string) => void
  setActiveLearnTab: (tab: "lessons" | "challenges") => void
}

const cloneGains = (gains: GainSet): GainSet => ({
  altitude: { ...gains.altitude },
  roll: { ...gains.roll },
  pitch: { ...gains.pitch },
  yaw: { ...gains.yaw },
})

const createMotorOutput = (): MotorOutput => ({
  omega: [0, 0, 0, 0],
  commandedThrusts: [0, 0, 0, 0],
  actualThrusts: [0, 0, 0, 0],
  normalized: [0, 0, 0, 0],
  saturated: [false, false, false, false],
})

const createMetrics = (): Record<MetricChannel, ResponseMetrics> => ({
  altitude: EMPTY_METRICS,
  roll: EMPTY_METRICS,
  pitch: EMPTY_METRICS,
  yaw: EMPTY_METRICS,
})

const makeControllers = (gains: GainSet): ControllerBank => ({
  altitude: new PIDController(gains.altitude, {
    integralLimit: 5,
    outputLimit: [-8.5, 11],
    derivativeFilter: 0.72,
  }),
  roll: new PIDController(gains.roll, {
    integralLimit: 0.8,
    outputLimit: [-1.55, 1.55],
    derivativeFilter: 0.68,
  }),
  pitch: new PIDController(gains.pitch, {
    integralLimit: 0.8,
    outputLimit: [-1.55, 1.55],
    derivativeFilter: 0.68,
  }),
  yaw: new PIDController(gains.yaw, {
    integralLimit: 1.2,
    outputLimit: [-0.62, 0.62],
    derivativeFilter: 0.72,
  }),
})

const syncControllerGains = (controllers: ControllerBank, gains: GainSet): void => {
  controllers.altitude.setGains(gains.altitude)
  controllers.roll.setGains(gains.roll)
  controllers.pitch.setGains(gains.pitch)
  controllers.yaw.setGains(gains.yaw)
}

const resetControllers = (controllers: ControllerBank): void => {
  controllers.altitude.reset()
  controllers.roll.reset()
  controllers.pitch.reset()
  controllers.yaw.reset()
}

const initialSetpoints: Setpoints = {
  altitude: 1.8,
  roll: 0,
  pitch: 0,
  yaw: 0,
}

const makeHistorySample = (
  t: number,
  quadrotor: QuadrotorState,
  setpoints: Setpoints,
  motorOutput: MotorOutput,
): HistorySample => ({
  t,
  x: quadrotor.position[0],
  y: quadrotor.position[1],
  altitude: quadrotor.position[2],
  altitudeSetpoint: setpoints.altitude,
  roll: quadrotor.euler[0],
  rollSetpoint: setpoints.roll,
  pitch: quadrotor.euler[1],
  pitchSetpoint: setpoints.pitch,
  yaw: quadrotor.euler[2],
  yawSetpoint: setpoints.yaw,
  altitudeError: setpoints.altitude - quadrotor.position[2],
  rollError: setpoints.roll - quadrotor.euler[0],
  pitchError: setpoints.pitch - quadrotor.euler[1],
  yawError: wrapAngle(setpoints.yaw - quadrotor.euler[2]),
  motors: [...motorOutput.normalized] as Vec4,
})

const appendHistory = (history: HistorySample[], sample: HistorySample): HistorySample[] => {
  const next = [...history, sample]
  return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next
}

const computeMetrics = (
  history: HistorySample[],
  stepStartedAt: number,
): Record<MetricChannel, ResponseMetrics> => ({
  altitude: computeResponseMetrics(history, "altitude", stepStartedAt),
  roll: computeResponseMetrics(history, "roll", stepStartedAt),
  pitch: computeResponseMetrics(history, "pitch", stepStartedAt),
  yaw: computeResponseMetrics(history, "yaw", stepStartedAt),
})

const calculateControl = (
  quadrotor: QuadrotorState,
  setpoints: Setpoints,
  payloadMass: number,
  controllers: ControllerBank,
): { totalThrust: number; torques: Vec3 } => {
  const altitudeAcceleration = controllers.altitude.update(setpoints.altitude, quadrotor.position[2], PHYSICS_DT)
  const tiltCompensation = clamp(Math.cos(quadrotor.euler[0]) * Math.cos(quadrotor.euler[1]), 0.28, 1)
  const mass = BASE_MASS + payloadMass
  const totalThrust = clamp((mass * (GRAVITY + altitudeAcceleration)) / tiltCompensation, 0, mass * 28)
  const rollTorque = controllers.roll.update(setpoints.roll, quadrotor.euler[0], PHYSICS_DT)
  const pitchTorque = controllers.pitch.update(setpoints.pitch, quadrotor.euler[1], PHYSICS_DT)
  const yawTorque = controllers.yaw.update(0, wrapAngle(quadrotor.euler[2] - setpoints.yaw), PHYSICS_DT)

  return {
    totalThrust,
    torques: [rollTorque, pitchTorque, yawTorque],
  }
}

const controllers = makeControllers(defaultPreset.gains)

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  quadrotor: INITIAL_STATE,
  elapsed: 0,
  running: false,
  speed: 1,
  gains: cloneGains(defaultPreset.gains),
  setpoints: { ...initialSetpoints },
  motorOutput: createMotorOutput(),
  history: [makeHistorySample(0, INITIAL_STATE, initialSetpoints, createMotorOutput())],
  metrics: createMetrics(),
  disturbances: createIdleDisturbance(),
  payloadEnabled: false,
  motorFaultIndex: null,
  activePresetId: defaultPreset.id,
  stepStartedAt: 0,
  lastHistoryAt: 0,
  learnOpen: false,
  activeLessonId: "axes",
  activeChallengeId: "altitude-step",
  activeLearnTab: "lessons",

  setRunning: (running) => set({ running }),
  toggleRunning: () => set((state) => ({ running: !state.running })),
  setSpeed: (speed) => set({ speed: clamp(speed, 0.25, 4) }),

  setGain: (axis, term, value) =>
    set((state) => {
      const nextGains = cloneGains(state.gains)
      nextGains[axis] = {
        ...nextGains[axis],
        [term]: value,
      }
      syncControllerGains(controllers, nextGains)
      controllers[axis].reset()
      return {
        gains: nextGains,
        activePresetId: "custom",
        stepStartedAt: state.elapsed,
      }
    }),

  setSetpoint: (axis, value) =>
    set((state) => ({
      setpoints: {
        ...state.setpoints,
        [axis]: value,
      },
      stepStartedAt: state.elapsed,
    })),

  loadPreset: (presetId) =>
    set((state) => {
      const preset = gainPresets.find((item) => item.id === presetId) ?? defaultPreset
      const nextGains = cloneGains(preset.gains)
      syncControllerGains(controllers, nextGains)
      resetControllers(controllers)
      return {
        gains: nextGains,
        activePresetId: preset.id,
        stepStartedAt: state.elapsed,
      }
    }),

  resetSimulation: () => {
    resetControllers(controllers)
    set({
      quadrotor: INITIAL_STATE,
      elapsed: 0,
      running: false,
      setpoints: { ...initialSetpoints },
      motorOutput: createMotorOutput(),
      history: [makeHistorySample(0, INITIAL_STATE, initialSetpoints, createMotorOutput())],
      metrics: createMetrics(),
      disturbances: createIdleDisturbance(),
      payloadEnabled: false,
      motorFaultIndex: null,
      stepStartedAt: 0,
      lastHistoryAt: 0,
    })
  },

  singleStep: () => get().advanceSimulation(1),

  advanceSimulation: (steps) =>
    set((state) => {
      if (steps <= 0) return state

      let quadrotor = state.quadrotor
      let elapsed = state.elapsed
      let motorOutput = state.motorOutput
      let history = state.history
      let lastHistoryAt = state.lastHistoryAt
      let disturbance = state.disturbances

      for (let index = 0; index < steps; index += 1) {
        elapsed += PHYSICS_DT
        const windActive = disturbance.windEndsAt > elapsed
        const windForce: Vec3 = windActive ? disturbance.windForce : [0, 0, 0]
        const requestedControl = calculateControl(quadrotor, state.setpoints, disturbance.payloadMass, controllers)
        motorOutput = mixPlusConfiguration(requestedControl, disturbance.motorFactors)
        const actualControl = motorOutputToControl(motorOutput)
        quadrotor = integrateRK4(
          quadrotor,
          {
            control: actualControl,
            payloadMass: disturbance.payloadMass,
            windForce,
          },
          PHYSICS_DT,
        )

        if (elapsed - lastHistoryAt >= HISTORY_SAMPLE_DT) {
          history = appendHistory(history, makeHistorySample(elapsed, quadrotor, state.setpoints, motorOutput))
          lastHistoryAt = elapsed
        }
      }

      if (disturbance.windEndsAt <= elapsed && disturbance.windForce.some((component) => component !== 0)) {
        disturbance = {
          ...disturbance,
          windForce: [0, 0, 0],
          windEndsAt: 0,
        }
      }

      return {
        quadrotor,
        elapsed,
        motorOutput,
        history,
        lastHistoryAt,
        disturbances: disturbance,
        metrics: computeMetrics(history, state.stepStartedAt),
      }
    }),

  injectWind: () =>
    set((state) => ({
      disturbances: {
        ...state.disturbances,
        ...createWindGust(state.elapsed),
      },
    })),

  togglePayload: () =>
    set((state) => {
      const payloadEnabled = !state.payloadEnabled
      return {
        payloadEnabled,
        disturbances: {
          ...state.disturbances,
          payloadMass: payloadMassForMode(payloadEnabled),
        },
        stepStartedAt: state.elapsed,
      }
    }),

  setMotorFault: (motorIndex) =>
    set((state) => ({
      motorFaultIndex: motorIndex,
      disturbances: {
        ...state.disturbances,
        motorFactors: motorIndex === null ? DEFAULT_MOTOR_FACTORS : motorFaultFactors(motorIndex, 0.42),
      },
    })),

  resetDisturbances: () =>
    set((state) => ({
      disturbances: createIdleDisturbance(),
      payloadEnabled: false,
      motorFaultIndex: null,
      stepStartedAt: state.elapsed,
    })),

  setLearnOpen: (open) => set({ learnOpen: open }),
  setActiveLesson: (lessonId) => set({ activeLessonId: lessonId, activeLearnTab: "lessons", learnOpen: true }),
  setActiveChallenge: (challengeId) =>
    set({ activeChallengeId: challengeId, activeLearnTab: "challenges", learnOpen: true }),
  setActiveLearnTab: (tab) => set({ activeLearnTab: tab }),
}))
