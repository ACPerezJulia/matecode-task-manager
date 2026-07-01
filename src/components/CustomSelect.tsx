import { useState, useRef, useEffect } from 'react'

interface SelectOption<T extends string> {
  value: T
  label: string
}

interface CustomSelectProps<T extends string> {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  className?: string
  'aria-labelledby'?: string
}

export function CustomSelect<T extends string>({
  value,
  options,
  onChange,
  className,
  'aria-labelledby': ariaLabelledby,
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [])

  const selected = options.find((o) => o.value === value)

  return (
    <div
      className={`custom-select${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}
      ref={ref}
    >
      <button
        type="button"
        className="custom-select__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={ariaLabelledby}
      >
        <span>{selected?.label}</span>
        <span className="custom-select__arrow" aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul className="custom-select__dropdown" role="listbox">
          {options.map((option) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className={`custom-select__option${option.value === value ? ' is-selected' : ''}`}
              onClick={() => { onChange(option.value); setOpen(false) }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
