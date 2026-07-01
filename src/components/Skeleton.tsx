interface SkeletonProps {
  width?: string
  height?: string
}

/**
 * Bloque gris reutilizable con animación shimmer (definida en index.css).
 * aria-hidden: es puramente visual, no aporta nada a lectores de pantalla.
 */
export function Skeleton({ width = '100%', height = '1rem' }: SkeletonProps) {
  return (
    <span className="skeleton" style={{ width, height }} aria-hidden="true" />
  )
}

/**
 * Placeholder con la forma de varias tareas, para mostrar mientras cargan
 * los datos (en vez de un spinner genérico). count = cuántas filas simular.
 * view determina si se pinta en formato lista o grilla, para evitar layout shift.
 */
export function TaskListSkeleton({
  count = 3,
  view = 'list',
}: {
  count?: number
  view?: 'list' | 'grid'
}) {
  if (view === 'grid') {
    return (
      <ul className="task-grid" aria-busy="true" aria-label="Cargando tareas">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <span className="skeleton" style={{ display: 'block', width: '100%', height: '6px' }} aria-hidden="true" />
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Skeleton width="65%" height="1.1rem" />
              <Skeleton width="90%" height="0.85rem" />
              <Skeleton width="50%" height="0.75rem" />
            </div>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className="task-list" aria-busy="true" aria-label="Cargando tareas">
      {Array.from({ length: count }).map((_, i) => (
        <li className="task-item card" key={i}>
          <Skeleton width="60%" height="1.2rem" />
          <Skeleton width="90%" height="0.9rem" />
        </li>
      ))}
    </ul>
  )
}
