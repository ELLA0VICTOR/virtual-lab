interface TabProps<T extends string> {
  value: T
  activeValue: T
  label: string
  onSelect: (value: T) => void
}

export function Tab<T extends string>({ value, activeValue, label, onSelect }: TabProps<T>) {
  return (
    <button
      className={`tab-button ${value === activeValue ? "active" : ""}`.trim()}
      type="button"
      onClick={() => onSelect(value)}
    >
      {label}
    </button>
  )
}
