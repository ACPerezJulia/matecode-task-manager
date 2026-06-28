interface TaskCheckProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}

/**
 * Check circular: un checkbox nativo (accesible) estilado como un círculo que
 * se llena de color con un ✓ al completar. El estilo vive en components.css
 * (.task-check). Lo usan lista y grid.
 */
export function TaskCheck({ checked, onChange, disabled }: TaskCheckProps) {
  return (
    <input
      type="checkbox"
      className="task-check"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      aria-label="Completada"
    />
  )
}
