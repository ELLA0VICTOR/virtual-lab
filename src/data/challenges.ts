export type ChallengeId =
  | "altitude-step"
  | "payload-hover"
  | "wind-recovery"
  | "yaw-zero"
  | "motor-fault-hover"
  | "precision-landing"
  | "delivery-run"

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
    id: "payload-hover",
    title: "Payload Hover",
    description: "Carry extra mass and remove the long-term altitude offset.",
    criteria: ["Payload mass active", "Steady-state error below 0.16 m", "No sustained climb or sink"],
    setupLabel: "Setup payload hover",
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
  {
    id: "motor-fault-hover",
    title: "Motor Fault Hover",
    description: "Hold a controlled hover after one motor loses authority.",
    criteria: ["Motor fault active", "Altitude error below 0.24 m", "Attitude remains bounded"],
    setupLabel: "Setup motor fault",
  },
  {
    id: "precision-landing",
    title: "Precision Landing",
    description: "Descend onto the landing pad with low vertical speed.",
    criteria: ["Touches the floor clamp", "Vertical speed below 0.16 m/s", "Roll and pitch remain small"],
    setupLabel: "Setup landing",
  },
  {
    id: "delivery-run",
    title: "Payload Delivery",
    description: "Pick up the package and deliver it inside the stable drop window.",
    criteria: ["Package picked up", "Cargo carried to drop zone", "Drop registered as complete"],
    setupLabel: "Setup delivery",
  },
]
