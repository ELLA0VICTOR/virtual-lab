import { FiCheckCircle } from "react-icons/fi"
import { formatRadiansAsDegrees } from "../../physics/vector"
import { useSimulationStore } from "../../simulation/simulationStore"
import type { Challenge } from "../../data/challenges"

interface ChallengeCardProps {
  challenge: Challenge
  active: boolean
  onSelect: () => void
  onSetup: () => void
}

const isPassed = (challenge: Challenge, store: ReturnType<typeof useSimulationStore.getState>): boolean => {
  if (challenge.id === "altitude-step") {
    const metrics = store.metrics.altitude
    return (
      metrics.overshoot < 10 &&
      metrics.settlingTime !== null &&
      metrics.settlingTime < 2 &&
      Math.abs(metrics.steadyStateError) < 0.08
    )
  }

  if (challenge.id === "wind-recovery") {
    const attitudeError =
      Math.abs(formatRadiansAsDegrees(store.metrics.roll.steadyStateError)) +
      Math.abs(formatRadiansAsDegrees(store.metrics.pitch.steadyStateError))
    return Math.abs(store.metrics.altitude.steadyStateError) < 0.12 && attitudeError < 5 && store.motorFaultIndex === null
  }

  const yawSettled = store.metrics.yaw.settlingTime !== null && store.metrics.yaw.settlingTime < 2.5
  return Math.abs(formatRadiansAsDegrees(store.metrics.yaw.steadyStateError)) < 2 && yawSettled && !store.motorOutput.saturated.some(Boolean)
}

export function ChallengeCard({ challenge, active, onSelect, onSetup }: ChallengeCardProps) {
  const passed = useSimulationStore((state) => isPassed(challenge, state))

  return (
    <div className={`challenge-card ${active ? "active" : ""}`.trim()}>
      <button className="lesson-row" type="button" onClick={onSelect}>
        <strong>{challenge.title}</strong>
        {passed ? <FiCheckCircle aria-hidden="true" color="var(--success)" /> : null}
      </button>
      <span>{challenge.description}</span>
      <div className="lesson-copy">
        {challenge.criteria.map((criterion) => (
          <p key={criterion}>{criterion}</p>
        ))}
      </div>
      <button className="button" type="button" onClick={onSetup} style={{ marginTop: 10 }}>
        {challenge.setupLabel}
      </button>
      {passed ? (
        <div className="success-line">
          <FiCheckCircle aria-hidden="true" /> Criteria met
        </div>
      ) : null}
    </div>
  )
}
