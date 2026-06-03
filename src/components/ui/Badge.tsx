import type { ReactNode } from "react"

interface BadgeProps {
  tone?: "neutral" | "live" | "warn"
  children: ReactNode
}

export function Badge({ tone = "neutral", children }: BadgeProps) {
  const toneClass = tone === "live" ? "badge-live" : tone === "warn" ? "badge-warn" : ""
  return <span className={`badge ${toneClass}`.trim()}>{children}</span>
}
