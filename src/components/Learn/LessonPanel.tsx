import { FiCheckCircle, FiPlayCircle, FiX } from "react-icons/fi"
import { GROUND_ALTITUDE } from "../../physics/constants"
import { degreesToRadians, formatRadiansAsDegrees } from "../../physics/vector"
import { challenges } from "../../data/challenges"
import { guidedLessons } from "../../data/guidedLessons"
import { lessons, type LessonScenario } from "../../data/lessons"
import { gainPresets } from "../../simulation/presets"
import { createTrainingScenario, useSimulationStore } from "../../simulation/simulationStore"
import { Button } from "../ui/Button"
import { Tab } from "../ui/Tab"
import { ChallengeCard } from "./ChallengeCard"

const presetId = (name: string): string => gainPresets.find((preset) => preset.id === name)?.id ?? "well-tuned"

const runLessonScenario = (scenario: LessonScenario): void => {
  const store = useSimulationStore.getState()
  store.resetDisturbances()
  store.clearTrainingScenario()

  if (scenario === "axes") {
    store.loadPreset(presetId("well-tuned"))
    store.setSetpoint("altitude", 1.8)
    store.setSetpoint("roll", degreesToRadians(10))
    store.setSetpoint("pitch", degreesToRadians(-6))
  }

  if (scenario === "p-term") {
    store.loadPreset(presetId("underdamped"))
    store.setSetpoint("altitude", 2.6)
  }

  if (scenario === "i-term") {
    store.loadPreset(presetId("overdamped"))
    store.setSetpoint("altitude", 2.1)
    if (!useSimulationStore.getState().payloadEnabled) store.togglePayload()
  }

  if (scenario === "d-term") {
    store.loadPreset(presetId("overdamped"))
    store.setSetpoint("altitude", 2.4)
  }

  if (scenario === "underactuated") {
    store.loadPreset(presetId("well-tuned"))
    store.setSetpoint("altitude", 2.2)
    store.setSetpoint("roll", degreesToRadians(15))
    store.setSetpoint("pitch", degreesToRadians(-10))
  }

  if (scenario === "mission") {
    store.resetMission()
    store.loadPreset(presetId("untuned"))
    store.setSetpoint("altitude", 0.85)
    store.setSetpoint("roll", 0)
    store.setSetpoint("pitch", 0)
    store.setSetpoint("yaw", 0)
  }

  store.setRunning(true)
}

