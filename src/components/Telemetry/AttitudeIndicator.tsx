import { formatRadiansAsDegrees } from "../../physics/vector"
import { useSimulationStore } from "../../simulation/simulationStore"
import { Panel } from "../ui/Panel"

export function AttitudeIndicator() {
  const roll = useSimulationStore((state) => state.quadrotor.euler[0])
  const pitch = useSimulationStore((state) => state.quadrotor.euler[1])
  const rollDeg = formatRadiansAsDegrees(roll)
  const pitchDeg = formatRadiansAsDegrees(pitch)
  const pitchOffset = Math.max(-42, Math.min(42, pitchDeg * 1.2))

  return (
    <Panel title="Artificial Horizon" subtitle="Attitude indicator driven by the physics state.">
      <div className="attitude-wrap">
        <svg className="attitude-svg" viewBox="0 0 220 220" role="img" aria-label="Artificial horizon">
          <defs>
            <clipPath id="horizon-clip">
              <circle cx="110" cy="110" r="84" />
            </clipPath>
          </defs>
          <circle cx="110" cy="110" r="96" fill="#071012" stroke="rgba(230,242,239,0.2)" strokeWidth="2" />
          <g clipPath="url(#horizon-clip)" transform={`rotate(${-rollDeg} 110 110)`}>
            <rect x="10" y={-70 + pitchOffset} width="200" height="180" fill="#17313a" />
            <rect x="10" y={110 + pitchOffset} width="200" height="190" fill="#3d2d18" />
            <line x1="10" x2="210" y1={110 + pitchOffset} y2={110 + pitchOffset} stroke="#f6b44b" strokeWidth="3" />
            {[-40, -20, 20, 40].map((mark) => (
              <line
                key={mark}
                x1="78"
                x2="142"
                y1={110 + pitchOffset + mark}
                y2={110 + pitchOffset + mark}
                stroke="rgba(230,242,239,0.42)"
                strokeWidth="2"
              />
            ))}
          </g>
          <circle cx="110" cy="110" r="84" fill="none" stroke="rgba(230,242,239,0.38)" strokeWidth="2" />
          <path d="M66 110h34l10 10 10-10h34" fill="none" stroke="#37e39f" strokeWidth="4" strokeLinecap="round" />
          <path d="M110 32l8 15h-16z" fill="#37e39f" />
          <text x="110" y="197" textAnchor="middle" fill="#a8bab7" fontFamily="var(--font-telemetry)" fontSize="13">
            R {rollDeg.toFixed(0)} P {pitchDeg.toFixed(0)}
          </text>
        </svg>
      </div>
    </Panel>
  )
}
