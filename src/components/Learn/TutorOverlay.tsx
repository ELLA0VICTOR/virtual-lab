import { useEffect, useMemo, useRef } from "react"
import { FiCheckCircle, FiChevronLeft, FiChevronRight, FiRefreshCw, FiXCircle } from "react-icons/fi"
import { guidedLessons, type GuideAction, type GuidePointer, type GuideValidation } from "../../data/guidedLessons"
import { GROUND_ALTITUDE } from "../../physics/constants"
import type { Vec3 } from "../../physics/types"
import { degreesToRadians, formatRadiansAsDegrees, wrapAngle } from "../../physics/vector"
import { gainPresets } from "../../simulation/presets"
import { createTrainingScenario, useSimulationStore, type TrainingScenarioState } from "../../simulation/simulationStore"
import { Button } from "../ui/Button"

const presetId = (id: string): string => gainPresets.find((preset) => preset.id === id)?.id ?? "well-tuned"

const requestCameraMode = (mode: "follow" | "top" | "side" | "free"): void => {
  window.dispatchEvent(new CustomEvent("virtual-lab-camera-mode", { detail: mode }))
}

const prepareCleanLesson = (preset: string): ReturnType<typeof useSimulationStore.getState> => {
  const store = useSimulationStore.getState()
  store.resetSimulation()
  store.resetDisturbances()
  store.loadPreset(presetId(preset))
  return useSimulationStore.getState()
}

const setScenario = (scenario: Partial<TrainingScenarioState>): void => {
  useSimulationStore.getState().setTrainingScenario(createTrainingScenario(scenario))
}

const horizontalDistance = (a: Vec3, b: Vec3): number => Math.hypot(a[0] - b[0], a[1] - b[1])

