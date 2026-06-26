interface TaskActionsProps {
  onEdit: () => void
  onDelete: () => void
  disabled?: boolean
}

/**
 * Botones de editar / eliminar con íconos SVG (lápiz / tacho, estilo Feather).
 * Compartidos por lista y grid: en el grid se muestran solo al hacer hover
 * sobre la card (eso se maneja por CSS, no acá).
 */
export function TaskActions({ onEdit, onDelete, disabled }: TaskActionsProps) {
  return (
    <div className="task-actions">
      <button
        type="button"
        className="icon-btn"
        onClick={onEdit}
        disabled={disabled}
        aria-label="Editar tarea"
        title="Editar tarea"
      >
        {/* Ícono de lápiz */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      </button>
      <button
        type="button"
        className="icon-btn icon-btn--danger"
        onClick={onDelete}
        disabled={disabled}
        aria-label="Eliminar tarea"
        title="Eliminar tarea"
      >
        {/* Ícono de tacho */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>
    </div>
  )
}
