import type { HTMLAttributes, ReactNode } from "react"

interface PanelProps extends HTMLAttributes<HTMLElement> {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}

export function Panel({ title, subtitle, action, className = "", children, ...props }: PanelProps) {
  return (
    <section className={`panel ${className}`.trim()} {...props}>
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{title}</h2>
          {subtitle ? <p className="panel-subtitle">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
