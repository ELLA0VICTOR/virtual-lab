export type GuideId = "orientation" | "p-gain" | "d-damping" | "i-payload" | "delivery"

export type GuideAnchor = "scene" | "run" | "pilot" | "tune" | "charts" | "mission" | "presets" | "camera" | "none"

export type GuidePlacement = "left" | "right" | "top" | "bottom" | "center"

export type GuidePointerTarget =
  | "blueNose"
  | "package"
  | "runControls"
  | "pilotSticks"
  | "gainSliders"
  | "charts"
  | "missionControls"

export interface GuidePointer {
  target: GuidePointerTarget
  label: string
  arrow?: boolean
}

export type GuideAction =
  | "setupOrientation"
  | "enablePilot"
  | "startAxesDemo"
  | "setupLowP"
  | "setupOscillation"
  | "setupPayloadBias"
  | "setupMission"
  | "startMission"
  | "loadWellTuned"
  | "pause"

export type GuideValidation =
  | "pilotEnabled"
  | "simRunning"
  | "simObserved"
  | "oscillationObserved"
  | "gainsChanged"
  | "hoverStable"
  | "payloadActive"
  | "missionCarrying"
  | "missionDelivered"

export interface GuideStep {
  title: string
  body: string
  anchor: GuideAnchor
  placement?: GuidePlacement
  action?: GuideAction
  validation?: GuideValidation
  requirePass?: boolean
  callout?: string
  primaryLabel?: string
  pointers?: GuidePointer[]
}

export interface GuidedLesson {
  id: GuideId
  stage: string
  title: string
  summary: string
  outcome: string
  duration: string
  steps: GuideStep[]
}