const applyGuideAction = (action: GuideAction): void => {
  if (action === "pause") {
    useSimulationStore.getState().setRunning(false)
    return
  }

  if (action === "enablePilot") {
    useSimulationStore.getState().setPilotEnabled(true)
    return
  }

  if (action === "loadWellTuned") {
    const store = useSimulationStore.getState()
    store.loadPreset(presetId("well-tuned"))
    store.setRunning(true)
    return
  }

  if (action === "setupOrientation") {
    requestCameraMode("free")
    const store = prepareCleanLesson("well-tuned")
    store.clearTrainingScenario()
    store.setSetpoint("altitude", 1.35)
    store.setPilotEnabled(true)
    store.centerPilotInput()
    store.setRunning(false)
    return
  }

  if (action === "setupManualFlight") {
    requestCameraMode("follow")
    const store = prepareCleanLesson("well-tuned")
    store.setSetpoint("altitude", 1.25)
    store.setPilotEnabled(true)
    store.centerPilotInput()
    setScenario({
      kind: "manual-flight",
      title: "Manual hover zone",
      message: "Use pilot input to move away, then settle back inside the green ring.",
      targetPosition: [0, 0, 1.25],
      radius: 0.86,
      altitudeBand: [1.05, 1.45],
      accent: "green",
    })
    store.setRunning(true)
    return
  }

  if (action === "startAxesDemo") {
    requestCameraMode("follow")
    const store = prepareCleanLesson("well-tuned")
    store.setSetpoint("altitude", 1.7)
    store.setSetpoint("roll", degreesToRadians(8))
    store.setSetpoint("pitch", degreesToRadians(-5))
    setScenario({
      kind: "altitude-step",
      title: "Body axis demo",
      message: "Measured attitude should chase the commanded roll and pitch.",
      targetPosition: [0, 0, 1.7],
      radius: 0.55,
      altitudeBand: [1.52, 1.88],
      accent: "purple",
    })
    store.setPilotEnabled(true)
    store.setRunning(true)
    return
  }

  if (action === "setupTrackingStep") {
    requestCameraMode("follow")
    const store = prepareCleanLesson("well-tuned")
    store.setSetpoint("altitude", 2.05)
    setScenario({
      kind: "altitude-step",
      title: "Altitude setpoint",
      message: "The target ring is the desired height. The graph shows how the drone reaches it.",
      targetPosition: [0, 0, 2.05],
      radius: 0.62,
      altitudeBand: [1.9, 2.2],
      accent: "purple",
    })
    store.setRunning(true)
    return
  }

  if (action === "setupLowP") {
    requestCameraMode("follow")
    const store = prepareCleanLesson("overdamped")
    store.setSetpoint("altitude", 2.35)
    setScenario({
      kind: "altitude-step",
      title: "Slow proportional response",
      message: "Low Kp makes the climb lazy even though the target is clear.",
      targetPosition: [0, 0, 2.35],
      radius: 0.58,
      altitudeBand: [2.16, 2.54],
      accent: "amber",
    })
    store.setRunning(true)
    return
  }

  if (action === "setupOscillation") {
    requestCameraMode("follow")
    const store = prepareCleanLesson("underdamped")
    store.setSetpoint("altitude", 2.65)
    setScenario({
      kind: "altitude-step",
      title: "Oscillation target",
      message: "High Kp and weak Kd should overshoot this target before settling.",
      targetPosition: [0, 0, 2.65],
      radius: 0.58,
      altitudeBand: [2.42, 2.88],
      accent: "red",
    })
    store.setRunning(true)
    return
  }

  if (action === "setupPayloadBias") {
    requestCameraMode("follow")
    const store = prepareCleanLesson("overdamped")
    store.setSetpoint("altitude", 2.15)
    setScenario({
      kind: "hover-zone",
      title: "Payload hover band",
      message: "Extra mass creates a persistent altitude error until integral action removes it.",
      targetPosition: [0, 0, 2.15],
      radius: 0.62,
      altitudeBand: [1.96, 2.34],
      accent: "amber",
    })
    if (!useSimulationStore.getState().payloadEnabled) {
      useSimulationStore.getState().togglePayload()
    }
    useSimulationStore.getState().setRunning(true)
    return
  }

  if (action === "setupCoupledFlight") {
    requestCameraMode("follow")
    const store = prepareCleanLesson("well-tuned")
    store.setSetpoint("altitude", 2.2)
    store.setSetpoint("roll", degreesToRadians(13))
    store.setSetpoint("pitch", degreesToRadians(-9))
    setScenario({
      kind: "coupled-flight",
      title: "Coupled lift target",
      message: "Watch altitude control compensate while the body tilts.",
      targetPosition: [0, 0, 2.2],
      radius: 0.68,
      altitudeBand: [2.02, 2.38],
      accent: "blue",
    })
    store.setRunning(true)
    return
  }

  if (action === "setupYawAlign") {
    requestCameraMode("follow")
    const store = prepareCleanLesson("well-tuned")
    store.setSetpoint("altitude", 1.45)
    store.setSetpoint("yaw", 0)
    store.setPilotEnabled(true)
    store.centerPilotInput()
    setScenario({
      kind: "yaw-align",
      title: "Yaw heading target",
      message: "Rotate the blue nose to match the arrow.",
      targetPosition: [0, 0, 1.45],
      radius: 0.76,
      targetYaw: degreesToRadians(90),
      altitudeBand: [1.26, 1.64],
      accent: "blue",
    })
    store.setRunning(true)
    return
  }

  if (action === "setupWindRecovery") {
    requestCameraMode("follow")
    const store = prepareCleanLesson("well-tuned")
    store.setSetpoint("altitude", 1.8)
    setScenario({
      kind: "wind-recovery",
      title: "Wind recovery zone",
      message: "A gust will push the drone; recovery means it returns to this hover band.",
      targetPosition: [0, 0, 1.8],
      radius: 0.78,
      altitudeBand: [1.6, 2],
      accent: "blue",
    })
    store.setRunning(true)
    window.setTimeout(() => useSimulationStore.getState().injectWind(), 420)
    return
  }

  if (action === "setupMotorFault") {
    requestCameraMode("follow")
    const store = prepareCleanLesson("well-tuned")
    store.setSetpoint("altitude", 1.72)
    setScenario({
      kind: "motor-fault",
      title: "Motor limit hover",
      message: "One motor is weak. Watch for saturation and attitude error.",
      targetPosition: [0, 0, 1.72],
      radius: 0.7,
      altitudeBand: [1.5, 1.94],
      accent: "red",
    })
    store.setMotorFault(1)
    store.setRunning(true)
    return
  }

  if (action === "setupPrecisionLanding") {
    requestCameraMode("follow")
    const store = prepareCleanLesson("well-tuned")
    store.setSetpoint("altitude", 1.18)
    store.setPilotEnabled(true)
    store.centerPilotInput()
    setScenario({
      kind: "precision-landing",
      title: "Landing pad",
      message: "Descend with low vertical speed and keep the body level.",
      targetPosition: [0, 0, GROUND_ALTITUDE],
      radius: 0.76,
      altitudeBand: [GROUND_ALTITUDE, 0.55],
      accent: "green",
    })
    store.setRunning(true)
    return
  }

  if (action === "setupMission") {
    requestCameraMode("free")
    const store = prepareCleanLesson("untuned")
    store.clearTrainingScenario()
    store.resetMission()
    store.setSetpoint("altitude", 0.82)
    store.setSetpoint("roll", 0)
    store.setSetpoint("pitch", 0)
    store.setSetpoint("yaw", 0)
    store.setPilotEnabled(true)
    store.centerPilotInput()
    store.setRunning(false)
    return
  }

  if (action === "startMission") {
    requestCameraMode("follow")
    const store = useSimulationStore.getState()
    store.setPilotEnabled(true)
    store.setRunning(true)
  }
}

