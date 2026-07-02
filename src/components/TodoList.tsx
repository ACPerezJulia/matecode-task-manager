import { IconTrashX } from '@tabler/icons-react'
import { TaskCard } from './TaskCard'
import type { Task } from '../types'

interface TodoListProps {
  tasks: Task[]
  onDeleteCompleted?: () => void
  onDeleteRequest: (task: Task) => void
}

export function TodoList({ tasks, onDeleteCompleted, onDeleteRequest }: TodoListProps) {
  if (tasks.length === 0) {
    return <p className="empty">No hay tareas que coincidan con el filtro.</p>
  }

  const pending = tasks.filter((t) => !t.completed)
  const completed = tasks.filter((t) => t.completed)

  return (
    <div className="task-grid-wrap">
      {pending.length > 0 && (
        <section>
          <h2 className="task-section__title">Pendientes ({pending.length})</h2>
          <ul className="task-list">
            {pending.map((task) => (
              <TaskCard key={task.id} task={task} onDeleteRequest={onDeleteRequest} variant="list" />
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
          <ul className="task-list">
            {completed.map((task) => (
              <TaskCard key={task.id} task={task} onDeleteRequest={onDeleteRequest} variant="list" />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
