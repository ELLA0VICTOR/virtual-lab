import { FiX } from "react-icons/fi"
import { degreesToRadians, formatRadiansAsDegrees } from "../../physics/vector"
import { challenges } from "../../data/challenges"
import { lessons, type LessonScenario } from "../../data/lessons"
import { gainPresets } from "../../simulation/presets"
import { useSimulationStore } from "../../simulation/simulationStore"
import { Button } from "../ui/Button"
import { Tab } from "../ui/Tab"
import { ChallengeCard } from "./ChallengeCard"

const presetId = (name: string): string => gainPresets.find((preset) => preset.id === name)?.id ?? "well-tuned"

const runLessonScenario = (scenario: LessonScenario): void => {
  const store = useSimulationStore.getState()
  store.resetDisturbances()

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

  store.setRunning(true)
}

const setupChallenge = (challengeId: string): void => {
  const store = useSimulationStore.getState()
  store.resetSimulation()
  store.loadPreset(presetId("well-tuned"))

  if (challengeId === "altitude-step") {
    store.setSetpoint("altitude", 2.4)
  }

  if (challengeId === "wind-recovery") {
    store.setSetpoint("altitude", 1.8)
    store.setRunning(true)
    window.setTimeout(() => useSimulationStore.getState().injectWind(), 360)
    return
  }

  if (challengeId === "yaw-zero") {
    store.setSetpoint("altitude", 1.8)
    store.setSetpoint("yaw", degreesToRadians(90))
  }

  store.setRunning(true)
}

export function LessonPanel() {
  const open = useSimulationStore((state) => state.learnOpen)
  const activeLessonId = useSimulationStore((state) => state.activeLessonId)
  const activeChallengeId = useSimulationStore((state) => state.activeChallengeId)
  const activeLearnTab = useSimulationStore((state) => state.activeLearnTab)
  const metrics = useSimulationStore((state) => state.metrics)
  const motorOutput = useSimulationStore((state) => state.motorOutput)
  const setLearnOpen = useSimulationStore((state) => state.setLearnOpen)
  const setActiveLesson = useSimulationStore((state) => state.setActiveLesson)
  const setActiveChallenge = useSimulationStore((state) => state.setActiveChallenge)
  const setActiveLearnTab = useSimulationStore((state) => state.setActiveLearnTab)

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
            <h2 className="panel-title">Learning Console</h2>
            <p className="panel-subtitle">PID cause and effect, tied to the running simulation.</p>
          </div>
          <Button icon={FiX} iconOnly onClick={() => setLearnOpen(false)}>
            Close
          </Button>
        </div>
        <div className="learn-body">
          <div className="tabs">
            <Tab value="lessons" activeValue={activeLearnTab} label="Lessons" onSelect={setActiveLearnTab} />
            <Tab value="challenges" activeValue={activeLearnTab} label="Challenges" onSelect={setActiveLearnTab} />
          </div>

          {activeLearnTab === "lessons" ? (
            <div className="lesson-list" style={{ marginTop: 12 }}>
              {lessons.map((lesson) => (
                <button
                  className={`lesson-card ${lesson.id === activeLesson.id ? "active" : ""}`.trim()}
                  key={lesson.id}
                  type="button"
                  onClick={() => setActiveLesson(lesson.id)}
                >
                  <strong>{lesson.title}</strong>
                  <span>{lesson.summary}</span>
                </button>
              ))}
              <div className="panel" style={{ marginTop: 4 }}>
                <h3 className="panel-title">{activeLesson.title}</h3>
                <p className="lesson-copy">{activeLesson.body}</p>
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
