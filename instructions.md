# MASTER BUILD PROMPT — Quadrotor Virtual Lab (Web-Based Engineering Simulation)

## 0. ROLE & MISSION

You are a senior front-end + simulation engineer. Build a **production-quality, web-based virtual laboratory** that simulates a **quadrotor (quadcopter) drone** with **physically accurate flight dynamics**, **PID control tuning**, **real-time 3D visualization**, and **live response charts**. This is a final-year Mechatronics Engineering project for the Federal University of Technology, Minna. It will be **embedded via `<iframe>`** into an existing Engineering LMS.

The single most important rule: **this must feel real, not like a demo.** Real physics. A realistic drone model (not floating cubes). Real engineering charts. Students must be able to *learn control theory* by tuning the PID gains and watching cause → effect.

Do NOT cut corners. Do NOT stub the physics. Do NOT ship placeholder shapes for the drone.

---

## 1. STEP ONE — STEAL THE DESIGN LANGUAGE (DO THIS FIRST)

Before writing any code, **visit this URL and inspect it**: `https://academiq-five.vercel.app/start`

Extract and document (in a file `DESIGN_TOKENS.md`) the host LMS's:
- **Exact font families** (headings + body) — check `<link>` tags, `@font-face`, and computed `font-family`.
- **Color palette** — primary, secondary, background, surface, text, accent, borders. Pull the actual hex/HSL values from CSS variables or computed styles.
- **Border radius scale, spacing rhythm, shadow style.**
- **Overall mood** (is it dark? light? warm? technical?).

Our virtual lab MUST visually belong inside that LMS so the iframe feels native, not bolted-on. Map everything you extract into CSS variables in our own `theme.css`. If a value cannot be extracted, choose something that harmonizes — never default to generic.

---

## 2. TECH STACK (NON-NEGOTIABLE)