const validationCopy: Record<GuideValidation, { waiting: string; passed: string; hint: string }> = {
  pilotEnabled: {
    waiting: "Waiting for Pilot On",
    passed: "Pilot input is enabled",
    hint: "Press Pilot On, touch a stick, or use an arrow key.",
  },
  simRunning: {
    waiting: "Simulation is paused",
    passed: "Simulation is running",
    hint: "Press Run to let the physics move.",
  },
  simObserved: {
    waiting: "Gathering response data",
    passed: "Response data is visible",
    hint: "Let the graph run for a moment so the curve has a shape.",
  },
  manualFlightObserved: {
    waiting: "Waiting for pilot motion",
    passed: "Manual flight input affected the drone",
    hint: "Use arrows, W/A/S/D, the on-screen sticks, or a gamepad until the body tilts or turns.",
  },
  altitudeSettled: {
    waiting: "Altitude has not settled yet",
    passed: "Altitude response settled",
    hint: "Let the altitude curve approach the target with low final error.",
  },
  oscillationObserved: {
    waiting: "Waiting for overshoot",
    passed: "Overshoot is visible",
    hint: "Let the underdamped setup run until the altitude curve rises past the target.",
  },
  gainsChanged: {
    waiting: "No manual tuning yet",
    passed: "Gain matrix changed",
    hint: "Move one Kp, Ki, or Kd slider. The preset will become Custom.",
  },
  hoverStable: {
    waiting: "Hover still needs work",
    passed: "Hover is close to target",
    hint: "Aim for small altitude error, low vertical speed, and no motor saturation.",
  },
  payloadActive: {
    waiting: "Payload not active",
    passed: "Payload mass is active",
    hint: "The lesson setup adds mass so integral action has a job to do.",
  },
  couplingObserved: {
    waiting: "Waiting for coupled motion",
    passed: "Coupled attitude and altitude response is visible",
    hint: "Let the drone tilt while it tries to maintain altitude.",
  },
  yawAligned: {
    waiting: "Yaw is not aligned",
    passed: "Heading is aligned",
    hint: "Use A/D or the left stick to rotate the blue nose toward the yaw arrow.",
  },
  windRecovered: {
    waiting: "Recovery not proven yet",
    passed: "Wind recovery is stable",
    hint: "Wait until the gust ends, then tune until altitude error and vertical speed are small.",
  },
  motorFaultObserved: {
    waiting: "Motor fault response not observed",
    passed: "Motor fault response observed",
    hint: "Watch how the controller compensates when one motor is weak.",
  },
  safeLanding: {
    waiting: "Landing not safe yet",
    passed: "Safe landing achieved",
    hint: "Descend slowly and keep roll/pitch small near the floor.",
  },
  missionCarrying: {
    waiting: "Package not attached",
    passed: "Package is attached",
    hint: "Stabilize over the package, then use Pick Up when it lights up.",
  },
  missionDelivered: {
    waiting: "Delivery not complete",
    passed: "Payload delivered",
    hint: "Settle over the drop zone and release when Drop becomes active.",
  },
}