export const guidedLessons: GuidedLesson[] = [
  {
    id: "orientation",
    stage: "01",
    title: "Flight Orientation",
    summary: "Learn what the scene, sticks, run controls, and plots mean before tuning.",
    outcome: "Explain lift, yaw, pitch, roll, setpoint, and measured response.",
    duration: "5 min",
    steps: [
      {
        title: "This Is The Lab Bench",
        body: "The drone is the plant. The PID controller is the brain. The graph is the evidence that shows whether the brain is controlling the plant well.",
        anchor: "scene",
        action: "setupOrientation",
        placement: "right",
        callout: "Blue nose = forward direction. The guard ring and package mission give the simulation a real flight task.",
        pointers: [{ target: "blueNose", label: "Blue nose points forward" }],
      },
      {
        title: "Run Control",
        body: "Use Run when you want the physics to move. Pause freezes the experiment so you can tune without fighting the drone.",
        anchor: "run",
        placement: "left",
        pointers: [{ target: "runControls", label: "Run, pause, step, reset" }],
      },
      {
        title: "Manual Pilot Inputs",
        body: "The left stick handles lift and yaw. The right stick handles pitch and roll. The keyboard arrows use the right-stick movement for quick control.",
        anchor: "pilot",
        action: "enablePilot",
        validation: "pilotEnabled",
        placement: "left",
        primaryLabel: "Pilot is ready",
        pointers: [{ target: "pilotSticks", label: "Two-stick flight input" }],
      },
      {
        title: "Watch A Controlled Step",
        body: "Now the drone will run a small attitude command. Watch how the measured line follows the target line instead of instantly jumping to it.",
        anchor: "charts",
        action: "startAxesDemo",
        validation: "simObserved",
        placement: "top",
        primaryLabel: "I saw the response",
        pointers: [{ target: "charts", label: "Measured value vs target" }],
      },
    ],
  },
  {
    id: "p-gain",
    stage: "02",
    title: "Proportional Gain Drill",
    summary: "See why low Kp feels lazy and why high Kp can overshoot.",
    outcome: "Tune Kp by comparing response speed against overshoot.",
    duration: "6 min",
    steps: [
      {
        title: "Start With A Lazy Controller",
        body: "Low proportional gain means the controller pushes gently even when the drone is far from the target.",
        anchor: "charts",
        action: "setupLowP",
        validation: "simObserved",
        placement: "top",
        primaryLabel: "Slow response observed",
        pointers: [{ target: "charts", label: "Slow climb curve" }],
      },
      {
        title: "Increase Altitude Kp",
        body: "Open the altitude row and increase Kp a little. The rise should become faster, but the graph may begin to overshoot if you go too far.",
        anchor: "tune",
        validation: "gainsChanged",
        requirePass: true,
        placement: "left",
        primaryLabel: "Gain changed",
        pointers: [{ target: "gainSliders", label: "Adjust altitude Kp" }],
      },
      {
        title: "Check The Tradeoff",
        body: "A good Kp is not the biggest Kp. It is the value that gives enough speed without turning the hover into a bounce.",
        anchor: "charts",
        validation: "hoverStable",
        placement: "top",
        primaryLabel: "Hover looks acceptable",
        pointers: [{ target: "charts", label: "Look for overshoot" }],
      },
    ],
  },
  {
    id: "d-damping",
    stage: "03",
    title: "Derivative Damping Drill",
    summary: "Use Kd as a brake when the response is too jumpy.",
    outcome: "Reduce ringing by adding derivative damping after Kp.",
    duration: "6 min",
    steps: [
      {
        title: "Create A Ringing Response",
        body: "This setup uses aggressive proportional gain with weak damping. The drone should climb quickly, overshoot, then ring around the target.",
        anchor: "charts",
        action: "setupOscillation",
        validation: "oscillationObserved",
        placement: "top",
        primaryLabel: "Oscillation visible",
        pointers: [{ target: "charts", label: "Ringing around target" }],
      },
      {
        title: "Add Kd Slowly",
        body: "Increase altitude Kd in small steps. Kd reacts to speed, so it works like a brake against fast error changes.",
        anchor: "tune",
        validation: "gainsChanged",
        requirePass: true,
        placement: "left",
        primaryLabel: "Kd adjusted",
        pointers: [{ target: "gainSliders", label: "Add damping with Kd" }],
      },
      {
        title: "Compare The Shape",
        body: "The best evidence is the curve: less ringing, less overshoot, and a cleaner settle near the setpoint.",
        anchor: "charts",
        validation: "hoverStable",
        placement: "top",
        primaryLabel: "Damping improved",
        pointers: [{ target: "charts", label: "Cleaner settling" }],
      },
    ],
  },
  {
    id: "i-payload",
    stage: "04",
    title: "Integral Payload Drill",
    summary: "Add payload mass and use Ki to remove long-term altitude error.",
    outcome: "Explain why integral action is useful when the drone carries extra load.",
    duration: "7 min",
    steps: [
      {
        title: "Add A Hidden Load",
        body: "The drone is now heavier. If the controller is not correcting long-term error well, it may hover below the target.",
        anchor: "charts",
        action: "setupPayloadBias",
        validation: "payloadActive",
        placement: "top",
        primaryLabel: "Payload active",
        pointers: [{ target: "charts", label: "Watch steady error" }],
      },
      {
        title: "Increase Ki Gently",
        body: "Ki accumulates error over time. Add a small amount to altitude Ki and wait. Too much Ki can build up and overshoot slowly.",
        anchor: "tune",
        validation: "gainsChanged",
        requirePass: true,
        placement: "left",
        primaryLabel: "Ki adjusted",
        pointers: [{ target: "gainSliders", label: "Add small Ki" }],
      },
      {
        title: "Look For Offset Removal",
        body: "The steady error should shrink. This is what Ki is for: removing the error that refuses to disappear after payload or bias.",
        anchor: "charts",
        validation: "hoverStable",
        placement: "top",
        primaryLabel: "Offset reduced",
        pointers: [{ target: "charts", label: "Offset should shrink" }],
      },
    ],
  },
  {
    id: "delivery",
    stage: "05",
    title: "Payload Delivery Assessment",
    summary: "Fly, pick up, tune if needed, and deliver the package to prove stability.",
    outcome: "Demonstrate stable control under a real mission objective.",
    duration: "10 min",
    steps: [
      {
        title: "Mission Scene Ready",
        body: "This assessment uses the package and drop zone. The drone must be stable enough to pick up and release inside the allowed hover window.",
        anchor: "mission",
        action: "setupMission",
        placement: "left",
        callout: "Start untuned on purpose. The goal is to feel the problem, then improve it.",
        pointers: [
          { target: "missionControls", label: "Mission status and buttons" },
          { target: "package", label: "Package starts here" },
        ],
      },
      {
        title: "Fly To The Package",
        body: "Run the simulator, approach slowly, and settle over the package below about one meter. When the pickup button becomes active, attach the cargo.",
        anchor: "pilot",
        action: "startMission",
        validation: "missionCarrying",
        placement: "left",
        primaryLabel: "Package picked up",
        pointers: [
          { target: "pilotSticks", label: "Use gentle pitch and roll" },
          { target: "package", label: "Settle over the package" },
        ],
      },
      {
        title: "Tune For Cargo",
        body: "Cargo increases required thrust. If the drone hunts or drifts while carrying it, tune altitude Kp, Ki, and Kd before attempting the drop.",
        anchor: "tune",
        validation: "gainsChanged",
        placement: "left",
        primaryLabel: "Tuning changed",
        pointers: [{ target: "gainSliders", label: "Retune under load" }],
      },
      {
        title: "Deliver The Payload",
        body: "Fly to the drop zone, settle, and release. A successful drop means your controller held a stable hover under load.",
        anchor: "mission",
        validation: "missionDelivered",
        placement: "left",
        primaryLabel: "Delivery complete",
        pointers: [{ target: "missionControls", label: "Drop only when stable" }],
      },
    ],
  },
]
