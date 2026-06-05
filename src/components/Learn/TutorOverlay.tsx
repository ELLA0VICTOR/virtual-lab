import { useEffect, useMemo, useRef } from "react"
import { FiCheckCircle, FiChevronLeft, FiChevronRight, FiRefreshCw, FiXCircle } from "react-icons/fi"
import { guidedLessons, type GuideAction, type GuidePointer, type GuideValidation } from "../../data/guidedLessons"
import { degreesToRadians } from "../../physics/vector"
import { gainPresets } from "../../simulation/presets"
import { useSimulationStore } from "../../simulation/simulationStore"
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
    store.setSetpoint("altitude", 1.35)
    store.setPilotEnabled(true)
    store.centerPilotInput()
    store.setRunning(false)
    return
  }

  if (action === "startAxesDemo") {
    requestCameraMode("follow")
    const store = prepareCleanLesson("well-tuned")
    store.setSetpoint("altitude", 1.7)
    store.setSetpoint("roll", degreesToRadians(8))
    store.setSetpoint("pitch", degreesToRadians(-5))
    store.setPilotEnabled(true)
    store.setRunning(true)
    return
  }

  if (action === "setupLowP") {
    requestCameraMode("follow")
    const store = prepareCleanLesson("overdamped")
    store.setSetpoint("altitude", 2.35)
    store.setRunning(true)
    return
  }

  if (action === "setupOscillation") {
    requestCameraMode("follow")
    const store = prepareCleanLesson("underdamped")
    store.setSetpoint("altitude", 2.65)
    store.setRunning(true)
    return
  }

  if (action === "setupPayloadBias") {
    requestCameraMode("follow")
    const store = prepareCleanLesson("overdamped")
    store.setSetpoint("altitude", 2.15)
    if (!useSimulationStore.getState().payloadEnabled) {
      useSimulationStore.getState().togglePayload()
    }
    useSimulationStore.getState().setRunning(true)
    return
  }

  if (action === "setupMission") {
    requestCameraMode("free")
    const store = prepareCleanLesson("untuned")
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
  const mission = useSimulationStore((state) => state.mission)
  const payloadEnabled = useSimulationStore((state) => state.payloadEnabled)
  const pilotInput = useSimulationStore((state) => state.pilotInput)
  const quadrotor = useSimulationStore((state) => state.quadrotor)
  const setpoints = useSimulationStore((state) => state.setpoints)
  const motorOutput = useSimulationStore((state) => state.motorOutput)

  return useMemo(() => {
    if (!validation) return null

    const altitudeError = Math.abs(setpoints.altitude - quadrotor.position[2])
    const altitudeRate = Math.abs(quadrotor.velocity[2])
    const hoverStable = elapsed > 2 && altitudeError < 0.24 && altitudeRate < 0.34 && !motorOutput.saturated.some(Boolean)
    const passedByValidation: Record<GuideValidation, boolean> = {
      pilotEnabled: pilotInput.enabled,
      simRunning: running,
      simObserved: elapsed > 1.35,
      oscillationObserved: elapsed > 2.2 && metrics.altitude.overshoot > 6,
      gainsChanged: activePresetId === "custom",
      hoverStable,
      payloadActive: payloadEnabled || mission.status === "carrying",
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
  }, [activePresetId, elapsed, metrics.altitude.overshoot, mission.status, motorOutput.saturated, payloadEnabled, pilotInput.enabled, quadrotor.position, quadrotor.velocity, running, setpoints.altitude, validation])
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
