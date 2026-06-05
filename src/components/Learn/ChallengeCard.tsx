import { FiCheckCircle } from "react-icons/fi"
import { GROUND_ALTITUDE } from "../../physics/constants"
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

  if (challenge.id === "payload-hover") {
    return store.payloadEnabled && store.elapsed > 2 && Math.abs(store.metrics.altitude.steadyStateError) < 0.16 && Math.abs(store.quadrotor.velocity[2]) < 0.3
  }

  if (challenge.id === "wind-recovery") {
    const attitudeError =
      Math.abs(formatRadiansAsDegrees(store.metrics.roll.steadyStateError)) +
      Math.abs(formatRadiansAsDegrees(store.metrics.pitch.steadyStateError))
    return Math.abs(store.metrics.altitude.steadyStateError) < 0.12 && attitudeError < 5 && store.motorFaultIndex === null
  }

  if (challenge.id === "yaw-zero") {
    const yawSettled = store.metrics.yaw.settlingTime !== null && store.metrics.yaw.settlingTime < 2.5
    return Math.abs(formatRadiansAsDegrees(store.metrics.yaw.steadyStateError)) < 2 && yawSettled && !store.motorOutput.saturated.some(Boolean)
  }

  if (challenge.id === "motor-fault-hover") {
    const attitudeError =
      Math.abs(formatRadiansAsDegrees(store.quadrotor.euler[0])) + Math.abs(formatRadiansAsDegrees(store.quadrotor.euler[1]))
    return store.motorFaultIndex !== null && store.elapsed > 2 && Math.abs(store.metrics.altitude.steadyStateError) < 0.24 && attitudeError < 14
  }

  if (challenge.id === "precision-landing") {
    const level = Math.abs(store.quadrotor.euler[0]) < 0.2 && Math.abs(store.quadrotor.euler[1]) < 0.2
    return store.elapsed > 2 && store.quadrotor.position[2] <= GROUND_ALTITUDE + 0.035 && Math.abs(store.quadrotor.velocity[2]) < 0.16 && level
  }

  return store.mission.status === "delivered"
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
