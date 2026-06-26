import type { ViewMode } from '../hooks/useViewMode'

interface ViewToggleProps {
  view: ViewMode
  onChange: (view: ViewMode) => void
}

/**
 * Botón segmentado Lista / Grid. La preferencia se persiste en localStorage
 * (eso lo maneja useViewMode, no este componente).
 */
export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="view-toggle" role="group" aria-label="Vista">
      <button
        type="button"
        className={`view-toggle__btn${view === 'list' ? ' is-active' : ''}`}
        onClick={() => onChange('list')}
        aria-pressed={view === 'list'}
      >
        {/* Ícono de lista (líneas) */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        Lista
      </button>
      <button
        type="button"
        className={`view-toggle__btn${view === 'grid' ? ' is-active' : ''}`}
        onClick={() => onChange('grid')}
        aria-pressed={view === 'grid'}
      >
        {/* Ícono de grilla (4 cuadrados) */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
        Grid
      </button>
    </div>
  )
}
