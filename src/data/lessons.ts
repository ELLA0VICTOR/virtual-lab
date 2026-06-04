export type LessonScenario = "axes" | "p-term" | "i-term" | "d-term" | "underactuated" | "mission"

export interface Lesson {
  id: LessonScenario
  title: string
  summary: string
  body: string
  experiment: string[]
  observe: string[]
  tryNext: string
  actionLabel: string
}

export const lessons: Lesson[] = [
  {
    id: "axes",
    title: "Axes and Inputs",
    summary: "Roll tilts left-right, pitch tilts fore-aft, yaw rotates heading, and thrust controls climb.",
    body: "A quadrotor does not slide like a car. It first tilts, then its thrust vector points slightly sideways, and that sideways component creates motion.",
    experiment: ["Switch to top camera.", "Use the right stick or arrows for small pitch and roll commands.", "Use yaw to rotate the blue nose marker, then pitch again."],
    observe: ["Pitch follows the blue nose direction.", "Roll moves sideways relative to the drone body.", "After centering the stick, momentum keeps the drone drifting briefly."],
    tryNext: "Brake by commanding the opposite pitch or roll for a short moment.",
    actionLabel: "Try attitude step",
  },
  {
    id: "p-term",
    title: "Proportional Gain",
    summary: "P fights current error. More P feels responsive, but too much creates overshoot.",
    body: "The proportional term reacts to present error. It is the part that says: the farther I am from the target, the harder I should push.",
    experiment: ["Run the high-P demo.", "Open Tune and reduce altitude Kp by small steps.", "Then increase Kp again until the graph starts ringing."],
    observe: ["Low Kp responds slowly.", "Higher Kp rises faster.", "Too much Kp overshoots and oscillates."],
    tryNext: "Find the highest Kp that still feels controllable before adding more damping.",
    actionLabel: "Demo high P",
  },
  {
    id: "i-term",
    title: "Integral Gain",
    summary: "I removes steady offset after payload or bias, but it can wind up.",
    body: "The integral term reacts to error that refuses to go away. It slowly builds a correction, which is useful when payload mass makes the drone sit below the target.",
    experiment: ["Run the payload demo.", "Watch altitude stay low when the controller is biased by extra mass.", "Increase Ki gently and compare the steady-state error."],
    observe: ["Ki reduces long-term altitude error.", "Too much Ki causes slow overshoot.", "After payload pickup, Ki helps recover hover height."],
    tryNext: "Add only a little Ki at a time; wait for the graph before changing it again.",
    actionLabel: "Demo payload",
  },
  {
    id: "d-term",
    title: "Derivative Gain",
    summary: "D damps motion by reacting to rate of change, reducing oscillation.",
    body: "The derivative term reacts to how fast the error is changing. In simple words, it behaves like a brake against fast motion.",
    experiment: ["Run the damping demo.", "Increase altitude Kp until the trace overshoots.", "Raise Kd and watch whether the ringing reduces."],
    observe: ["Kd reduces bounce.", "Too little Kd lets the drone ring.", "Too much Kd can make the response feel heavy or noisy."],
    tryNext: "Tune Kp for response first, then use Kd to calm it down.",
    actionLabel: "Demo damping",
  },
  {
    id: "underactuated",
    title: "Under-actuated Flight",
    summary: "Six degrees of freedom are controlled by four inputs, so attitude and altitude are coupled.",
    body: "A quadrotor has six motions but only four motor commands. This means altitude and attitude are linked: when the drone tilts to move, some upward lift is spent on sideways motion.",
    experiment: ["Run the coupled flight demo.", "Watch altitude while roll and pitch are commanded.", "Compare motor bars when the drone is tilted versus level."],
    observe: ["Tilting can reduce available vertical lift.", "The altitude loop adds thrust to compensate.", "Large tilt can push motors toward saturation."],
    tryNext: "Use small tilt commands during payload delivery to leave enough thrust for stable hover.",
    actionLabel: "Try coupled step",
  },
  {
    id: "mission",
    title: "Payload Mission",
    summary: "Pickup and delivery test whether tuning remains stable when the drone becomes heavier.",
    body: "The mission is a practical control test. A controller that looks acceptable during hover may struggle once the package adds mass and the drone must settle over the drop zone.",
    experiment: ["Start with Untuned Start and attempt pickup.", "Switch to Tune and improve altitude damping.", "Try the same pickup and drop with Well Tuned for comparison."],
    observe: ["Cargo increases required thrust.", "Poor gains make the package release window harder to satisfy.", "A stable hover matters more than fast movement near the drop zone."],
    tryNext: "Tune until package pickup and release become repeatable, not just lucky once.",
    actionLabel: "Setup mission hover",
  },
]