const setupChallenge = (challengeId: string): void => {
  const store = useSimulationStore.getState()
  store.resetSimulation()
  store.loadPreset(presetId("well-tuned"))
  store.clearTrainingScenario()

  if (challengeId === "altitude-step") {
    store.setSetpoint("altitude", 2.4)
    store.setTrainingScenario(
      createTrainingScenario({
        kind: "altitude-step",
        title: "Altitude challenge target",
        message: "Tune for a clean step response with limited overshoot.",
        targetPosition: [0, 0, 2.4],
        radius: 0.62,
        altitudeBand: [2.25, 2.55],
        accent: "purple",
      }),
    )
  }

  if (challengeId === "payload-hover") {
    store.setSetpoint("altitude", 2.1)
    if (!useSimulationStore.getState().payloadEnabled) store.togglePayload()
    store.setTrainingScenario(
      createTrainingScenario({
        kind: "hover-zone",
        title: "Payload hover target",
        message: "Use integral action to remove the extra-mass offset.",
        targetPosition: [0, 0, 2.1],
        radius: 0.66,
        altitudeBand: [1.92, 2.28],
        accent: "amber",
      }),
    )
  }

  if (challengeId === "wind-recovery") {
    store.setSetpoint("altitude", 1.8)
    store.setTrainingScenario(
      createTrainingScenario({
        kind: "wind-recovery",
        title: "Wind recovery target",
        message: "Recover to this hover band after the gust.",
        targetPosition: [0, 0, 1.8],
        radius: 0.78,
        altitudeBand: [1.6, 2],
        accent: "blue",
      }),
    )
    store.setRunning(true)
    window.setTimeout(() => useSimulationStore.getState().injectWind(), 360)
    return
  }

  if (challengeId === "yaw-zero") {
    store.setSetpoint("altitude", 1.8)
    store.setSetpoint("yaw", degreesToRadians(90))
    store.setTrainingScenario(
      createTrainingScenario({
        kind: "yaw-align",
        title: "Yaw challenge target",
        message: "Capture the commanded heading without sustained error.",
        targetPosition: [0, 0, 1.8],
        radius: 0.68,
        targetYaw: degreesToRadians(90),
        altitudeBand: [1.62, 1.98],
        accent: "blue",
      }),
    )
  }

  if (challengeId === "motor-fault-hover") {
    store.setSetpoint("altitude", 1.72)
    store.setMotorFault(1)
    store.setTrainingScenario(
      createTrainingScenario({
        kind: "motor-fault",
        title: "Motor fault hover target",
        message: "Hold altitude with one weakened motor.",
        targetPosition: [0, 0, 1.72],
        radius: 0.72,
        altitudeBand: [1.5, 1.94],
        accent: "red",
      }),
    )
  }

  if (challengeId === "precision-landing") {
    store.setSetpoint("altitude", 1.15)
    store.setPilotEnabled(true)
    store.centerPilotInput()
    store.setTrainingScenario(
      createTrainingScenario({
        kind: "precision-landing",
        title: "Landing challenge pad",
        message: "Descend softly and keep the drone level.",
        targetPosition: [0, 0, GROUND_ALTITUDE],
        radius: 0.76,
        altitudeBand: [GROUND_ALTITUDE, 0.55],
        accent: "green",
      }),
    )
  }

  if (challengeId === "delivery-run") {
    store.loadPreset(presetId("untuned"))
    store.resetMission()
    store.setSetpoint("altitude", 0.82)
    store.setSetpoint("roll", 0)
    store.setSetpoint("pitch", 0)
    store.setSetpoint("yaw", 0)
    store.setPilotEnabled(true)
    store.centerPilotInput()
  }

  store.setRunning(true)
}

