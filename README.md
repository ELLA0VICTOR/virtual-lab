# Quadrotor Virtual Laboratory

Web-based control systems lab for a final-year Mechatronics Engineering project at the Federal University of Technology, Minna. The app is a standalone Vite + React + TypeScript module designed to be embedded into the AcademIQ LMS with an iframe.

## Run Locally

```bash
npm i
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Build

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## LMS Embed

After deploying the built app, embed it in the LMS with:

```html
<iframe
  src="https://YOUR-VIRTUAL-LAB-DEPLOYMENT.example"
  title="Quadrotor Virtual Laboratory"
  style="width: 100%; height: 900px; border: 0; border-radius: 12px; overflow: hidden;"
  loading="lazy"
  allow="fullscreen"
></iframe>
```

Use a parent container that can grow on mobile. The app itself uses responsive grid layout and resize-aware charts/canvas.

## What Is Included

- Full 6-DOF Newton-Euler quadrotor dynamics with fixed-step RK4 integration at 500 Hz.
- Independent altitude, roll, pitch, and yaw PID loops with anti-windup and derivative-on-measurement behavior.
- Plus-configuration motor mixer with physical motor saturation and degradable motor factors.
- Procedural 3D drone with spinning propellers, navigation LEDs, shadows, setpoint marker, grid environment, and trajectory trail.
- Live uPlot charts for altitude, attitude, and error signals.
- Response metrics for rise time, overshoot, settling time, steady-state error, and peak response.
- Wind gust, payload mass, and motor fault disturbances.
- Guided lessons, tuning presets, and graded challenges.

## Design Integration

`DESIGN_TOKENS.md` documents the AcademIQ LMS tokens extracted from `https://academiq-five.vercel.app/start`. The lab maps those tokens into `src/theme.css` so the iframe keeps the host LMS typography, spacing rhythm, border radii, and brand accent while presenting a dark avionics console.
