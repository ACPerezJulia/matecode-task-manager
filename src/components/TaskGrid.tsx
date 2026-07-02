import { IconTrashX } from '@tabler/icons-react'
import { TaskCard } from './TaskCard'
import type { Task } from '../types'

interface TaskGridProps {
  tasks: Task[]
  onDeleteCompleted?: () => void
  onDeleteRequest: (task: Task) => void
}

export function TaskGrid({ tasks, onDeleteCompleted, onDeleteRequest }: TaskGridProps) {
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
              <TaskCard key={task.id} task={task} onDeleteRequest={onDeleteRequest} variant="grid" />
            ))}
          </ul>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="task-section__title">
            Completadas ({completed.length})
            {onDeleteCompleted && (
              <button
                type="button"
                className="section-clean-btn"
                onClick={onDeleteCompleted}
                title="Eliminar todas las completadas"
              >
                <IconTrashX size={16} />
              </button>
            )}
          </h2>
          <ul className="task-grid">
            {completed.map((task) => (
              <TaskCard key={task.id} task={task} onDeleteRequest={onDeleteRequest} variant="grid" />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
