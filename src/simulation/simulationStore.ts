import { create } from "zustand"
import {
  BASE_MASS,
  DEFAULT_MOTOR_FACTORS,
  GRAVITY,
  GROUND_ALTITUDE,
  HISTORY_LIMIT,
  HISTORY_SAMPLE_DT,
  INITIAL_STATE,
  PHYSICS_DT,
} from "../physics/constants"
import { integrateRK4 } from "../physics/integrator"
import { mixPlusConfiguration, motorOutputToControl } from "../physics/motorMixer"
import { PIDController } from "../physics/pidController"
import { computeResponseMetrics, EMPTY_METRICS } from "../physics/metrics"
import { clamp, degreesToRadians, wrapAngle } from "../physics/vector"
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

export type MissionStatus = "ready" | "carrying" | "delivered" | "dropped"
export type PilotSource = "idle" | "virtual" | "keyboard" | "gamepad"

export interface PilotInput {
  enabled: boolean
  source: PilotSource
  leftX: number
  leftY: number
  rightX: number
  rightY: number
  gamepadName: string | null
}

type PilotInputUpdate = Partial<Omit<PilotInput, "enabled">>

export interface MissionState {
  status: MissionStatus
  packagePosition: Vec3
  dropZonePosition: Vec3
  packageMass: number
  pickupAvailable: boolean
  dropAvailable: boolean
  lastDropError: number | null
  message: string
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
  mission: MissionState
  pilotInput: PilotInput
  activePresetId: string
  stepStartedAt: number
  lastHistoryAt: number
  learnOpen: boolean
  activeLessonId: string
  activeChallengeId: string
  activeLearnTab: "lessons" | "challenges"
  activeGuideId: string | null
  activeGuideStep: number
  completedGuideIds: string[]
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
  pickupPackage: () => void
  dropPackage: () => void
  resetMission: () => void
  setPilotEnabled: (enabled: boolean) => void
  setPilotInput: (input: PilotInputUpdate) => void
  centerPilotInput: () => void
  applyPilotCommand: (deltaSeconds: number) => void
  setLearnOpen: (open: boolean) => void
  setActiveLesson: (lessonId: string) => void
  setActiveChallenge: (challengeId: string) => void
  setActiveLearnTab: (tab: "lessons" | "challenges") => void
  startGuidedLesson: (guideId: string) => void
  stopGuidedLesson: () => void
  setActiveGuideStep: (step: number) => void
  finishGuidedLesson: () => void
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
  altitude: 1.35,
  roll: 0,
  pitch: 0,
  yaw: 0,
}

const createMissionState = (): MissionState => ({
  status: "ready",
  packagePosition: [2.8, -2.1, 0.14],
  dropZonePosition: [-2.8, 2.35, 0],
  packageMass: 0.36,
  pickupAvailable: false,
  dropAvailable: false,
  lastDropError: null,
  message: "Fly near the package and hold a steady low hover to pick it up.",
})

const createPilotInput = (): PilotInput => ({
  enabled: false,
  source: "idle",
  leftX: 0,
  leftY: 0,
  rightX: 0,
  rightY: 0,
  gamepadName: null,
})

const horizontalDistance = (a: Vec3, b: Vec3): number => Math.hypot(a[0] - b[0], a[1] - b[1])

const isStableForCargo = (quadrotor: QuadrotorState): boolean => {
  const horizontalSpeed = Math.hypot(quadrotor.velocity[0], quadrotor.velocity[1])
  return (
    horizontalSpeed < 0.72 &&
    Math.abs(quadrotor.velocity[2]) < 0.42 &&
    Math.abs(quadrotor.euler[0]) < 0.22 &&
    Math.abs(quadrotor.euler[1]) < 0.22
  )
}

