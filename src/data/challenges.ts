export type ChallengeId = "altitude-step" | "wind-recovery" | "yaw-zero"

export interface Challenge {
  id: ChallengeId
  title: string
  description: string
  criteria: string[]
  setupLabel: string
}

export const challenges: Challenge[] = [
  {
    id: "altitude-step",
    title: "Altitude Step",
    description: "Tune altitude PID for a clean 1.8 m step response.",
    criteria: ["Overshoot below 10%", "Settling time below 2.0 s", "Steady-state error below 0.08 m"],
    setupLabel: "Setup altitude step",
  },
  {
    id: "wind-recovery",
    title: "Wind Recovery",
    description: "Recover from a lateral gust without sustained attitude oscillation.",
    criteria: ["Altitude error below 0.12 m", "Roll plus pitch error below 5 deg", "No active motor fault"],
    setupLabel: "Inject gust",
  },
  {
    id: "yaw-zero",
    title: "Yaw Capture",
    description: "Reach a heading command with negligible steady-state yaw error.",
    criteria: ["Yaw steady-state error below 2 deg", "Yaw settling time below 2.5 s", "Motor saturation cleared"],
    setupLabel: "Setup yaw step",
  },
]