interface ValidationStatus {
  passed: boolean
  title: string
  hint: string
}

const pointerClassByTarget: Record<GuidePointer["target"], string> = {
  blueNose: "pointer-blue-nose",
  package: "pointer-package",
  runControls: "pointer-run-controls",
  pilotSticks: "pointer-pilot-sticks",
  gainSliders: "pointer-gain-sliders",
  charts: "pointer-charts",
  missionControls: "pointer-mission-controls",
  scenarioTarget: "pointer-scenario-target",
}

function GuidePointers({ pointers }: { pointers: GuidePointer[] | undefined }) {
  if (!pointers?.length) return null

  return (
    <div className="guide-pointer-layer" aria-hidden="true">
      {pointers.map((pointer) => (
        <div
          className={`guide-pointer ${pointer.arrow === false ? "label-only" : ""} ${pointerClassByTarget[pointer.target]}`.trim()}
          key={`${pointer.target}-${pointer.label}`}
        >
          <span>{pointer.label}</span>
          {pointer.arrow === false ? null : <b />}
        </div>
      ))}
    </div>
  )
}

const useValidationStatus = (validation: GuideValidation | undefined): ValidationStatus | null => {
  const running = useSimulationStore((state) => state.running)
  const elapsed = useSimulationStore((state) => state.elapsed)
  const activePresetId = useSimulationStore((state) => state.activePresetId)
  const metrics = useSimulationStore((state) => state.metrics)
  const history = useSimulationStore((state) => state.history)
  const disturbances = useSimulationStore((state) => state.disturbances)
  const motorFaultIndex = useSimulationStore((state) => state.motorFaultIndex)
  const mission = useSimulationStore((state) => state.mission)
  const payloadEnabled = useSimulationStore((state) => state.payloadEnabled)
  const pilotInput = useSimulationStore((state) => state.pilotInput)
  const quadrotor = useSimulationStore((state) => state.quadrotor)
  const setpoints = useSimulationStore((state) => state.setpoints)
  const motorOutput = useSimulationStore((state) => state.motorOutput)
  const trainingScenario = useSimulationStore((state) => state.trainingScenario)

  return useMemo(() => {
    if (!validation) return null

    const altitudeError = Math.abs(setpoints.altitude - quadrotor.position[2])
    const altitudeRate = Math.abs(quadrotor.velocity[2])
    const horizontalSpeed = Math.hypot(quadrotor.velocity[0], quadrotor.velocity[1])
    const levelAttitude = Math.abs(quadrotor.euler[0]) < 0.2 && Math.abs(quadrotor.euler[1]) < 0.2
    const target = trainingScenario.targetPosition
    const targetAltitudeError = target ? Math.abs(target[2] - quadrotor.position[2]) : altitudeError
    const targetDistance = target ? horizontalDistance(quadrotor.position, target) : Infinity
    const firstSample = history[0]
    const horizontalTravel = firstSample
      ? history.reduce((largest, sample) => Math.max(largest, Math.hypot(sample.x - firstSample.x, sample.y - firstSample.y)), 0)
      : 0
    const attitudeMoved = history.some(
      (sample) =>
        Math.abs(formatRadiansAsDegrees(sample.roll)) > 4 ||
        Math.abs(formatRadiansAsDegrees(sample.pitch)) > 4 ||
        Math.abs(formatRadiansAsDegrees(sample.yaw)) > 8,
    )
    const hoverStable =
      elapsed > 2 && altitudeError < 0.24 && altitudeRate < 0.34 && horizontalSpeed < 0.62 && levelAttitude && !motorOutput.saturated.some(Boolean)
    const scenarioHoverStable =
      target !== null &&
      elapsed > 1.6 &&
      targetDistance < Math.max(0.42, trainingScenario.radius) &&
      targetAltitudeError < 0.25 &&
      altitudeRate < 0.32 &&
      horizontalSpeed < 0.66 &&
      levelAttitude
    const yawError =
      trainingScenario.targetYaw === null
        ? Infinity
        : Math.abs(formatRadiansAsDegrees(wrapAngle(trainingScenario.targetYaw - quadrotor.euler[2])))
    const manualFlightObserved =
      pilotInput.enabled &&
      elapsed > 1.2 &&
      (horizontalTravel > 0.16 ||
        attitudeMoved ||
        Math.abs(setpoints.roll) > degreesToRadians(3) ||
        Math.abs(setpoints.pitch) > degreesToRadians(3) ||
        Math.abs(wrapAngle(setpoints.yaw)) > degreesToRadians(8))
    const altitudeSettled = elapsed > 2.4 && Math.abs(metrics.altitude.steadyStateError) < 0.18 && altitudeRate < 0.3
    const couplingObserved =
      elapsed > 1.2 &&
      (Math.abs(setpoints.roll) > degreesToRadians(6) || Math.abs(setpoints.pitch) > degreesToRadians(6)) &&
      history.some((sample) => Math.abs(sample.roll) > degreesToRadians(4) || Math.abs(sample.pitch) > degreesToRadians(4))
    const windRecovered =
      trainingScenario.kind === "wind-recovery" &&
      elapsed > 2.8 &&
      disturbances.windForce.every((component) => component === 0) &&
      (hoverStable || scenarioHoverStable)
    const safeLanding =
      elapsed > 2.4 &&
      quadrotor.position[2] <= GROUND_ALTITUDE + 0.035 &&
      altitudeRate < 0.16 &&
      horizontalSpeed < 0.44 &&
      levelAttitude
    const passedByValidation: Record<GuideValidation, boolean> = {
      pilotEnabled: pilotInput.enabled,
      simRunning: running,
      simObserved: elapsed > 1.35,
      manualFlightObserved,
      altitudeSettled,
      oscillationObserved: elapsed > 2.2 && metrics.altitude.overshoot > 6,
      gainsChanged: activePresetId === "custom",
      hoverStable: hoverStable || scenarioHoverStable,
      payloadActive: payloadEnabled || mission.status === "carrying",
      couplingObserved,
      yawAligned: trainingScenario.targetYaw !== null && yawError < 9 && Math.abs(quadrotor.angularVelocity[2]) < 0.34,
      windRecovered,
      motorFaultObserved: motorFaultIndex !== null && elapsed > 1.2,
      safeLanding,
      missionCarrying: mission.status === "carrying",
      missionDelivered: mission.status === "delivered",
    }
    const copy = validationCopy[validation]
    const passed = passedByValidation[validation]

    return {
      passed,
      title: passed ? copy.passed : copy.waiting,
      hint: copy.hint,
    }
  }, [
    activePresetId,
    disturbances,
    elapsed,
    history,
    metrics.altitude.overshoot,
    metrics.altitude.steadyStateError,
    mission.status,
    motorFaultIndex,
    motorOutput.saturated,
    payloadEnabled,
    pilotInput.enabled,
    quadrotor.angularVelocity,
    quadrotor.euler,
    quadrotor.position,
    quadrotor.velocity,
    running,
    setpoints.altitude,
    setpoints.pitch,
    setpoints.roll,
    setpoints.yaw,
    trainingScenario,
    validation,
  ])
}