const evaluateMission = (mission: MissionState, quadrotor: QuadrotorState): MissionState => {
  if (mission.status === "delivered" || mission.status === "dropped") {
    return {
      ...mission,
      pickupAvailable: false,
      dropAvailable: false,
    }
  }

  const altitude = quadrotor.position[2]
  const stable = isStableForCargo(quadrotor)
  const pickupDistance = horizontalDistance(quadrotor.position, mission.packagePosition)
  const dropDistance = horizontalDistance(quadrotor.position, mission.dropZonePosition)
  const pickupAvailable = mission.status === "ready" && pickupDistance < 0.72 && altitude > 0.22 && altitude < 1.05 && stable
  const dropAvailable = mission.status === "carrying" && dropDistance < 0.85 && altitude > 0.28 && altitude < 1.25 && stable
  const message =
    mission.status === "carrying"
      ? dropAvailable
        ? "Stable over the drop zone. Release the package."
        : "Carry the package to the blue drop zone and settle before release."
      : pickupAvailable
        ? "Stable over the package. Pick it up."
        : "Approach the package slowly and stabilize below 1.05 m."

  return {
    ...mission,
    pickupAvailable,
    dropAvailable,
    message,
  }
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

const PILOT_PROFILES: Record<PilotSource, { maxTilt: number; yawRate: number; altitudeRate: number }> = {
  idle: {
    maxTilt: 0,
    yawRate: 0,
    altitudeRate: 0,
  },
  keyboard: {
    maxTilt: degreesToRadians(15),
    yawRate: degreesToRadians(54),
    altitudeRate: 0.7,
  },
  virtual: {
    maxTilt: degreesToRadians(18),
    yawRate: degreesToRadians(70),
    altitudeRate: 0.85,
  },
  gamepad: {
    maxTilt: degreesToRadians(13),
    yawRate: degreesToRadians(48),
    altitudeRate: 0.62,
  },
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
  mission: evaluateMission(createMissionState(), INITIAL_STATE),
  pilotInput: createPilotInput(),
  activePresetId: defaultPreset.id,
  stepStartedAt: 0,
  lastHistoryAt: 0,
  learnOpen: false,
  activeLessonId: "axes",
  activeChallengeId: "altitude-step",
  activeLearnTab: "lessons",
  activeGuideId: null,
  activeGuideStep: 0,
  completedGuideIds: [],

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
      mission: evaluateMission(createMissionState(), INITIAL_STATE),
      pilotInput: createPilotInput(),
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
      let mission = state.mission

      for (let index = 0; index < steps; index += 1) {
        elapsed += PHYSICS_DT
        const windActive = disturbance.windEndsAt > elapsed
        const windForce: Vec3 = windActive ? disturbance.windForce : [0, 0, 0]
        const missionPayloadMass = mission.status === "carrying" ? mission.packageMass : 0
        const effectivePayloadMass = disturbance.payloadMass + missionPayloadMass
        const requestedControl = calculateControl(quadrotor, state.setpoints, effectivePayloadMass, controllers)
        motorOutput = mixPlusConfiguration(requestedControl, disturbance.motorFactors)
        const actualControl = motorOutputToControl(motorOutput)
        quadrotor = integrateRK4(
          quadrotor,
          {
            control: actualControl,
            payloadMass: effectivePayloadMass,
            windForce,
          },
          PHYSICS_DT,
        )

        if (elapsed - lastHistoryAt >= HISTORY_SAMPLE_DT) {
          history = appendHistory(history, makeHistorySample(elapsed, quadrotor, state.setpoints, motorOutput))
          lastHistoryAt = elapsed
        }
      }

      mission = evaluateMission(mission, quadrotor)

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
        mission,
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

  pickupPackage: () =>
    set((state) => {
      const mission = evaluateMission(state.mission, state.quadrotor)
      if (!mission.pickupAvailable || mission.status !== "ready") {
        return {
          mission,
        }
      }

      return {
        mission: evaluateMission(
          {
            ...mission,
            status: "carrying",
            pickupAvailable: false,
            message: "Payload attached. Tune altitude control and fly to the drop zone.",
          },
          state.quadrotor,
        ),
        stepStartedAt: state.elapsed,
      }
    }),

  dropPackage: () =>
    set((state) => {
      const mission = evaluateMission(state.mission, state.quadrotor)
      if (mission.status !== "carrying") {
        return {
          mission,
        }
      }

      const dropError = horizontalDistance(state.quadrotor.position, mission.dropZonePosition)
      const delivered = mission.dropAvailable
      const packagePosition: Vec3 = delivered
        ? [mission.dropZonePosition[0], mission.dropZonePosition[1], 0.14]
        : [state.quadrotor.position[0], state.quadrotor.position[1], 0.14]

      return {
        mission: {
          ...mission,
          status: delivered ? "delivered" : "dropped",
          packagePosition,
          pickupAvailable: false,
          dropAvailable: false,
          lastDropError: dropError,
          message: delivered
            ? "Delivery complete. The controller held a stable hover at release."
            : "Package released outside the stable drop window. Tune and reset the mission.",
        },
        stepStartedAt: state.elapsed,
      }
    }),

  resetMission: () => set((state) => ({ mission: evaluateMission(createMissionState(), state.quadrotor) })),

  setPilotEnabled: (enabled) =>
    set((state) => ({
      pilotInput: {
        ...state.pilotInput,
        enabled,
        source: enabled ? state.pilotInput.source : "idle",
        leftX: enabled ? state.pilotInput.leftX : 0,
        leftY: enabled ? state.pilotInput.leftY : 0,
        rightX: enabled ? state.pilotInput.rightX : 0,
        rightY: enabled ? state.pilotInput.rightY : 0,
      },
    })),

  setPilotInput: (input) =>
    set((state) => ({
      pilotInput: {
        ...state.pilotInput,
        ...input,
        leftX: clamp(input.leftX ?? state.pilotInput.leftX, -1, 1),
        leftY: clamp(input.leftY ?? state.pilotInput.leftY, -1, 1),
        rightX: clamp(input.rightX ?? state.pilotInput.rightX, -1, 1),
        rightY: clamp(input.rightY ?? state.pilotInput.rightY, -1, 1),
      },
    })),

  centerPilotInput: () =>
    set((state) => ({
      pilotInput: {
        ...state.pilotInput,
        source: "idle",
        leftX: 0,
        leftY: 0,
        rightX: 0,
        rightY: 0,
      },
      setpoints: {
        ...state.setpoints,
        roll: 0,
        pitch: 0,
      },
    })),

  applyPilotCommand: (deltaSeconds) =>
    set((state) => {
      if (!state.pilotInput.enabled || deltaSeconds <= 0) return state

      const { leftX, leftY, rightX, rightY, source } = state.pilotInput
      const profile = PILOT_PROFILES[source]
      const nextSetpoints: Setpoints = {
        altitude: clamp(state.setpoints.altitude - leftY * profile.altitudeRate * deltaSeconds, GROUND_ALTITUDE, 5),
        yaw: wrapAngle(state.setpoints.yaw + leftX * profile.yawRate * deltaSeconds),
        roll: -rightX * profile.maxTilt,
        pitch: -rightY * profile.maxTilt,
      }

      if (
        Math.abs(nextSetpoints.altitude - state.setpoints.altitude) < 0.0001 &&
        Math.abs(nextSetpoints.yaw - state.setpoints.yaw) < 0.0001 &&
        Math.abs(nextSetpoints.roll - state.setpoints.roll) < 0.0001 &&
        Math.abs(nextSetpoints.pitch - state.setpoints.pitch) < 0.0001
      ) {
        return state
      }

      return {
        setpoints: nextSetpoints,
      }
    }),

  setLearnOpen: (open) => set({ learnOpen: open }),
  setActiveLesson: (lessonId) => set({ activeLessonId: lessonId, activeLearnTab: "lessons", learnOpen: true }),
  setActiveChallenge: (challengeId) =>
    set({ activeChallengeId: challengeId, activeLearnTab: "challenges", learnOpen: true }),
  setActiveLearnTab: (tab) => set({ activeLearnTab: tab }),
  startGuidedLesson: (guideId) => set({ activeGuideId: guideId, activeGuideStep: 0, learnOpen: false }),
  stopGuidedLesson: () => set({ activeGuideId: null, activeGuideStep: 0 }),
  setActiveGuideStep: (step) => set({ activeGuideStep: Math.max(0, step) }),
  finishGuidedLesson: () =>
    set((state) => ({
      activeGuideId: null,
      activeGuideStep: 0,
      completedGuideIds:
        state.activeGuideId && !state.completedGuideIds.includes(state.activeGuideId)
          ? [...state.completedGuideIds, state.activeGuideId]
          : state.completedGuideIds,
    })),
}))