- **Vite** + **React** + **TypeScript** (strict mode on)
- **Tailwind CSS** for layout/utility styling, driven by CSS variables from the extracted theme
- **Three.js** (via `three` + `@react-three/fiber` + `@react-three/drei`) for the 3D drone scene
- **uPlot** (preferred for performance) OR `lightweight-charts`/custom canvas for real-time plotting — NOT a heavy chart lib that lags during 60fps updates
- **react-icons** OR hand-authored inline SVGs for all iconography
- **Zustand** for simulation state management (keep React re-renders cheap; physics must not be throttled by React)
- The host LMS is Next.js, but **this module is standalone Vite + TS** — it deploys independently and embeds via iframe. That is fine and intended (per the project's iframe-integration design).

---

## 3. AESTHETIC DIRECTION — AVOID "AI SLOP" AT ALL COSTS

This is a hard requirement. Generic output = failure.

**Forbidden:**
- Purple/blue gradients on white. Any lazy gradient as a hero background.
- Emojis anywhere in the UI.
- Overused fonts: Inter, Roboto, Arial, system-ui defaults, **and especially Space Grotesk** (you over-rely on it — do not use it).
- Cookie-cutter card grids with evenly distributed pastel colors.
- Glassmorphism clichés used without purpose.

**Required:**
- **Typography:** Choose a *distinctive, technical/instrument-panel* pairing that still harmonizes with the extracted LMS fonts. Think aerospace telemetry / engineering-IDE energy — e.g. a precise grotesque or monospace for data readouts (consider `JetBrains Mono`, `IBM Plex Mono`, `Space Mono`, `Geist Mono`, or `Söhne`-like alternatives) paired with a clean editorial sans for prose. Use the **mono face for all numeric telemetry** (gains, angles, altitude, errors) — it should read like a real flight console.
- **Color & Theme:** Commit to ONE cohesive aesthetic — a dark "cockpit/telemetry" theme works best for a flight lab (deep charcoal/navy surfaces, a single sharp accent for live data — e.g. amber, cyan, or signal-green — and restrained color elsewhere). Dominant base + sharp accent beats a timid rainbow. Drive everything from CSS variables.
- **Backgrounds:** Build atmosphere with subtle layered depth — fine grid/blueprint texture, faint scanline or vignette, a subtle radial glow behind the 3D viewport. Never a flat solid void.
- **Motion:** One orchestrated page-load reveal with **staggered `animation-delay`** (panels slide/fade in sequence). Micro-interactions on sliders, buttons, toggles. CSS-first; use motion only where it adds clarity (e.g. a value "pulse" when a metric updates). Never gratuitous.
- Iconography: react-icons or custom SVG only. Crisp, line-based, technical.

The end result should make the supervisor think *"this looks like real avionics software,"* not *"this looks like a Bootstrap template."*

---

## 4. PROJECT ARCHITECTURE (SPLIT THE WORK — DO NOT DUMP EVERYTHING IN App.tsx)

Use a clean, modular folder structure. `App.tsx` only composes layout. All logic, physics, and UI live in dedicated files.

src/
main.tsx
App.tsx                      # layout composition only
theme.css                    # CSS vars from extracted LMS tokens
index.css                    # tailwind + base + animations
physics/
quadrotor.ts               # 6-DOF rigid-body dynamics (Newton-Euler)
pidController.ts           # reusable PID class with anti-windup
motorMixer.ts              # maps thrust+torques -> 4 motor speeds
constants.ts               # mass, arm length, inertia, drag, g, etc.
integrator.ts              # fixed-step RK4 integrator
types.ts                   # State, Inputs, Gains interfaces
metrics.ts                 # rise time, overshoot, settling time, SSE
simulation/
useSimulationLoop.ts       # fixed-timestep loop (decoupled from render)
simulationStore.ts         # Zustand store (state, gains, setpoints, history)
presets.ts                 # tuned / underdamped / overdamped / unstable gain sets
disturbances.ts            # wind gust, payload mass change, motor failure
scene/
DroneScene.tsx             # r3f Canvas + lights + environment + camera
Quadrotor.tsx              # realistic drone model + spinning props
Environment.tsx            # ground grid, sky/atmosphere, shadows
SetpointMarker.tsx         # target altitude/attitude indicator
TrajectoryTrail.tsx        # fading path the drone has flown
components/
ControlPanel/
GainSliders.tsx          # Kp/Ki/Kd sliders per axis
SetpointControls.tsx     # target altitude, roll, pitch, yaw
SimToolbar.tsx           # play / pause / reset / step / speed
DisturbancePanel.tsx     # inject wind, payload, motor fault
PresetSelector.tsx
Telemetry/
LiveChart.tsx            # uPlot wrapper, ring-buffer fed
MetricsCard.tsx          # overshoot / settling time / SSE readouts
AttitudeIndicator.tsx    # artificial horizon (SVG)
MotorBars.tsx            # 4 live motor-output bars
Learn/
LessonPanel.tsx          # guided explanations + tasks
ChallengeCard.tsx        # tuning challenges w/ pass criteria
ui/
Slider.tsx Button.tsx Panel.tsx Tab.tsx Badge.tsx Tooltip.tsx
data/
lessons.ts                 # structured learning content
challenges.ts              # graded tuning challenges
Reusable components must be genuinely reusable and typed. No giant files.

---

## 5. THE PHYSICS — THIS IS THE CORE. GET IT RIGHT.

Implement **full 6-DOF rigid-body quadrotor dynamics** using the **Newton-Euler formulation** (as described in the project's literature: Yeung et al., 2024). This is what makes it "the real deal."

### 5.1 State vector
- Position `p = [x, y, z]` (world frame, z = altitude up)
- Linear velocity `v = [vx, vy, vz]`
- Orientation: Euler angles `[φ roll, θ pitch, ψ yaw]` (also maintain a rotation matrix/quaternion to avoid gimbal issues in the 3D render)
- Angular velocity `ω = [p, q, r]` (body frame)

### 5.2 Configuration
- **"X" or "+" quad layout**, 4 rotors. Use plus-config for intuitive roll/pitch mapping, or X-config (more realistic) — document the mixer either way.
- Each rotor `i` produces thrust `Tᵢ = k_f · ωᵢ²` and reaction torque `Qᵢ = k_m · ωᵢ²`.

### 5.3 Forces & torques (Newton-Euler)
Translational:
m · v̇ = R(φ,θ,ψ) · [0, 0, ΣTᵢ]ᵀ  −  [0, 0, m·g]ᵀ  −  drag·v
Rotational (body frame):
I · ω̇ = τ_control  −  ω × (I · ω)  −  rotor_gyroscopic_terms (optional)
where `τ_control = [Lk_f(...), Lk_f(...), k_m(...)]` derived from the motor mixer, `L` = arm length, `I = diag(Ixx, Iyy, Izz)`.

Use **realistic physical constants** in `constants.ts` (mass ~1.0–1.5 kg, arm length ~0.2 m, sensible Ixx/Iyy/Izz, kf/km, g = 9.81). Cite that these are typical small-quad parameters in a comment.

### 5.4 Integration
- **Fixed timestep RK4** at e.g. `dt = 0.002s` (500 Hz physics), stepped multiple times per render frame.
- Physics loop runs in `useSimulationLoop.ts`, decoupled from React render and from the 3D frame rate. Render just reads latest state.
- Support a **simulation speed multiplier** (0.25× … 4×) and **single-step** mode for teaching.

### 5.5 Control — cascaded PID
Implement independent PID controllers (the heart of the lab):
- **Altitude** (z) → total thrust
- **Roll (φ)**, **Pitch (θ)**, **Yaw (ψ)** → respective torques
Each PID has user-tunable `Kp, Ki, Kd`. Include:
- **Integral anti-windup** (clamping)
- **Derivative on measurement** (avoid derivative kick) — or filtered derivative
- Output saturation matching real motor limits
The PID outputs feed `motorMixer.ts`, which converts desired thrust + 3 torques into 4 individual motor commands, each clamped to `[ω_min, ω_max]`. **Motor saturation must be visible** in the sim (e.g. when a motor maxes out, the drone can't hold attitude — a real, teachable behavior).

### 5.6 Disturbances (for real learning)
- **Wind gust**: impulse/step lateral force.
- **Payload change**: increase mass mid-flight → watch altitude PID fight it.
- **Motor fault**: degrade one motor → instability.
These let students *see* why integral term kills steady-state error, why too much derivative causes noise sensitivity, etc.

---

## 6. THE 3D DRONE — REALISTIC, NOT SHAPES

Render in the `scene/` modules with `@react-three/fiber`.

**Model:** Load a real quadrotor **GLTF/GLB model** (use a free, license-clear model — search Poly Pizza / Sketchfab CC0 / Khronos sample assets — place it in `public/models/`). If no suitable GLB is bundled, build a **convincingly detailed procedural drone**: carbon-fiber-look frame (dark PBR material with roughness/metalness), four motor pods, four **props that actually spin at a rate proportional to each motor's ω** (with subtle motion blur / transparency at high RPM), landing gear, and small **navigation LEDs** (green front, red rear) that glow.

**Scene quality:**
- Proper PBR lighting: a key directional light casting **soft shadows**, ambient/hemisphere fill, optional environment map for reflections.
- A **ground plane with a technical grid** (blueprint feel), receiving shadows.
- The drone's **position and orientation are driven directly by the physics state** every frame — roll/pitch/yaw and altitude must match the simulation exactly.
- **OrbitControls** so students can rotate/zoom. Add quick camera presets (Follow, Top, Side, Free).
- **Trajectory trail**: a fading line tracing where the drone has flown.
- **Setpoint marker**: a translucent target showing commanded altitude/attitude.
- Smooth, no jank at 60fps. Props spin, LEDs blink, shadow tracks the drone.

The viewport should look like a real flight simulator window.

---

## 7. LIVE CHARTS & TELEMETRY (THE ENGINEERING DATA)

Real-time plots updating at frame rate, fed from a **ring buffer** of recent history (don't grow arrays unbounded):

- **Altitude vs Setpoint** over time (the classic step-response plot)
- **Attitude**: roll, pitch, yaw vs their setpoints
- **Error signals** per axis
- **Motor outputs** (4 live bars + optional time series)
Charts must show setpoint and actual as distinct lines so students literally watch overshoot, oscillation, settling, and steady-state error.

**Performance metrics** computed live in `metrics.ts` and shown in `MetricsCard`:
- Rise time, **Overshoot %**, **Settling time** (±2%), **Steady-state error**, peak.
These update after each step command — this is how a student *quantifies* good vs bad tuning.

Add an **SVG artificial-horizon attitude indicator** for an authentic avionics touch.

---

## 8. THE LEARNING LAYER (THE WHOLE POINT — PER THE SUPERVISOR)

The supervisor's exact requirement: *"make a way for students to actually learn something from the simulation."* So pedagogy is a first-class feature, not an afterthought.

Build a `Learn/` panel (collapsible side tab) with:

1. **Guided lessons** (`data/lessons.ts`) — short, well-written explanations:
   - What roll/pitch/yaw/throttle do (with a "try it" button that sets up the scenario).
   - What each PID term does: *P fights current error, I removes steady offset, D damps oscillation.* Each with a "demo" that sets gains to isolate the effect.
   - Why an under-actuated system (6 DOF, 4 inputs) behaves as it does.
2. **Interactive challenges** (`data/challenges.ts`) — graded tasks with pass/fail criteria using the live metrics:
   - "Tune altitude PID for <10% overshoot and <2s settling."
   - "Stabilize after a wind gust without oscillation."
   - "Reach target yaw with zero steady-state error."
   When the student's run meets the criteria (read from `metrics.ts`), show a clear **success state** (no emoji — use an SVG check + accent color + subtle animation).
3. **Cause→effect prompts**: small contextual hints that appear when the system misbehaves (e.g. "Sustained oscillation → your Kp may be too high or Kd too low").
4. **Presets** the student can load to *feel* the difference: `Well-Tuned`, `Sluggish (overdamped)`, `Oscillatory (underdamped)`, `Unstable`.

Learning is built into the loop: change a gain → see the 3D drone react → see the chart → read the metric → understand. That's the deliverable.

---

## 9. LAYOUT (DESKTOP-FIRST, RESPONSIVE)

A cohesive single-screen "lab console":
- **Center/left:** large 3D viewport (the drone in flight).
- **Right column:** Control Panel (gain sliders per axis, setpoints, toolbar, disturbances, presets).
- **Bottom:** live charts strip (altitude/attitude) + metrics cards + motor bars.
- **Slide-in Learn panel** for lessons/challenges.
- Top bar: title, sim status (RUNNING/PAUSED), speed control, reset.

Must be responsive enough to function inside an iframe at varying widths; gracefully stack panels on narrow viewports. Use `ResizeObserver` so the 3D canvas and charts resize correctly inside the iframe.

---

## 10. IFRAME EMBEDDING

- The app must run fully self-contained and be embeddable via `<iframe>` with no external login.
- Set appropriate headers/meta so it loads inside the LMS (don't set `X-Frame-Options: DENY`; allow framing from the academiq domain).
- No fixed pixel assumptions — use `100%` width/height and observe container resize.
- Keep first-load fast: lazy-load the GLB model and heavy scene; show a tasteful animated **loading state** (a spinning rotor SVG / telemetry boot sequence — on-theme, no emoji).
- Provide a `README.md` with run (`npm i && npm run dev`), build (`npm run build`), and the exact `<iframe>` snippet for the colleague's Next.js LMS.

---

## 11. CODE QUALITY

- TypeScript strict, fully typed (no `any` in physics or store).
- Pure, unit-testable physics functions; the PID and integrator should be testable in isolation.
- Comments in `physics/` explaining the equations and the chosen constants (so the supervisor sees real engineering).
- Performance: physics in fixed-step loop, charts via ring buffer, React renders minimized via Zustand selectors. Maintain 60fps render with 500Hz physics.
- Clean, consistent, no dead code, no console spam.

---

## 12. ACCEPTANCE CHECKLIST (THE BUILD IS DONE WHEN…)

- [ ] Design tokens extracted from `academiq-five.vercel.app/start` and applied; the lab visually belongs in the LMS.
- [ ] Distinctive, non-generic typography (NOT Inter/Roboto/Arial/Space Grotesk); mono telemetry readouts.
- [ ] Realistic 3D drone (GLB or detailed procedural) with **spinning props, LEDs, shadows** — not floating shapes.
- [ ] Full **6-DOF Newton-Euler** physics with **RK4 fixed-step** integration.
- [ ] **Independent tunable PID** (Kp/Ki/Kd) for altitude, roll, pitch, yaw, with anti-windup, derivative-on-measurement, motor saturation.
- [ ] Motor mixer producing 4 clamped motor outputs; saturation visibly affects flight.
- [ ] Live charts: altitude & attitude vs setpoint, errors, motor bars — smooth at 60fps.
- [ ] Live metrics: overshoot %, settling time, rise time, steady-state error.
- [ ] Disturbances: wind gust, payload change, motor fault.
- [ ] Learn panel: lessons + graded tuning challenges + presets that teach P/I/D behavior.
- [ ] Modular file structure — `App.tsx` is composition only.
- [ ] Runs and resizes correctly inside an `<iframe>`; README with embed snippet.
- [ ] Orchestrated staggered page-load animation; no AI-slop, no emoji, no lazy gradients.

Build all of it. Make it accurate, make it beautiful, make it teach.