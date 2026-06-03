export type LessonScenario = "axes" | "p-term" | "i-term" | "d-term" | "underactuated"

export interface Lesson {
  id: LessonScenario
  title: string
  summary: string
  body: string
  actionLabel: string
}

export const lessons: Lesson[] = [
  {
    id: "axes",
    title: "Axes and Inputs",
    summary: "Roll tilts left-right, pitch tilts fore-aft, yaw rotates heading, and thrust controls climb.",
    body: "A quadrotor is under-actuated: four motor speeds must control position and attitude. The attitude loops tilt the thrust vector, so lateral motion is created by borrowing vertical lift.",
    actionLabel: "Try attitude step",
  },
  {
    id: "p-term",
    title: "Proportional Gain",
    summary: "P fights current error. More P feels responsive, but too much creates overshoot.",
    body: "Load an aggressive proportional preset and watch the altitude chart. The drone reacts quickly, then crosses the setpoint because the controller has no strong damping.",
    actionLabel: "Demo high P",
  },
  {
    id: "i-term",
    title: "Integral Gain",
    summary: "I removes steady offset after payload or bias, but it can wind up.",
    body: "Add payload mass and compare low integral action with a tuned preset. The integral term accumulates persistent error until the thrust bias is corrected.",
    actionLabel: "Demo payload",
  },
  {
    id: "d-term",
    title: "Derivative Gain",
    summary: "D damps motion by reacting to rate of change, reducing oscillation.",
    body: "A sluggish preset shows heavy damping. Increase proportional action gradually and use derivative gain to keep the response from ringing.",
    actionLabel: "Demo damping",
  },
  {
    id: "underactuated",
    title: "Under-actuated Flight",
    summary: "Six degrees of freedom are controlled by four inputs, so attitude and altitude are coupled.",
    body: "Command roll and pitch while holding altitude. The altitude PID must compensate for the tilted thrust vector, and saturation becomes visible if motors run out of authority.",
    actionLabel: "Try coupled step",
  },
]
