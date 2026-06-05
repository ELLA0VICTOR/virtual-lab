export type GuideId =
  | "orientation"
  | "manual-flight"
  | "tracking"
  | "p-gain"
  | "d-damping"
  | "i-payload"
  | "coupled-flight"
  | "yaw-control"
  | "wind-recovery"
  | "motor-fault"
  | "precision-landing"
  | "delivery"

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
  | "scenarioTarget"

export interface GuidePointer {
  target: GuidePointerTarget
  label: string
  arrow?: boolean
}

export type GuideAction =
  | "setupOrientation"
  | "enablePilot"
  | "setupManualFlight"
  | "startAxesDemo"
  | "setupTrackingStep"
  | "setupLowP"
  | "setupOscillation"
  | "setupPayloadBias"
  | "setupCoupledFlight"
  | "setupYawAlign"
  | "setupWindRecovery"
  | "setupMotorFault"
  | "setupPrecisionLanding"
  | "setupMission"
  | "startMission"
  | "loadWellTuned"
  | "pause"

export type GuideValidation =
  | "pilotEnabled"
  | "simRunning"
  | "simObserved"
  | "manualFlightObserved"
  | "altitudeSettled"
  | "oscillationObserved"
  | "gainsChanged"
  | "hoverStable"
  | "payloadActive"
  | "couplingObserved"
  | "yawAligned"
  | "windRecovered"
  | "motorFaultObserved"
  | "safeLanding"
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
    summary: "Meet the drone, blue nose, axes, controls, and evidence plots.",
    outcome: "Explain lift, yaw, pitch, roll, setpoint, and measured response.",
    duration: "5 min",
    steps: [
      {
        title: "This Is The Lab Bench",
        body: "The drone is the plant. The PID controller is the brain. The graphs are the evidence that show whether the brain is controlling the plant well.",
        anchor: "scene",
        action: "setupOrientation",
        placement: "right",
        callout: "The blue nose shows forward direction. Pitch follows that nose; roll moves sideways relative to the drone body.",
        pointers: [{ target: "blueNose", label: "Blue nose points forward" }],
      },
      {
        title: "Run Control",
        body: "Run lets the physics move. Pause freezes the experiment so a student can tune or explain the result without fighting the aircraft.",
        anchor: "run",
        placement: "left",
        pointers: [{ target: "runControls", label: "Run, pause, step, reset" }],
      },
      {
        title: "Two-Stick Control",
        body: "The left stick handles lift and yaw. The right stick handles pitch and roll. Keyboard uses W/A/S/D for the left stick and arrow keys for the right stick.",
        anchor: "pilot",
        action: "enablePilot",
        validation: "pilotEnabled",
        placement: "left",
        primaryLabel: "Pilot is ready",
        pointers: [{ target: "pilotSticks", label: "Pilot input" }],
      },
      {
        title: "Watch A Controlled Step",
        body: "The simulator will command a small altitude, roll, and pitch change. Watch the measured lines chase the target lines instead of instantly jumping.",
        anchor: "charts",
        action: "startAxesDemo",
        validation: "simObserved",
        placement: "top",
        primaryLabel: "I saw the response",
        pointers: [{ target: "charts", label: "Measured vs target" }],
      },
    ],
  },
  {
    id: "manual-flight",
    stage: "02",
    title: "Manual Flight Drill",
    summary: "Use keyboard, virtual sticks, or gamepad to hold a hover target.",
    outcome: "Show that real pilot input changes setpoints while PID stabilizes the drone.",
    duration: "6 min",
    steps: [
      {
        title: "Enter The Hover Zone",
        body: "This lesson opens a green hover target. Turn Pilot On, run the simulator, and use gentle controls to keep the drone inside the ring.",
        anchor: "pilot",
        action: "setupManualFlight",
        validation: "pilotEnabled",
        placement: "left",
        primaryLabel: "Pilot is ready",
        pointers: [
          { target: "pilotSticks", label: "Fly gently" },
          { target: "scenarioTarget", label: "Hover zone" },
        ],
      },
      {
        title: "Move Without Fighting It",
        body: "Small pitch and roll commands tilt the drone. When you release the stick, PID levels the body, but momentum may keep it drifting for a moment.",
        anchor: "scene",
        validation: "manualFlightObserved",
        requirePass: true,
        placement: "right",
        primaryLabel: "Manual motion seen",
        pointers: [{ target: "scenarioTarget", label: "Return here" }],
      },
      {
        title: "Hold A Stable Hover",
        body: "Settle inside the hover zone. A good pilot input is smooth, not forceful; let the controller do the stabilizing work.",
        anchor: "charts",
        validation: "hoverStable",
        placement: "top",
        primaryLabel: "Hover is stable",
        pointers: [{ target: "charts", label: "Low error, low speed" }],
      },
    ],
  },
  {
    id: "tracking",
    stage: "03",
    title: "Setpoint Tracking Lab",
    summary: "See the difference between desired altitude and measured altitude.",
    outcome: "Read rise time, overshoot, settling, and steady-state error from the response.",
    duration: "6 min",
    steps: [
      {
        title: "Command A New Altitude",
        body: "A purple target appears above the floor. The setpoint is the desired height; the measured response is what the drone actually does.",
        anchor: "charts",
        action: "setupTrackingStep",
        validation: "simObserved",
        placement: "top",
        primaryLabel: "Response visible",
        pointers: [
          { target: "scenarioTarget", label: "Desired height" },
          { target: "charts", label: "Response curve" },
        ],
      },
      {
        title: "Name The Shape",
        body: "Rise time is how quickly it climbs. Overshoot is how far it goes beyond the target. Settling time is when it finally stays close. Steady-state error is the final leftover error.",
        anchor: "charts",
        validation: "altitudeSettled",
        placement: "top",
        primaryLabel: "It settled",
        pointers: [{ target: "charts", label: "Read the shape" }],
      },
    ],
  },
  {
    id: "p-gain",
    stage: "04",
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
        body: "Open the altitude row and increase Kp a little. The rise should become faster, but it may overshoot if Kp becomes too large.",
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
    stage: "05",
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
    stage: "06",
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
    id: "coupled-flight",
    stage: "07",
    title: "Coupled Flight Lab",
    summary: "Learn why a quadrotor must tilt before it can move sideways.",
    outcome: "Explain why altitude, pitch, and roll are connected during flight.",
    duration: "6 min",
    steps: [
      {
        title: "Tilt Uses Some Lift",
        body: "This setup commands roll and pitch while holding altitude. When the drone tilts, some thrust points sideways, so altitude control must add more thrust.",
        anchor: "scene",
        action: "setupCoupledFlight",
        validation: "couplingObserved",
        placement: "right",
        primaryLabel: "Coupling visible",
        pointers: [
          { target: "blueNose", label: "Forward body axis" },
          { target: "scenarioTarget", label: "Hold height" },
        ],
      },
      {
        title: "Watch Motors And Graphs",
        body: "If the tilt is too large, motor demand rises. That is why heavy payload flight should use gentle pitch and roll.",
        anchor: "charts",
        validation: "simObserved",
        placement: "top",
        primaryLabel: "Graphs checked",
        pointers: [{ target: "charts", label: "Altitude and attitude" }],
      },
    ],
  },
  {
    id: "yaw-control",
    stage: "08",
    title: "Yaw Heading Drill",
    summary: "Turn the blue nose to a target heading without losing hover.",
    outcome: "Explain yaw as heading control and read yaw error on the graph.",
    duration: "5 min",
    steps: [
      {
        title: "Aim At The Yaw Arrow",
        body: "The yaw target is a heading, not a position. Use A/D, the left stick, or the yaw setpoint to rotate the blue nose toward the arrow.",
        anchor: "pilot",
        action: "setupYawAlign",
        validation: "pilotEnabled",
        placement: "left",
        primaryLabel: "Controls ready",
        pointers: [
          { target: "pilotSticks", label: "Yaw input" },
          { target: "scenarioTarget", label: "Yaw target" },
        ],
      },
      {
        title: "Hold The Heading",
        body: "When the measured yaw is close to the target yaw, the heading error should shrink. The drone can still hover while rotating.",
        anchor: "charts",
        validation: "yawAligned",
        requirePass: true,
        placement: "top",
        primaryLabel: "Yaw aligned",
        pointers: [{ target: "charts", label: "Yaw error" }],
      },
    ],
  },
  {
    id: "wind-recovery",
    stage: "09",
    title: "Wind Disturbance Lab",
    summary: "Recover from a gust and prove the controller rejects disturbance.",
    outcome: "Explain disturbance rejection using error and settling behavior.",
    duration: "7 min",
    steps: [
      {
        title: "A Gust Will Hit The Drone",
        body: "The drone starts in a hover zone, then a lateral wind gust pushes it. The controller should recover after the disturbance ends.",
        anchor: "scene",
        action: "setupWindRecovery",
        validation: "simObserved",
        placement: "right",
        primaryLabel: "Gust observed",
        pointers: [{ target: "scenarioTarget", label: "Recover here" }],
      },
      {
        title: "Tune For Rejection",
        body: "If it wobbles for too long, adjust damping and proportional gains. The target is not zero movement; it is a clean recovery.",
        anchor: "tune",
        validation: "gainsChanged",
        placement: "left",
        primaryLabel: "Tune changed",
        pointers: [{ target: "gainSliders", label: "Retune after gust" }],
      },
      {
        title: "Prove Recovery",
        body: "The pass condition checks that altitude error and vertical speed are back under control after the gust has finished.",
        anchor: "charts",
        validation: "windRecovered",
        requirePass: true,
        placement: "top",
        primaryLabel: "Recovered",
        pointers: [{ target: "charts", label: "Error settles" }],
      },
    ],
  },
  {
    id: "motor-fault",
    stage: "10",
    title: "Motor Limit Lab",
    summary: "See what actuator saturation and motor weakness do to stability.",
    outcome: "Explain why a controller cannot command more thrust than motors can produce.",
    duration: "6 min",
    steps: [
      {
        title: "One Motor Is Weakened",
        body: "A motor fault reduces available thrust on one rotor. The controller will try to compensate, but motor bars may saturate.",
        anchor: "charts",
        action: "setupMotorFault",
        validation: "motorFaultObserved",
        placement: "top",
        primaryLabel: "Fault observed",
        pointers: [{ target: "charts", label: "Look for saturation" }],
      },
      {
        title: "Recover With Conservative Flight",
        body: "Large tilt commands become dangerous when one motor is weak. A stable controller should keep commands modest and avoid aggressive moves.",
        anchor: "pilot",
        validation: "hoverStable",
        placement: "left",
        primaryLabel: "Hover controlled",
        pointers: [{ target: "pilotSticks", label: "Small inputs only" }],
      },
    ],
  },
  {
    id: "precision-landing",
    stage: "11",
    title: "Precision Landing Drill",
    summary: "Descend onto the pad without sinking through the floor or bouncing.",
    outcome: "Demonstrate low vertical speed and stable attitude near touchdown.",
    duration: "6 min",
    steps: [
      {
        title: "Line Up With The Pad",
        body: "The green landing pad is the target. Use pitch and roll gently, then lower altitude with W/S or the left stick.",
        anchor: "scene",
        action: "setupPrecisionLanding",
        validation: "pilotEnabled",
        placement: "right",
        primaryLabel: "Pilot ready",
        pointers: [
          { target: "pilotSticks", label: "Descend slowly" },
          { target: "scenarioTarget", label: "Landing pad" },
        ],
      },
      {
        title: "Touch Down Softly",
        body: "A safe landing means the drone reaches the floor clamp with low vertical speed and small attitude angles.",
        anchor: "charts",
        validation: "safeLanding",
        requirePass: true,
        placement: "top",
        primaryLabel: "Landed safely",
        pointers: [{ target: "charts", label: "Low vertical rate" }],
      },
    ],
  },
  {
    id: "delivery",
    stage: "12",
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
        callout: "Start untuned on purpose. The goal is to feel the problem, improve it, then complete the mission repeatably.",
        pointers: [
          { target: "missionControls", label: "Mission status and buttons" },
          { target: "package", label: "Package starts here" },
        ],
      },
      {
        title: "Fly To The Package",
        body: "Run the simulator, approach slowly, and settle over the package below about one meter. Use Space or Pick Up when it becomes active.",
        anchor: "pilot",
        action: "startMission",
        validation: "missionCarrying",
        placement: "left",
        primaryLabel: "Package picked up",
        pointers: [
          { target: "pilotSticks", label: "Use gentle pitch and roll" },
          { target: "package", label: "Settle over package" },
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
        pointers: [{ target: "missionControls", label: "Drop when stable" }],
      },
    ],
  },
]