export function TutorOverlay() {
  const activeGuideId = useSimulationStore((state) => state.activeGuideId)
  const activeGuideStep = useSimulationStore((state) => state.activeGuideStep)
  const setActiveGuideStep = useSimulationStore((state) => state.setActiveGuideStep)
  const stopGuidedLesson = useSimulationStore((state) => state.stopGuidedLesson)
  const finishGuidedLesson = useSimulationStore((state) => state.finishGuidedLesson)
  const appliedStepRef = useRef("")
  const guide = guidedLessons.find((lesson) => lesson.id === activeGuideId)
  const stepIndex = guide ? Math.min(activeGuideStep, guide.steps.length - 1) : 0
  const step = guide?.steps[stepIndex]
  const validationStatus = useValidationStatus(step?.validation)

  useEffect(() => {
    if (!step) {
      document.documentElement.removeAttribute("data-guide-target")
      return
    }

    document.documentElement.dataset.guideTarget = step.anchor
    return () => document.documentElement.removeAttribute("data-guide-target")
  }, [step])

  useEffect(() => {
    if (!guide || !step?.action) return

    const signature = `${guide.id}:${stepIndex}:${step.action}`
    if (appliedStepRef.current === signature) return

    appliedStepRef.current = signature
    applyGuideAction(step.action)
  }, [guide, step, stepIndex])

  if (!guide || !step) return null

  const isLastStep = stepIndex === guide.steps.length - 1
  const canAdvance = !step.requirePass || validationStatus?.passed
  const placement = step.placement ?? "right"
  const progress = ((stepIndex + 1) / guide.steps.length) * 100

  const handleNext = () => {
    if (!canAdvance) return
    if (isLastStep) {
      finishGuidedLesson()
      return
    }
    setActiveGuideStep(stepIndex + 1)
  }

  const handleSkip = () => {
    if (isLastStep) {
      finishGuidedLesson()
      return
    }
    setActiveGuideStep(stepIndex + 1)
  }

  return (
    <>
      <div className="guide-scrim" aria-hidden="true" />
      <GuidePointers pointers={step.pointers} />
      <section className={`tutor-card tutor-${placement}`} aria-live="polite">
        <div className="tutor-topline">
          <span>{guide.stage}</span>
          <span>
            Step {stepIndex + 1} of {guide.steps.length}
          </span>
        </div>

        <h2>{step.title}</h2>
        <p>{step.body}</p>

        {step.callout ? <div className="tutor-callout">{step.callout}</div> : null}

        {validationStatus ? (
          <div className={`tutor-check ${validationStatus.passed ? "passed" : ""}`.trim()}>
            <FiCheckCircle aria-hidden="true" size={17} />
            <div>
              <strong>{validationStatus.title}</strong>
              <span>{validationStatus.hint}</span>
            </div>
          </div>
        ) : null}

        <div className="tutor-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="tutor-actions">
          <Button icon={FiChevronLeft} disabled={stepIndex === 0} onClick={() => setActiveGuideStep(stepIndex - 1)}>
            Back
          </Button>
          {step.action ? (
            <Button icon={FiRefreshCw} onClick={() => applyGuideAction(step.action as GuideAction)}>
              Reset Step
            </Button>
          ) : null}
          {!canAdvance ? (
            <Button onClick={handleSkip}>
              Skip
            </Button>
          ) : null}
          <Button icon={FiChevronRight} variant="primary" disabled={!canAdvance} onClick={handleNext}>
            {isLastStep ? "Finish" : step.primaryLabel ?? "Next"}
          </Button>
          <Button icon={FiXCircle} iconOnly onClick={stopGuidedLesson}>
            Close tutor
          </Button>
        </div>
      </section>
    </>
  )
}
