import { useState } from "react"
import { DisturbancePanel } from "./components/ControlPanel/DisturbancePanel"
import { GainSliders } from "./components/ControlPanel/GainSliders"
import { MissionPanel } from "./components/ControlPanel/MissionPanel"
import { PilotControls } from "./components/ControlPanel/PilotControls"
import { PresetSelector } from "./components/ControlPanel/PresetSelector"
import { SetpointControls } from "./components/ControlPanel/SetpointControls"
import { SimToolbar } from "./components/ControlPanel/SimToolbar"
import { LessonPanel } from "./components/Learn/LessonPanel"
import { AttitudeIndicator } from "./components/Telemetry/AttitudeIndicator"
import { LiveChart } from "./components/Telemetry/LiveChart"
import { MetricsCard } from "./components/Telemetry/MetricsCard"
import { MotorBars } from "./components/Telemetry/MotorBars"
import { TopBar } from "./components/TopBar"
import { DroneScene } from "./scene/DroneScene"
import { useSimulationLoop } from "./simulation/useSimulationLoop"

type ControlTab = "flight" | "tune" | "test"

function App() {
  useSimulationLoop()
  const [controlTab, setControlTab] = useState<ControlTab>("flight")

  return (
    <main className="lab-shell">
      <div className="lab-console">
        <TopBar />
        <div className="workspace-grid">
          <DroneScene />
          <aside className="control-column boot-reveal" style={{ animationDelay: "150ms" }}>
            <PilotControls />
            <div className="dock-tabs">
              {(["flight", "tune", "test"] as const).map((tab) => (
                <button
                  className={`dock-tab ${controlTab === tab ? "active" : ""}`.trim()}
                  key={tab}
                  type="button"
                  onClick={() => setControlTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            {controlTab === "flight" ? (
              <>
                <SimToolbar />
                <MissionPanel />
                <PresetSelector />
              </>
            ) : null}
            {controlTab === "tune" ? (
              <>
                <GainSliders />
                <SetpointControls />
                <MetricsCard />
              </>
            ) : null}
            {controlTab === "test" ? (
              <>
                <DisturbancePanel />
                <MotorBars />
                <AttitudeIndicator />
              </>
            ) : null}
          </aside>
        </div>
        <section className="bottom-grid charts-only boot-reveal" style={{ animationDelay: "220ms" }}>
          <LiveChart mode="altitude" />
          <LiveChart mode="attitude" />
          <LiveChart mode="error" />
        </section>
      </div>
      <LessonPanel />
    </main>
  )
}

export default App
