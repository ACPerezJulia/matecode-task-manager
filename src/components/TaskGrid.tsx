import { TaskCard } from './TaskCard'
import type { Task } from '../types'

interface TaskGridProps {
  tasks: Task[]
}

/**
 * Vista GRID: separa las tareas en Pendientes y Completadas, cada sección con
 * su título, contador y línea divisoria, y las muestra como cards en una
 * grilla responsiva. Cada sección se renderiza solo si tiene tareas.
 */
export function TaskGrid({ tasks }: TaskGridProps) {
  // Caso "sin resultados" (ej: un filtro que no matchea nada).
  if (tasks.length === 0) {
    return <p className="empty">No hay tareas que coincidan con el filtro.</p>
  }

  const pending = tasks.filter((task) => !task.completed)
  const completed = tasks.filter((task) => task.completed)

  return (
    <div className="task-grid-wrap">
      {pending.length > 0 && (
        <section>
          <h2 className="task-section__title">Pendientes ({pending.length})</h2>
          <ul className="task-grid">
            {pending.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </ul>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="task-section__title">Completadas ({completed.length})</h2>
          <ul className="task-grid">
            {completed.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </ul>
        </section>
      )}

    </div>
  )
}
