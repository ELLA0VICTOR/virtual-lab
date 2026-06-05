import { useEffect, useMemo, useRef } from "react"
import uPlot from "uplot"
import { formatRadiansAsDegrees } from "../../physics/vector"
import { useSimulationStore } from "../../simulation/simulationStore"
import { Panel } from "../ui/Panel"

type ChartMode = "altitude" | "attitude" | "error"

interface LiveChartProps {
  mode: ChartMode
}

const makeSeries = (mode: ChartMode, colors: CSSStyleDeclaration): uPlot.Series[] => {
  const live = colors.getPropertyValue("--accent-live").trim() || "#37e39f"
  const amber = colors.getPropertyValue("--accent-amber").trim() || "#f6b44b"
  const cyan = colors.getPropertyValue("--accent-cyan").trim() || "#6ee7f9"
  const danger = colors.getPropertyValue("--danger").trim() || "#f87171"
  const muted = colors.getPropertyValue("--text-muted").trim() || "#6f8583"

  if (mode === "altitude") {
    return [
      {},
      { label: "Altitude", stroke: live, width: 2 },
      { label: "Setpoint", stroke: amber, dash: [6, 4], width: 2 },
    ]
  }

  if (mode === "attitude") {
    return [
      {},
      { label: "Roll", stroke: live, width: 1.6 },
      { label: "Roll SP", stroke: live, dash: [6, 4], width: 1 },
      { label: "Pitch", stroke: cyan, width: 1.6 },
      { label: "Pitch SP", stroke: cyan, dash: [6, 4], width: 1 },
      { label: "Yaw", stroke: amber, width: 1.6 },
      { label: "Yaw SP", stroke: amber, dash: [6, 4], width: 1 },
    ]
  }

  return [
    {},
    { label: "Altitude Error", stroke: danger, width: 1.8 },
    { label: "Roll Error", stroke: live, width: 1.2 },
    { label: "Pitch Error", stroke: cyan, width: 1.2 },
    { label: "Yaw Error", stroke: muted, width: 1.2 },
  ]
}

const makeData = (mode: ChartMode, history: ReturnType<typeof useSimulationStore.getState>["history"]): uPlot.AlignedData => {
  const x = history.map((sample) => sample.t)

  if (mode === "altitude") {
    return [x, history.map((sample) => sample.altitude), history.map((sample) => sample.altitudeSetpoint)]
  }

  if (mode === "attitude") {
    return [
      x,
      history.map((sample) => formatRadiansAsDegrees(sample.roll)),
      history.map((sample) => formatRadiansAsDegrees(sample.rollSetpoint)),
      history.map((sample) => formatRadiansAsDegrees(sample.pitch)),
      history.map((sample) => formatRadiansAsDegrees(sample.pitchSetpoint)),
      history.map((sample) => formatRadiansAsDegrees(sample.yaw)),
      history.map((sample) => formatRadiansAsDegrees(sample.yawSetpoint)),
    ]
  }

  return [
    x,
    history.map((sample) => sample.altitudeError),
    history.map((sample) => formatRadiansAsDegrees(sample.rollError)),
    history.map((sample) => formatRadiansAsDegrees(sample.pitchError)),
    history.map((sample) => formatRadiansAsDegrees(sample.yawError)),
  ]
}

const titleFor = (mode: ChartMode): string => {
  if (mode === "altitude") return "Altitude Tracking"
  if (mode === "attitude") return "Attitude Tracking"
  return "Tracking Error Signals"
}

export function LiveChart({ mode }: LiveChartProps) {
  const history = useSimulationStore((state) => state.history)
  const hostRef = useRef<HTMLDivElement | null>(null)
  const plotRef = useRef<uPlot | null>(null)
  const data = useMemo(() => makeData(mode, history), [history, mode])
  const dataRef = useRef<uPlot.AlignedData>(data)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const styles = getComputedStyle(document.documentElement)
    const plot = new uPlot(
      {
        title: titleFor(mode),
        width: Math.max(260, host.clientWidth),
        height: 185,
        legend: { show: false },
        cursor: { show: true },
        scales: {
          x: { time: false },
        },
        axes: [
          { stroke: styles.getPropertyValue("--text-muted").trim() || "#6f8583", grid: { stroke: "rgba(148,163,184,0.12)" } },
          { stroke: styles.getPropertyValue("--text-muted").trim() || "#6f8583", grid: { stroke: "rgba(148,163,184,0.08)" } },
        ],
        series: makeSeries(mode, styles),
      },
      dataRef.current,
      host,
    )

    plotRef.current = plot
    const resizeObserver = new ResizeObserver(() => {
      plot.setSize({ width: Math.max(260, host.clientWidth), height: 185 })
    })
    resizeObserver.observe(host)

    return () => {
      resizeObserver.disconnect()
      plot.destroy()
      plotRef.current = null
    }
  }, [mode])

  useEffect(() => {
    dataRef.current = data
    plotRef.current?.setData(data)
  }, [data])

  return (
    <Panel title={titleFor(mode)} className="chart-panel" data-guide="charts">
      <div className="chart-host" ref={hostRef} />
    </Panel>
  )
}
