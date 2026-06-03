interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  format?: (value: number) => string
  onChange: (value: number) => void
}

export function Slider({ label, value, min, max, step, unit = "", format, onChange }: SliderProps) {
  const display = format ? format(value) : value.toFixed(step < 0.1 ? 2 : 1)

  return (
    <label className="slider-control">
      <span className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">
          {display}
          {unit}
        </span>
      </span>
      <input
        className="range-input"
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  )
}
