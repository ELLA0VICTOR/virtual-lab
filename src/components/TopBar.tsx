import { useEffect, useState } from "react"
import { FiBookOpen, FiMoon, FiSun } from "react-icons/fi"
import { useSimulationStore } from "../simulation/simulationStore"
import { Badge } from "./ui/Badge"
import { Button } from "./ui/Button"

function VirtualLabMark() {
  return (
    <svg aria-hidden="true" className="brand-logo-svg" viewBox="0 0 64 64">
      <path
        d="M8 45.5c8.4 9.8 23.7 13.9 36.2 8.7 5-2.1 8.9-5.4 11.8-9.4-1.3 7.5-8.5 14.6-18.9 17.3C25 65.2 12.8 60.7 8 45.5Z"
        fill="#0284c7"
        opacity="0.9"
      />
      <circle cx="32" cy="31" r="28" fill="#fff" stroke="#6b0472" strokeWidth="4" />
      <circle cx="32" cy="31" r="24" fill="none" stroke="#d7b300" strokeWidth="2.4" />
      <circle cx="32" cy="31" r="20" fill="none" stroke="#0284c7" strokeWidth="1.8" />
      <path
        d="M32 11.8 38.8 25.2 52.2 31 38.8 36.8 32 50.2 25.2 36.8 11.8 31 25.2 25.2 32 11.8Z"
        fill="#fff"
        stroke="#020617"
        strokeLinejoin="round"
        strokeWidth="3.2"
      />
      <path
        d="M32 19.3 35.8 28 44.7 31 35.8 34 32 42.7 28.2 34 19.3 31 28.2 28 32 19.3Z"
        fill="#f8fafc"
        stroke="#6b0472"
        strokeLinejoin="round"
        strokeWidth="1.25"
        opacity="0.92"
      />
      <circle cx="24.2" cy="23.2" r="5.8" fill="none" stroke="#94a3b8" strokeWidth="1.4" />
      <circle cx="39.8" cy="23.2" r="5.8" fill="none" stroke="#94a3b8" strokeWidth="1.4" />
      <circle cx="24.2" cy="38.8" r="5.8" fill="none" stroke="#94a3b8" strokeWidth="1.4" />
      <circle cx="39.8" cy="38.8" r="5.8" fill="none" stroke="#94a3b8" strokeWidth="1.4" />
      <circle cx="32" cy="31" r="4.1" fill="#fff" stroke="#475569" strokeWidth="1.2" />
      <path
        d="M32 26.2v9.6M27.2 31h9.6M28.6 27.6l6.8 6.8M35.4 27.6l-6.8 6.8"
        fill="none"
        stroke="#6b0472"
        strokeLinecap="round"
        strokeWidth="1"
      />
    </svg>
  )
}

export function TopBar() {
  const running = useSimulationStore((state) => state.running)
  const speed = useSimulationStore((state) => state.speed)
  const elapsed = useSimulationStore((state) => state.elapsed)
  const setLearnOpen = useSimulationStore((state) => state.setLearnOpen)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <header className="top-bar boot-reveal" style={{ animationDelay: "0ms" }}>
      <div className="brand-block">
        <div className="brand-mark">
          <VirtualLabMark />
        </div>
        <div className="brand-copy">
          <h1>Virtual Lab</h1>
        </div>
      </div>
      <div className="top-actions">
        <Badge tone={running ? "live" : "warn"}>{running ? "Running" : "Paused"}</Badge>
        <Badge>{speed.toFixed(speed < 1 ? 2 : 0)}x</Badge>
        <Badge>{elapsed.toFixed(1)} s</Badge>
        <Button icon={FiBookOpen} onClick={() => setLearnOpen(true)}>
          Learn
        </Button>
        <Button
          icon={theme === "light" ? FiMoon : FiSun}
          iconOnly
          onClick={() => setTheme((value) => (value === "light" ? "dark" : "light"))}
        >
          Toggle theme
        </Button>
      </div>
    </header>
  )
}
