import { TaskItem } from './TaskItem'
import type { Task } from '../types'

interface TodoListProps {
  tasks: Task[]
}

export function TodoList({ tasks }: TodoListProps) {
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
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="task-section__title">Completadas ({completed.length})</h2>
          <ul className="task-list">
            {completed.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
