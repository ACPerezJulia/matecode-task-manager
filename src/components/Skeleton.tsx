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
 */
export function TaskListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="task-list" aria-busy="true" aria-label="Cargando tareas">
      {Array.from({ length: count }).map((_, index) => (
        <li className="task-item card" key={index}>
          {/* línea del título y línea de la descripción */}
          <Skeleton width="60%" height="1.2rem" />
          <Skeleton width="90%" height="0.9rem" />
        </li>
      ))}
    </ul>
  )
}