export function LessonPanel() {
  const open = useSimulationStore((state) => state.learnOpen)
  const activeLessonId = useSimulationStore((state) => state.activeLessonId)
  const activeChallengeId = useSimulationStore((state) => state.activeChallengeId)
  const activeLearnTab = useSimulationStore((state) => state.activeLearnTab)
  const activeGuideId = useSimulationStore((state) => state.activeGuideId)
  const completedGuideIds = useSimulationStore((state) => state.completedGuideIds)
  const metrics = useSimulationStore((state) => state.metrics)
  const motorOutput = useSimulationStore((state) => state.motorOutput)
  const setLearnOpen = useSimulationStore((state) => state.setLearnOpen)
  const setActiveLesson = useSimulationStore((state) => state.setActiveLesson)
  const setActiveChallenge = useSimulationStore((state) => state.setActiveChallenge)
  const setActiveLearnTab = useSimulationStore((state) => state.setActiveLearnTab)
  const startGuidedLesson = useSimulationStore((state) => state.startGuidedLesson)

  const activeLesson = lessons.find((lesson) => lesson.id === activeLessonId) ?? lessons[0]
  const attitudeSse =
    Math.abs(formatRadiansAsDegrees(metrics.roll.steadyStateError)) +
    Math.abs(formatRadiansAsDegrees(metrics.pitch.steadyStateError))
  const hint =
    metrics.altitude.overshoot > 18
      ? "Large overshoot: reduce Kp or add Kd until the altitude trace stops ringing."
      : Math.abs(metrics.altitude.steadyStateError) > 0.15
        ? "Persistent offset: add a small Ki term, especially after payload changes."
        : motorOutput.saturated.some(Boolean)
          ? "Motor saturation: commanded thrust or torque exceeds available actuator authority."
          : attitudeSse > 8
            ? "Attitude error remains high: roll or pitch damping may be too low."
            : "Change one gain at a time and compare the chart shape before moving on."

  return (
    <>
      <aside className={`learn-panel ${open ? "open" : ""}`.trim()} aria-hidden={!open}>
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Interactive Course</h2>
            <p className="panel-subtitle">Guided control lessons tied to the running simulation.</p>
          </div>
          <Button icon={FiX} iconOnly onClick={() => setLearnOpen(false)}>
            Close
          </Button>
        </div>
        <div className="learn-body">
          <div className="tabs">
            <Tab value="lessons" activeValue={activeLearnTab} label="Course" onSelect={setActiveLearnTab} />
            <Tab value="challenges" activeValue={activeLearnTab} label="Challenges" onSelect={setActiveLearnTab} />
          </div>

          {activeLearnTab === "lessons" ? (
            <div className="course-shell" style={{ marginTop: 12 }}>
              <div className="course-intro">
                <span>Guided lab mode</span>
                <strong>Learn by flying, tuning, and proving stability.</strong>
                <p>Each session sets up the simulator, pauses at the right moment, highlights the control to use, then checks the learning action.</p>
              </div>

              <div className="course-list">
                {guidedLessons.map((guide) => {
                  const completed = completedGuideIds.includes(guide.id)
                  const active = activeGuideId === guide.id

                  return (
                    <button
                      className={`course-card ${active ? "active" : ""} ${completed ? "complete" : ""}`.trim()}
                      key={guide.id}
                      type="button"
                      onClick={() => startGuidedLesson(guide.id)}
                    >
                      <span className="course-stage">{guide.stage}</span>
                      <span className="course-card-body">
                        <strong>{guide.title}</strong>
                        <span>{guide.summary}</span>
                        <em>{guide.outcome}</em>
                      </span>
                      <span className="course-status">
                        {completed ? <FiCheckCircle aria-hidden="true" size={15} /> : <FiPlayCircle aria-hidden="true" size={15} />}
                        {completed ? "Done" : active ? "Running" : guide.duration}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="panel reference-panel">
                <div className="reference-head">
                  <div>
                    <h3 className="panel-title">Quick Reference</h3>
                    <p className="lesson-copy">Use this when you want the short theory note without launching a guided session.</p>
                  </div>
                </div>

                <div className="lesson-chip-list">
                  {lessons.map((lesson) => (
                    <button
                      className={`lesson-chip ${lesson.id === activeLesson.id ? "active" : ""}`.trim()}
                      key={lesson.id}
                      type="button"
                      onClick={() => setActiveLesson(lesson.id)}
                    >
                      {lesson.title}
                    </button>
                  ))}
                </div>

                <h3 className="panel-title" style={{ marginTop: 14 }}>
                  {activeLesson.title}
                </h3>
                <p className="lesson-copy">{activeLesson.body}</p>
                <div className="lesson-experiment-grid">
                  <div>
                    <strong>Do</strong>
                    {activeLesson.experiment.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  <div>
                    <strong>Watch</strong>
                    {activeLesson.observe.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </div>
                <div className="hint-box">{activeLesson.tryNext}</div>
                <Button variant="primary" onClick={() => runLessonScenario(activeLesson.id)} style={{ marginTop: 12 }}>
                  {activeLesson.actionLabel}
                </Button>
                <div className="hint-box">{hint}</div>
              </div>
            </div>
          ) : (
            <div className="challenge-list" style={{ marginTop: 12 }}>
              {challenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  active={challenge.id === activeChallengeId}
                  onSelect={() => setActiveChallenge(challenge.id)}
                  onSetup={() => setupChallenge(challenge.id)}
                />
              ))}
              <div className="hint-box">{hint}</div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
