import type { ButtonHTMLAttributes, ReactNode } from "react"
import type { IconType } from "react-icons"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: IconType
  variant?: "default" | "primary" | "danger"
  iconOnly?: boolean
  children?: ReactNode
}

export function Button({ icon: Icon, variant = "default", iconOnly = false, className = "", children, ...props }: ButtonProps) {
  const variantClass = variant === "primary" ? "button-primary" : variant === "danger" ? "button-danger" : ""
  const iconClass = iconOnly ? "icon-button" : ""

  return (
    <button className={`button ${variantClass} ${iconClass} ${className}`.trim()} type="button" {...props}>
      {Icon ? <Icon aria-hidden="true" size={16} /> : null}
      {iconOnly ? <span className="sr-only">{children}</span> : children}
    </button>
  )
}
