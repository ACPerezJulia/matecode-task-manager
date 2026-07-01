import { useState, useRef, useEffect, useId } from 'react'

interface SelectOption<T extends string> {
  value: T
  label: string
}

interface CustomSelectProps<T extends string> {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  className?: string
  'aria-label'?: string
}

export function CustomSelect<T extends string>({
  value,
  options,
  onChange,
  className,
  'aria-label': ariaLabel,
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const uid = useId()

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  function openDropdown() {
    const idx = options.findIndex((o) => o.value === value)
    setActiveIndex(idx >= 0 ? idx : 0)
    setOpen(true)
  }

  function select(optionValue: T) {
    onChange(optionValue)
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openDropdown()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % options.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + options.length) % options.length)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (activeIndex >= 0) select(options[activeIndex].value)
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(options.length - 1)
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  const selected = options.find((o) => o.value === value)
  const activeDescendant = open && activeIndex >= 0 ? `${uid}-opt-${activeIndex}` : undefined

  return (
    <div
      className={`custom-select${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`}
      ref={ref}
    >
      <button
        type="button"
        className="custom-select__trigger"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-activedescendant={activeDescendant}
      >
        <span>{selected?.label}</span>
        <span className="custom-select__arrow" aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul className="custom-select__dropdown" role="listbox">
          {options.map((option, i) => (
            <li
              key={option.value}
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={option.value === value}
              className={`custom-select__option${option.value === value ? ' is-selected' : ''}${i === activeIndex ? ' is-active' : ''}`}
              onClick={() => select(option.value)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
